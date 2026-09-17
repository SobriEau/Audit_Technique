/**
 * Génère les contenus que le classeur donne mot pour mot, et qui ne sont pas
 * des fiches d'équipement :
 *
 *  - `src/app/models/glossaire.ts`           ← onglet « Tableau de bord », bas de page
 *  - `src/app/models/documents-collectes.ts` ← onglet « Documents collectés »
 *
 * Ces deux-là se régénèrent sans risque, contrairement à `value-lists.ts` :
 * il n'y a aucun arbitrage à faire, aucune clé de stockage ne dépend de leur
 * libellé, et l'auditeur ne saisit rien dedans qu'un identifiant stable ne
 * porte déjà.
 *
 *   node tools/gen-pages.js
 */
const fs = require('fs');
const path = require('path');
const wb = require('./.cache/workbook.json');
const { colOf, rowOf, colNum, normCell, requirementOf, strip } = require('./lib/classeur');

const sheetByName = (n) =>
  wb.sheets.find((s) => s.name === n) || wb.sheets.find((s) => s.name.trim() === n);

/** Cellules d'une feuille, indexées `ligne:colonne`. */
function grille(sheet) {
  const g = new Map();
  for (const [ref, cell] of Object.entries(sheet.cells)) {
    const v = String(cell.v == null ? '' : cell.v).trim();
    if (v) g.set(rowOf(ref) + ':' + colNum(colOf(ref)), v.replace(/\s+/g, ' '));
  }
  return g;
}

const q = (s) => JSON.stringify(s);

// ── Glossaire ──────────────────────────────────────────────────────────────

function genGlossaire() {
  const sheet = sheetByName('Tableau de bord');
  if (!sheet) throw new Error('onglet « Tableau de bord » absent');
  const g = grille(sheet);

  // Le glossaire commence à la ligne qui porte le mot « Glossaire » en colonne B.
  let debut = null;
  for (const [k, v] of g) {
    const [r, c] = k.split(':').map(Number);
    if (c === 2 && normCell(v) === 'glossaire') debut = r;
  }
  if (debut === null) throw new Error('intitulé « Glossaire » introuvable');

  const entrees = [];
  for (let r = debut + 1; r <= debut + 60; r++) {
    const terme = g.get(r + ':2');
    const def = g.get(r + ':3');
    // `trim()` obligatoire : le classeur laisse des espaces en fin de plusieurs
    // termes (« eau NC », « Eau Froide Sanitaire »).
    if (terme && def) entrees.push({ terme: terme.trim(), definition: def.trim() });
  }

  const out = [];
  out.push(`/**`);
  out.push(` * Glossaire de l'audit — GÉNÉRÉ depuis \`audit_technique.xlsx\`.`);
  out.push(` *`);
  out.push(` * Repris mot pour mot du bas de l'onglet « Tableau de bord ». Six entrées ne`);
  out.push(` * sont pas des sigles mais des notions (« Plénum », « Eau de ruissellement »)`);
  out.push(` * — d'où le titre « Glossaire » plutôt que « Sigles ».`);
  out.push(` *`);
  out.push(` * Régénérer avec \`node tools/gen-pages.js\`. Ne pas éditer à la main.`);
  out.push(` */`);
  out.push(`export interface EntreeGlossaire {`);
  out.push(`  terme: string;`);
  out.push(`  definition: string;`);
  out.push(`}`);
  out.push('');
  out.push(`export const GLOSSAIRE: EntreeGlossaire[] = [`);
  for (const e of entrees) out.push(`  { terme: ${q(e.terme)}, definition: ${q(e.definition)} },`);
  out.push(`];`);
  out.push('');

  fs.writeFileSync(path.join(__dirname, '..', 'src', 'app', 'models', 'glossaire.ts'), out.join('\n'), 'utf8');
  return entrees.length;
}

// ── Documents à collecter ──────────────────────────────────────────────────

function genDocuments() {
  const sheet = sheetByName('Documents collectés');
  if (!sheet) throw new Error('onglet « Documents collectés » absent');
  const g = grille(sheet);

  const lignes = [...new Set([...g.keys()].map((k) => Number(k.split(':')[0])))].sort((a, b) => a - b);

  const docs = [];
  let libres = 0;

  for (const r of lignes) {
    if (r < 8) continue; // fil d'Ariane et titre
    const libelle = g.get(r + ':2');
    if (!libelle) continue;
    if (normCell(libelle) === 'valider') continue;

    // « Autre, préciser : » — une ligne de saisie libre, pas une case à cocher.
    if (/^autre,?\s*pr[ée]ciser/i.test(libelle)) {
      libres++;
      docs.push({ id: `autre-${libres}`, libelle: 'Autre, préciser :', libre: true, requirement: null });
      continue;
    }

    // L'exigence est sur la même ligne, à droite du libellé fusionné.
    let requirement = null;
    for (const [k, v] of g) {
      const [rr, cc] = k.split(':').map(Number);
      if (rr === r && cc > 2 && requirementOf(v)) requirement = requirementOf(v);
    }

    docs.push({
      id: 'doc-' + String(r).padStart(2, '0'),
      libelle,
      libre: false,
      requirement,
    });
  }

  const out = [];
  out.push(`import { FieldRequirement } from './field.models';`);
  out.push('');
  out.push(`/**`);
  out.push(` * Documents à réunir avant ou pendant la visite — GÉNÉRÉ depuis`);
  out.push(` * \`audit_technique.xlsx\`, onglet « Documents collectés ».`);
  out.push(` *`);
  out.push(` * Le classeur n'attend **aucun téléversement** : seulement une case cochée`);
  out.push(` * quand le document a pu être récupéré. La V2 demandait encore « prise de`);
  out.push(` * photo et ajout au dossier » ; la V3 a retiré cette note.`);
  out.push(` *`);
  out.push(` * L'\`id\` est stable et **ne dérive pas du libellé** : reformuler un intitulé`);
  out.push(` * dans le classeur ne doit pas décocher la case d'un audit déjà rempli.`);
  out.push(` *`);
  out.push(` * Régénérer avec \`node tools/gen-pages.js\`. Ne pas éditer à la main.`);
  out.push(` */`);
  out.push(`export interface DocumentACollecter {`);
  out.push(`  /** Identité stable, indépendante du libellé. */`);
  out.push(`  id: string;`);
  out.push(`  libelle: string;`);
  out.push(`  /** Ligne libre « Autre, préciser : » plutôt qu'une case à cocher. */`);
  out.push(`  libre: boolean;`);
  out.push(`  requirement?: FieldRequirement;`);
  out.push(`}`);
  out.push('');
  out.push(`export const DOCUMENTS_A_COLLECTER: DocumentACollecter[] = [`);
  for (const d of docs) {
    const parts = [`id: ${q(d.id)}`, `libelle: ${q(d.libelle)}`, `libre: ${d.libre}`];
    if (d.requirement) parts.push(`requirement: ${q(d.requirement)}`);
    out.push(`  { ${parts.join(', ')} },`);
  }
  out.push(`];`);
  out.push('');

  fs.writeFileSync(
    path.join(__dirname, '..', 'src', 'app', 'models', 'documents-collectes.ts'),
    out.join('\n'),
    'utf8'
  );
  return { total: docs.length, libres };
}

const nGlossaire = genGlossaire();
const doc = genDocuments();
console.log(`glossaire.ts            ${nGlossaire} entrées`);
console.log(`documents-collectes.ts  ${doc.total} lignes, dont ${doc.libres} libres`);
