/**
 * Génère un Markdown par onglet du classeur, dans `docs/audit/`.
 *
 * Deux régimes, selon la nature de l'onglet :
 *
 *  - **les seize fiches d'équipement** sont documentées depuis ce que le
 *    lecteur commun (`lib/classeur.js`) y voit — donc exactement ce que
 *    `audit-schema.ts` contient, cellule d'origine comprise. La documentation
 *    décrit ainsi l'application telle qu'elle est, et non une seconde lecture
 *    du classeur qui pourrait diverger. C'est ce qui arrivait : ce script
 *    portait sa propre détection d'étiquettes et affichait 16 libellés faux,
 *    44 types « Nombre » inventés et 14 fausses listes déroulantes ;
 *  - **les autres onglets** — listes, accueil, tableau de bord, documents —
 *    sont restitués tels quels, cellules et notes, sans interprétation.
 *
 *   node tools/gen-docs.js
 */
const fs = require('fs');
const path = require('path');
const wb = require('./.cache/workbook.json');
const { colOf, rowOf, colNum, colName, ENTITIES, lireFiche, strip } = require('./lib/classeur');

const OUT = path.join(__dirname, '..', 'docs', 'audit');
fs.mkdirSync(OUT, { recursive: true });

/** Fichiers écrits à la main ou par un autre script : à ne jamais effacer. */
const CONSERVER = new Set(['agencement.md', 'referentiel-listes.md']);

const slug = (s) =>
  s
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const esc = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();

const PRIO_LABEL = { obligatoire: 'Obligatoire', recommande: 'Recommandé', facultatif: 'Facultatif' };

const ecrits = new Set();
const index = [];

// ── Fiches d'équipement ────────────────────────────────────────────────────

for (const ent of ENTITIES) {
  const sheet = wb.sheets.find((s) => s.name === ent.sheet);
  if (!sheet) continue;

  const { champs, sections } = lireFiche(wb, sheet);
  const md = [];

  md.push(`# ${ent.sheet}`);
  md.push('');
  md.push(`Entité \`${ent.key}\` — route \`#/qte/${ent.route}\`${ent.single ? ' (fiche unique)' : ''}.`);
  md.push('');
  md.push(
    `${champs.length} champ(s), ${sections.length} section(s). ` +
      `Colonnes du tableau : ${ent.cols.length ? ent.cols.map((c) => '`' + c + '`').join(', ') : '—'}.`
  );
  md.push('');

  let sectionCourante = Symbol('aucune');
  for (const c of champs) {
    if (c.section !== sectionCourante) {
      sectionCourante = c.section;
      md.push('');
      md.push(`## ${c.section || 'En tête de fiche (aucune section)'}`);
      md.push('');
      md.push('| Cellule | Libellé | Priorité | Note du classeur |');
      md.push('|---|---|---|---|');
    }
    md.push(
      `| \`${c.ref}\` | ${esc(c.label)} | ${c.requirement ? PRIO_LABEL[c.requirement] : '—'} | ` +
        `${esc(c.note).slice(0, 160) || '—'} |`
    );
  }

  md.push('');
  const file = slug(ent.sheet) + '.md';
  fs.writeFileSync(path.join(OUT, file), md.join('\n'), 'utf8');
  ecrits.add(file);
  index.push({ nom: ent.sheet, file, champs: champs.length, sections: sections.length, fiche: true });
}

// ── Autres onglets, restitués tels quels ───────────────────────────────────

const fiches = new Set(ENTITIES.map((e) => e.sheet));

for (const sheet of wb.sheets) {
  if (fiches.has(sheet.name)) continue;
  if (!sheet.cellCount) continue;

  const md = [];
  md.push(`# ${sheet.name.trim()}`);
  md.push('');
  md.push(
    `Onglet hors schéma généré : ${sheet.cellCount} cellule(s), ${sheet.noteCount} note(s). ` +
      `Restitué tel quel, sans interprétation.`
  );
  md.push('');
  md.push('| Cellule | Contenu | Note |');
  md.push('|---|---|---|');

  const refs = [...new Set([...Object.keys(sheet.cells), ...Object.keys(sheet.notes)])].sort(
    (a, b) => rowOf(a) - rowOf(b) || colNum(colOf(a)) - colNum(colOf(b))
  );
  for (const ref of refs) {
    const v = sheet.cells[ref] ? esc(sheet.cells[ref].v) : '';
    const n = sheet.notes[ref] ? esc(strip(sheet.notes[ref])).slice(0, 200) : '';
    if (!v && !n) continue;
    md.push(`| \`${ref}\` | ${v || '—'} | ${n || '—'} |`);
  }
  md.push('');

  const file = slug(sheet.name) + '.md';
  fs.writeFileSync(path.join(OUT, file), md.join('\n'), 'utf8');
  ecrits.add(file);
  index.push({ nom: sheet.name.trim(), file, champs: sheet.cellCount, sections: sheet.noteCount, fiche: false });
}

// ── Sommaire ───────────────────────────────────────────────────────────────

const totalNotes = wb.sheets.reduce((n, s) => n + Object.keys(s.notes).length, 0);
const idx = [];
idx.push(`# Spécification de l'audit technique`);
idx.push('');
idx.push(
  `Un fichier par onglet de \`audit_technique.xlsx\`. La spécification réelle vit dans ` +
    `les **notes de cellules** du classeur : ${totalNotes} notes réparties sur ${wb.sheets.length} onglets.`
);
idx.push('');
idx.push(`⚠️ **Dossier généré** par \`node tools/gen-docs.js\`. Ne pas l'éditer à la main.`);
idx.push('');
idx.push('## À lire en premier');
idx.push('');
idx.push('- [Agencement des pages et liens entre données](agencement.md) — hiérarchie, motif liste/fiche, relations entre entités.');
idx.push('- [Référentiel des listes de valeurs](referentiel-listes.md) — les deux sources de listes et leurs divergences.');
idx.push('');
idx.push('## Fiches d’équipement');
idx.push('');
idx.push('| Onglet | Champs | Sections |');
idx.push('|---|---|---|');
for (const e of index.filter((x) => x.fiche)) {
  idx.push(`| [${e.nom}](${e.file}) | ${e.champs} | ${e.sections} |`);
}
idx.push('');
idx.push('## Autres onglets');
idx.push('');
idx.push('| Onglet | Cellules | Notes |');
idx.push('|---|---|---|');
for (const e of index.filter((x) => !x.fiche)) {
  idx.push(`| [${e.nom}](${e.file}) | ${e.champs} | ${e.sections} |`);
}
idx.push('');
fs.writeFileSync(path.join(OUT, 'README.md'), idx.join('\n'), 'utf8');
ecrits.add('README.md');

// ── Ménage ─────────────────────────────────────────────────────────────────
//
// Un onglet renommé ou supprimé laissait son fichier derrière lui : le dossier
// en comptait huit, décrivant des écrans qui n'existent plus.
let supprimes = 0;
for (const f of fs.readdirSync(OUT)) {
  if (!f.endsWith('.md') || ecrits.has(f) || CONSERVER.has(f)) continue;
  fs.unlinkSync(path.join(OUT, f));
  supprimes++;
}

console.log(`${index.filter((x) => x.fiche).length} fiche(s), ${index.filter((x) => !x.fiche).length} autre(s) onglet(s)`);
if (supprimes) console.log(`${supprimes} fichier(s) orphelin(s) supprimé(s)`);
