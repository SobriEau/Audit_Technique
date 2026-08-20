/**
 * Construit le référentiel des listes de valeurs du classeur.
 *
 * La V1 du classeur portait deux sources à confronter : un onglet catalogue
 * « Infos audit partie technique » et les énumérations écrites dans les
 * notes de chaque page. La V2 (2026-08) n'a plus d'onglet catalogue — aucune
 * cellule du classeur ne porte plus le marqueur qui l'identifiait (« Cet
 * onglet va servir à la constitution des menus déroulants »), recherche
 * faite sur la totalité des 38 onglets. La seule source restante est donc
 * les notes de page.
 *
 * En l'absence d'un second référentiel à confronter, le risque de
 * divergence se déplace à l'intérieur même du classeur : un même libellé de
 * champ peut apparaître à plusieurs endroits (plusieurs onglets, ou
 * plusieurs fois dans le même onglet quand une page a des sections
 * répétées) avec des jeux d'options différents. C'est ce que ce script
 * détecte désormais, à la place de la confrontation à deux sources.
 */
const fs = require('fs');
const path = require('path');
const wb = require('./.cache/workbook.json');

const OUT = path.join(__dirname, '..', 'docs', 'audit');

/**
 * Certaines notes ne portent pas de signature d'auteur et commencent
 * directement par le marqueur de type (« Liste déroulante : »). Sans garde,
 * la regexp qui retire la signature avale ce marqueur — voir gen-schema.js.
 */
const NOTE_MARKER_RE = /^(liste\s*d[ée]roulante|champ[s]?\s*libre|oui\s*\/\s*non|o\s*\/\s*n\b)/i;
const strip = (n) => {
  const t = n.replace(/\r/g, '').trim();
  if (NOTE_MARKER_RE.test(t)) return t;
  return t.replace(/^[^:\n]{0,40}:\s*/, '').trim();
};

const norm = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Marqueur d'énumération dans une note — voir la même liste dans
 * gen-schema.js. « liste déroulante » seul avait fait perdre 13 champs sur
 * le seul onglet WC1, qui parle de « menu déroulant » et de « cases à
 * cocher ».
 */
const ENUM_MARKER_RE = /liste\s*d[ée]roulante|menu\s*d[ée]roulant|(?:cases?\s*)?[aà]\s*cocher/i;

/**
 * Découpe une liste d'options en respectant les parenthèses — voir la même
 * fonction dans gen-schema.js.
 */
function splitOptions(text) {
  const parts = [];
  let cur = '';
  let depth = 0;
  for (const ch of text) {
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && /[\n,;]/.test(ch)) {
      parts.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  parts.push(cur);
  return parts;
}

// ── Listes issues des notes de page ────────────────────────────────────────
const pageLists = [];
for (const s of wb.sheets) {
  for (const [ref, raw] of Object.entries(s.notes)) {
    const note = strip(raw);
    if (!ENUM_MARKER_RE.test(note)) continue;
    const after = note.replace(new RegExp('^[\\s\\S]*?(?:' + ENUM_MARKER_RE.source + ')\\s*:?\\s*', 'i'), '');
    let options = splitOptions(after)
      .map((o) => o.trim().replace(/[.,;]+$/, ''))
      .filter((o) => o && o.length < 80);
    // Un seul item retenu : les options sont peut-être jointes par « / »
    // plutôt que par une virgule — voir la même garde dans gen-schema.js.
    if (options.length === 1 && options[0].includes('/')) {
      options = options[0].split('/').map((o) => o.trim()).filter(Boolean);
    }
    if (options.length > 1) pageLists.push({ sheet: s.name, ref, options });
  }
}

// ── Regroupement par libellé de champ (trouvé au-dessus de la note) ───────
const colOf = (r) => r.match(/^[A-Z]+/)[0];
const rowOf = (r) => parseInt(r.match(/\d+$/)[0], 10);
const colNum = (c) => [...c].reduce((a, ch) => a * 26 + (ch.charCodeAt(0) - 64), 0);

function findLabel(cells, ref) {
  const r = rowOf(ref);
  const c = colNum(colOf(ref));
  for (const row of [r - 1, r, r - 2]) {
    let best = null;
    for (const [cref, cell] of Object.entries(cells)) {
      if (rowOf(cref) !== row) continue;
      const v = String(cell.v ?? '').trim();
      if (!v || v.length > 90) continue;
      const cc = colNum(colOf(cref));
      if (cc <= c && (!best || cc > best.cc)) best = { cc, v };
    }
    if (best) return best.v.replace(/\s+/g, ' ');
  }
  return null;
}

const bySheet = new Map(wb.sheets.map((s) => [s.name, s]));
const byLabel = new Map(); // norm(label) -> [{ sheet, ref, label, options }]
for (const p of pageLists) {
  const label = findLabel(bySheet.get(p.sheet).cells, p.ref) || p.ref;
  const key = norm(label);
  (byLabel.get(key) ?? byLabel.set(key, []).get(key)).push({ ...p, label });
}

// ── Rédaction ───────────────────────────────────────────────────────────
const md = [];
md.push('# Référentiel des listes de valeurs');
md.push('');
md.push(
  "Le classeur ne contient **aucune validation de données Excel**. Les valeurs autorisées " +
    "y sont décrites en langage naturel, dans les notes de cellules — seule source depuis " +
    "la V2 : l'onglet catalogue de la V1 (« Infos audit partie technique ») n'existe plus."
);
md.push('');
md.push('## Listes de valeurs, par onglet');
md.push('');
md.push('| Onglet | Cellule | Libellé | Valeurs |');
md.push('|---|---|---|---|');
for (const p of pageLists) {
  const label = findLabel(bySheet.get(p.sheet).cells, p.ref) || '—';
  md.push(`| ${p.sheet} | \`${p.ref}\` | ${label} | ${p.options.join(' · ')} |`);
}
md.push('');

// ── Divergences : même libellé, options différentes ────────────────────────
md.push('## Divergences à arbitrer');
md.push('');
md.push(
  "Un même libellé de champ apparaît parfois à plusieurs endroits du classeur — sur " +
    "plusieurs onglets, ou plusieurs fois sur le même onglet quand une page a des sections " +
    "répétées (ex. « Opportunités1 » traite successivement l'eau de pluie et les eaux " +
    "ménagères) — avec des jeux d'options qui ne concordent pas toujours. Ces écarts sont " +
    "signalés plutôt qu'arbitrés : trancher revient à choisir quelle saisie de terrain future " +
    "sera acceptée, ce qui dépasse une régénération mécanique."
);
md.push('');

let divergenceCount = 0;
for (const [, occurrences] of byLabel) {
  if (occurrences.length < 2) continue;
  const distinct = new Map(); // norm(options joined) -> occurrence
  for (const o of occurrences) {
    const k = o.options.map(norm).sort().join('|');
    if (!distinct.has(k)) distinct.set(k, o);
  }
  if (distinct.size < 2) continue; // mêmes options partout : pas une divergence

  divergenceCount++;
  md.push(`### ${occurrences[0].label}`);
  md.push('');
  for (const o of occurrences) {
    md.push(`- **${o.sheet}** \`${o.ref}\` — ${o.options.join(' · ')}`);
  }
  md.push('');
}
if (!divergenceCount) md.push('_Aucune détectée sur cette version du classeur._');
md.push('');

fs.writeFileSync(path.join(OUT, 'referentiel-listes.md'), md.join('\n'), 'utf8');

console.log('Listes trouvées dans les notes :', pageLists.length);
console.log('Libellés avec des jeux d\'options divergents :', divergenceCount);
