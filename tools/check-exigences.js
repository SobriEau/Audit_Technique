/**
 * Contrôle des exigences : la validation d'une fiche est-elle praticable ?
 *
 * La fiche refuse d'enregistrer tant qu'un champ obligatoire est vide. Mal
 * réglée, cette règle ne produit aucune erreur visible — elle empêche juste
 * l'auditeur d'avancer. C'est arrivé : la validation reprise d'origin/main
 * exigeait les champs de l'autolaveuse pour enregistrer un lave-linge, et ceux
 * de la baignoire pour une douche.
 *
 * Ce script compile `src/app/qte/exigences.ts` avec le schéma réel, puis
 * rejoue des saisies :
 *  - pour **chaque entité** et chaque valeur de chaque bloc conditionnel, une
 *    fiche dont on remplit exactement les champs exigés doit être validable ;
 *  - un bloc inactif ne doit rien exiger ;
 *  - un champ exigé laissé vide doit bloquer.
 *
 *   node tools/check-exigences.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'sobrieau-exigences-'));

try {
  execFileSync(
    process.execPath,
    [
      require.resolve('typescript/bin/tsc'),
      '--outDir', OUT,
      '--module', 'commonjs',
      '--target', 'es2020',
      '--skipLibCheck',
      '--rootDir', path.join(ROOT, 'src'),
      path.join(ROOT, 'src/app/qte/exigences.ts'),
      path.join(ROOT, 'src/app/models/audit-schema.ts'),
    ],
    { stdio: 'inherit' }
  );
} catch (e) {
  console.error('Compilation impossible — voir ci-dessus.');
  process.exit(2);
}

const { AUDIT_SCHEMA } = require(path.join(OUT, 'app/models/audit-schema.js'));
const { champsManquants, champsMasques, requirementVisible } = require(path.join(OUT, 'app/qte/exigences.js'));

let echecs = 0;
const ok = (cond, message) => {
  if (!cond) {
    echecs++;
    console.log('  ✗ ' + message);
  }
};

/** Une valeur plausible pour un champ, selon son type. */
function valeur(f) {
  if (f.kind === 'boolean') return false;
  if (f.kind === 'number') return 1;
  if (f.kind === 'select' && f.options && f.options.length) return f.options[0];
  return 'x';
}

/** Remplit les champs exigés, jusqu'à ce que la fiche soit validable. */
function remplirExiges(def, item) {
  for (let tour = 0; tour < 5; tour++) {
    const manquants = champsManquants(def, item);
    if (!manquants.length) return item;
    for (const f of manquants) item[f.key] = valeur(f);
  }
  return item;
}

console.log('\nCONTRÔLE DES EXIGENCES — la validation est-elle praticable ?\n');

for (const def of AUDIT_SCHEMA) {
  const blocs = def.blocsConditionnels || [];
  const scenarios = [{ nom: 'aucun bloc conditionnel activé', commandes: {} }];
  for (const b of blocs) {
    for (const v of b.valeurs) scenarios.push({ nom: `${b.champ} = ${JSON.stringify(v)}`, commandes: { [b.champ]: v }, bloc: b.bloc });
  }

  let exiges = 0;
  for (const s of scenarios) {
    const item = remplirExiges(def, { ...s.commandes });
    ok(champsManquants(def, item).length === 0, `${def.key} [${s.nom}] : la fiche reste invalidable`);
    // La valeur de commande ne doit pas avoir été écrasée par le remplissage.
    for (const [k, v] of Object.entries(s.commandes)) {
      ok(item[k] === v, `${def.key} [${s.nom}] : le champ de commande ${k} a été modifié`);
    }

    // Un bloc inactif n'exige rien.
    if (s.bloc) {
      const autres = blocs.filter((b) => b.bloc !== s.bloc && !b.valeurs.includes(s.commandes[b.champ]));
      for (const autre of autres) {
        const exigeAilleurs = champsManquants(def, { ...s.commandes }).filter((f) => f.bloc === autre.bloc);
        ok(exigeAilleurs.length === 0, `${def.key} [${s.nom}] : exige ${exigeAilleurs.length} champ(s) du bloc inactif « ${autre.bloc} »`);
      }
    }

    // Un champ exigé laissé vide bloque.
    const exigesIci = Object.keys(item).filter((k) => !(k in s.commandes));
    exiges = Math.max(exiges, exigesIci.length);
    if (exigesIci.length) {
      const vide = { ...item, [exigesIci[0]]: '' };
      ok(champsManquants(def, vide).length === 1, `${def.key} [${s.nom}] : vider « ${exigesIci[0]} » ne bloque pas`);
    }
  }

  // Au niveau « minimal », seuls les obligatoires restent visibles.
  const visiblesMinimal = def.fields.filter((f) => f.kind !== 'photos' && requirementVisible(f.requirement, 'minimal'));
  ok(visiblesMinimal.every((f) => f.requirement === 'obligatoire'), `${def.key} : niveau minimal affiche un champ non obligatoire`);
  ok(
    champsMasques(def, 'complet', new Set()).length === 0,
    `${def.key} : niveau complet masque des champs`
  );

  console.log(
    `  ${def.key.padEnd(30)} ${String(scenarios.length).padStart(2)} scénario(s), ` +
      `jusqu'à ${exiges} champ(s) exigé(s)`
  );
}

// ── Témoin : la règle d'origin/main, sans blocs conditionnels ────────────────
const lavage = AUDIT_SCHEMA.find((d) => d.key === 'appareils_lavage');
if (lavage) {
  const sansBlocs = { ...lavage, blocsConditionnels: [] };
  const item = remplirExiges(lavage, { Type: 'lave linge' });
  const bloquants = champsManquants(sansBlocs, item);
  console.log(
    `\nTémoin — un lave-linge complet, sous la règle d'origin/main : ` +
      `${bloquants.length} champ(s) d'autres appareils bloqueraient l'enregistrement` +
      (bloquants.length ? ` (${[...new Set(bloquants.map((f) => f.bloc))].join(', ')})` : '')
  );
}

fs.rmSync(OUT, { recursive: true, force: true });
console.log(echecs ? `\n${echecs} échec(s).` : '\nToutes les fiches sont validables, et seulement sur ce qui les concerne.');
process.exit(echecs ? 1 : 0);
