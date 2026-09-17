/**
 * Construit le référentiel des listes de valeurs, dans
 * `docs/audit/referentiel-listes.md`.
 *
 * La V1 du classeur portait deux sources à confronter : un onglet catalogue
 * « Infos audit partie technique » et les énumérations écrites dans les notes
 * de chaque page. Depuis la V2, l'onglet catalogue n'existe plus — la seule
 * source est les notes.
 *
 * En l'absence d'un second référentiel, le risque de divergence se déplace à
 * l'intérieur même du classeur : un même libellé peut apparaître sur plusieurs
 * fiches, ou plusieurs fois sur la même, avec des jeux d'options différents.
 * C'est ce que ce script détecte.
 *
 * **Il lit `audit-schema.ts`, et non le classeur.** Rejouer une troisième
 * lecture des notes le faisait diverger des deux autres : il regroupait des
 * listes sans rapport sous les mots « Obligatoire » et « Facultatif » voisins,
 * et fabriquait ainsi deux divergences entièrement fictives, qui appelaient un
 * arbitrage humain sur des données inventées.
 *
 *   node tools/gen-referentiel.js
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'docs', 'audit');
const SCHEMA = path.join(__dirname, '..', 'src', 'app', 'models', 'audit-schema.ts');
const VALUE_LISTS = path.join(__dirname, '..', 'src', 'app', 'models', 'value-lists.ts');

const norm = (s) =>
  String(s == null ? '' : s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const normSet = (a) => a.map(norm).sort().join(' | ');

// ── Lecture du schéma généré ───────────────────────────────────────────────

const src = fs.readFileSync(SCHEMA, 'utf8');
const champs = [];

for (const bloc of src.split(/\n  \{\n/).slice(1)) {
  const entite = (bloc.match(/key: "([^"]+)"/) || [])[1];
  for (const m of bloc.matchAll(/^      \{ (.*) \},$/gm)) {
    const ligne = m[1];
    const label = (ligne.match(/label: "((?:[^"\\]|\\.)*)"/) || [])[1];
    const source = (ligne.match(/source: "([^"]+)"/) || [])[1];
    const opts = ligne.match(/options: (\[.*?\])(?:, (?:section|priority|source|warn|wide)|$)/);
    const constante = ligne.match(/options: L\.([A-Z_]+)/);

    if (!label) continue;
    if (constante) {
      champs.push({ entite, label: label.replace(/\\"/g, '"'), source, constante: constante[1] });
    } else if (opts) {
      let liste;
      try {
        liste = JSON.parse(opts[1]);
      } catch (e) {
        continue;
      }
      champs.push({ entite, label: label.replace(/\\"/g, '"'), source, options: liste });
    }
  }
}

// ── Constantes partagées ───────────────────────────────────────────────────

const vl = fs.readFileSync(VALUE_LISTS, 'utf8');
const constantes = [...vl.matchAll(/export const ([A-Z_]+) = \[([\s\S]*?)\] as const;/g)].map((m) => ({
  nom: m[1],
  valeurs: [...m[2].matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)].map((v) =>
    (v[1] !== undefined ? v[1] : v[2]).replace(/\\'/g, "'")
  ),
}));

const usages = new Map(constantes.map((c) => [c.nom, []]));
for (const c of champs) if (c.constante) usages.get(c.constante)?.push(c);

// ── Divergences internes ───────────────────────────────────────────────────
//
// Même libellé, jeux d'options différents. C'est le seul contrôle qui reste
// possible sans second référentiel, et il remonte de vraies incohérences :
// « Utilisation 1 / 2 / 3 » des robinets n'offrent pas les mêmes valeurs.

const parLibelle = new Map();
for (const c of champs) {
  const k = norm(c.label);
  if (!parLibelle.has(k)) parLibelle.set(k, []);
  parLibelle.get(k).push(c);
}

const divergences = [];
for (const [, liste] of parLibelle) {
  if (liste.length < 2) continue;
  const signature = (c) => (c.constante ? 'L.' + c.constante : normSet(c.options));
  const distinctes = new Set(liste.map(signature));
  if (distinctes.size > 1) divergences.push(liste);
}

// ── Écriture ───────────────────────────────────────────────────────────────

const md = [];
md.push('# Référentiel des listes de valeurs');
md.push('');
md.push('⚠️ **Fichier généré** par `node tools/gen-referentiel.js`, à partir de');
md.push('`src/app/models/audit-schema.ts`. Ne pas l’éditer à la main.');
md.push('');
md.push(
  `${champs.length} champ(s) à choix, dont ${champs.filter((c) => c.constante).length} adossés à une ` +
    `constante partagée de \`value-lists.ts\` et ${champs.filter((c) => c.options).length} avec une liste propre.`
);
md.push('');

md.push('## Constantes partagées');
md.push('');
md.push('| Constante | Valeurs | Champs qui l’emploient |');
md.push('|---|---|---|');
for (const c of constantes) {
  const emplois = usages.get(c.nom) || [];
  md.push(
    `| \`${c.nom}\` | ${c.valeurs.length} | ` +
      (emplois.length ? emplois.map((e) => `\`${e.source}\``).join(', ') : '**aucun — à retirer ?**') +
      ' |'
  );
}
md.push('');

md.push('## Divergences internes au classeur');
md.push('');
if (!divergences.length) {
  md.push('Aucune : chaque libellé porte partout le même jeu de valeurs.');
} else {
  md.push(
    `${divergences.length} libellé(s) portent des valeurs différentes selon l’endroit. ` +
      'Ce sont des arbitrages à remonter au Cerema, pas des défauts de transcription.'
  );
  md.push('');
  for (const liste of divergences) {
    md.push(`### ${liste[0].label}`);
    md.push('');
    for (const c of liste) {
      const valeurs = c.constante
        ? `\`L.${c.constante}\``
        : c.options.map((o) => `« ${o} »`).join(', ');
      md.push(`- \`${c.source}\` (${c.entite}) — ${valeurs}`);
    }
    md.push('');
  }
}
md.push('');

md.push('## Listes propres à un seul champ');
md.push('');
md.push('| Cellule | Champ | Valeurs |');
md.push('|---|---|---|');
for (const c of champs.filter((x) => x.options)) {
  md.push(
    `| \`${c.source}\` | ${String(c.label).replace(/\|/g, '\\|')} | ` +
      c.options.map((o) => String(o).replace(/\|/g, '\\|')).join(' · ') +
      ' |'
  );
}
md.push('');

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'referentiel-listes.md'), md.join('\n'), 'utf8');

console.log(`${champs.length} champs à choix, ${constantes.length} constantes, ${divergences.length} divergence(s)`);
const inutilisees = constantes.filter((c) => !(usages.get(c.nom) || []).length);
if (inutilisees.length) console.log(`constantes sans emploi : ${inutilisees.map((c) => c.nom).join(', ')}`);
