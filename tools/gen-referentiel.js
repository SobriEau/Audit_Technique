/**
 * Construit le référentiel des listes de valeurs et confronte les deux sources
 * qui coexistent dans le classeur :
 *   1. le catalogue de l'onglet « Infos audit partie technique » ;
 *   2. les énumérations écrites dans les notes de chaque page.
 * Les divergences sont signalées plutôt qu'arbitrées.
 */
const fs = require('fs');
const path = require('path');
const wb = require('./.cache/workbook.json');

const OUT = path.join(__dirname, '..', 'docs', 'audit');
const colOf = (r) => r.match(/^[A-Z]+/)[0];
const rowOf = (r) => parseInt(r.match(/\d+$/)[0], 10);
const strip = (n) => n.replace(/^[^:\n]{0,40}:\s*/, '').replace(/\r/g, '').trim();

// ── 1. Catalogue ───────────────────────────────────────────────────────────
const cat = wb.sheets.find((s) => s.name === 'Infos audit partie technique');
const byRow = {};
for (const [ref, c] of Object.entries(cat.cells)) {
  (byRow[rowOf(ref)] ??= {})[colOf(ref)] = String(c.v ?? '').trim();
}

const categories = [];
let current = null;
for (const r of Object.keys(byRow).map(Number).sort((a, b) => a - b)) {
  const row = byRow[r];
  const a = row.A;
  const b = row.B;

  // Une ligne d'en-tête relance un bloc
  if (a === 'Catégorie') {
    current = null;
    continue;
  }
  if (a && a !== 'audit terrain partie technique') {
    if (!current || current.name !== a) {
      current = { name: a, types: [], remarks: [] };
      categories.push(current);
    }
  }
  if (current && b) {
    current.types.push({ row: r, value: b, remark: row.C || null });
  }
}

// ── 2. Listes issues des notes de page ─────────────────────────────────────
const pageLists = [];
for (const s of wb.sheets) {
  for (const [ref, raw] of Object.entries(s.notes)) {
    const note = strip(raw);
    if (!/liste\s*d[ée]roulante/i.test(note)) continue;
    const after = note.replace(/^[\s\S]*?liste\s*d[ée]roulante\s*:?\s*/i, '');
    const options = after
      .split(/[\n,;]+/)
      .map((o) => o.trim().replace(/[.,;]+$/, ''))
      .filter((o) => o && o.length < 80);
    if (options.length > 1) pageLists.push({ sheet: s.name, ref, options });
  }
}

// ── 3. Confrontation ───────────────────────────────────────────────────────
const norm = (s) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const md = [];
md.push('# Référentiel des listes de valeurs');
md.push('');
md.push(
  "Le classeur ne contient **aucune validation de données Excel**. Les valeurs autorisées " +
    'y sont décrites en langage naturel, à deux endroits qui ne concordent pas toujours.'
);
md.push('');
md.push('## Source 1 — catalogue « Infos audit partie technique »');
md.push('');
md.push(
  "Cet onglet porte en cellule `A1` la mention *« Cet onglet va servir à la constitution " +
    "des menus déroulant ? »*. Il est donc l'origine voulue des listes, mais il est resté " +
    'à l\'état de brouillon : le point d\'interrogation est des auteurs, et plusieurs ' +
    'entrées portent des questions non tranchées.'
);
md.push('');

for (const c of categories) {
  if (!c.types.length) continue;
  md.push(`### ${c.name}`);
  md.push('');
  for (const t of c.types) {
    md.push(`- ${t.value}`);
    if (t.remark) md.push(`  - ⚠️ *${t.remark.replace(/\n+/g, ' ')}*`);
  }
  md.push('');
}

md.push('## Source 2 — listes écrites dans les notes des pages');
md.push('');
md.push('| Page | Cellule | Valeurs |');
md.push('|---|---|---|');
for (const p of pageLists) {
  md.push(`| ${p.sheet} | \`${p.ref}\` | ${p.options.join(' · ')} |`);
}
md.push('');

// Divergences sur les catégories comparables
md.push('## Divergences à arbitrer');
md.push('');
md.push(
  'Là où les deux sources décrivent la même notion, elles ne disent pas la même chose. ' +
    "Ces écarts doivent être tranchés **avant** d'être codés en dur dans l'application."
);
md.push('');

const pairs = [
  { cat: 'Robinet', page: 'Robinet1' },
  { cat: 'WC', page: 'WC1' },
  { cat: 'Bains / Douches - pommeaux', page: 'Douche-baignoire1' },
  { cat: 'Espace vert / extérieur', page: 'Extérieur1' },
];

for (const pr of pairs) {
  const c = categories.find((x) => x.name === pr.cat);
  const lists = pageLists.filter((x) => x.sheet === pr.page);
  if (!c || !lists.length) continue;

  const catVals = c.types.map((t) => t.value);
  const catNorm = new Set(catVals.map(norm));

  // On compare à la liste de page la plus proche du catalogue
  let best = lists[0];
  let bestScore = -1;
  for (const l of lists) {
    const score = l.options.filter((o) => catNorm.has(norm(o))).length;
    if (score > bestScore) { bestScore = score; best = l; }
  }
  const pageNorm = new Set(best.options.map(norm));

  md.push(`### ${pr.cat} — catalogue vs page « ${pr.page} » (\`${best.ref}\`)`);
  md.push('');
  md.push(`- Catalogue : **${catVals.length}** entrées`);
  md.push(`- Note de la page : **${best.options.length}** entrées`);
  md.push(`- Communes : **${bestScore}**`);
  md.push('');

  const onlyCat = catVals.filter((v) => !pageNorm.has(norm(v)));
  const onlyPage = best.options.filter((v) => !catNorm.has(norm(v)));
  if (onlyCat.length) {
    md.push('**Seulement dans le catalogue**');
    md.push('');
    onlyCat.forEach((v) => md.push(`- ${v}`));
    md.push('');
  }
  if (onlyPage.length) {
    md.push('**Seulement dans la note de page**');
    md.push('');
    onlyPage.forEach((v) => md.push(`- ${v}`));
    md.push('');
  }
}

fs.writeFileSync(path.join(OUT, 'referentiel-listes.md'), md.join('\n'), 'utf8');

console.log('Catégories du catalogue :', categories.filter((c) => c.types.length).length);
categories.filter((c) => c.types.length).forEach((c) => console.log('  -', c.name, '→', c.types.length, 'entrées'));
console.log('\nListes trouvées dans les notes :', pageLists.length);
