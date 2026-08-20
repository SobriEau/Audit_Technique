/**
 * Génère un fichier Markdown par onglet du classeur d'audit.
 * Les notes de cellules portent la spécification ; ce script les apparie aux
 * étiquettes et en déduit le type de saisie attendu.
 */
const fs = require('fs');
const path = require('path');
const wb = require('./.cache/workbook.json');

const OUT = path.join(__dirname, '..', 'docs', 'audit');
fs.mkdirSync(OUT, { recursive: true });

const colOf = (r) => r.match(/^[A-Z]+/)[0];
const rowOf = (r) => parseInt(r.match(/\d+$/)[0], 10);
const colNum = (c) => [...c].reduce((a, ch) => a * 26 + (ch.charCodeAt(0) - 64), 0);

/**
 * Retire le préfixe « Auteur: » que Excel place en tête de note.
 * Garde : certaines notes n'ont pas de signature et commencent directement
 * par le marqueur de type (« Liste déroulante : ») — sans cette garde, la
 * regexp l'avalerait comme si c'était une signature.
 */
const NOTE_MARKER_RE = /^(liste\s*d[ée]roulante|champ[s]?\s*libre|oui\s*\/\s*non|o\s*\/\s*n\b)/i;
const strip = (n) => {
  const t = n.replace(/\r/g, '').trim();
  if (NOTE_MARKER_RE.test(t)) return t;
  return t.replace(/^[^:\n]{0,40}:\s*/, '').trim();
};

/**
 * Détecte une énumération écrite directement dans une cellule
 * (« Oui / Non », « Bon / moyen / dégradé »).
 * Écarte les unités — « Débit (l/min) » — et les titres composés.
 */
function cellEnum(v) {
  if (!v) return null;
  const base = v.replace(/\([^)]*\)/g, '').trim(); // retire les unités
  if (!base.includes('/')) return null;

  const parts = base
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length < 2 || parts.length > 5) return null;
  if (parts.some((p) => p.length > 22 || /\d/.test(p))) return null;

  // « Nombre d'utilisation/semaine », « Consommation/jour » : le second terme
  // est une unité de temps ou de quantité, pas une valeur au choix.
  const UNITS = /^(semaine|jour|journée|an|année|mois|heure|h|min|minute|personne|repas|m2|m²|élève|agent|logement)$/i;
  if (parts.some((p) => UNITS.test(p))) return null;
  // Un titre composé commence par une majuscule sur CHAQUE terme
  const allCapitalised = parts.every((p) => /^[A-ZÀ-Ý]/.test(p));
  const looksBoolean = /oui/i.test(base) && /non/i.test(base);
  if (allCapitalised && !looksBoolean) return null;

  return parts;
}

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

/** Déduit le type de saisie et, le cas échéant, les options. */
function classify(note, label) {
  const n = note.toLowerCase();

  if (/\bo\s*\/\s*n\b/i.test(note)) {
    return { type: 'Oui / Non', options: ['Oui', 'Non'] };
  }

  if (ENUM_MARKER_RE.test(note)) {
    // Tout ce qui suit le marqueur (et son éventuel deux-points)
    const after = note.replace(new RegExp('^[\\s\\S]*?(?:' + ENUM_MARKER_RE.source + ')\\s*:?\\s*', 'i'), '');
    let options = splitOptions(after)
      .map((o) => o.trim().replace(/[.,;]+$/, ''))
      .filter((o) => o && o.length < 80 && !/^\(?\?+\)?$/.test(o));
    // Un seul item retenu : les options sont peut-être jointes par « / »
    // (« Bon / Moyen / Mauvais ») plutôt que par une virgule. Un « / » à
    // l'intérieur d'un item d'une liste déjà scindée (« PVC/EPDM ») reste
    // intact — seul un item unique est retenté sur ce séparateur.
    if (options.length === 1 && options[0].includes('/')) {
      options = options[0].split('/').map((o) => o.trim()).filter(Boolean);
    }
    return { type: 'Liste déroulante', options };
  }

  if (/champ[s]?\s*libre/i.test(n)) {
    const unit = label && label.match(/\(([^)]+)\)/);
    const numeric =
      unit && /l\/min|l\/s|mm|cm|\bm\b|m²|°c|\bs\b|m3|m³|kwh|bar|%|kg|litre|nombre|an|jour|semaine/i.test(unit[1]);
    if (numeric) return { type: `Nombre (${unit[1]})`, options: null };
    if (/nombre|numéro|débit|temps|diamètre/i.test(label || '')) {
      return { type: 'Nombre', options: null };
    }
    return { type: 'Texte libre', options: null };
  }

  return { type: null, options: null };
}

/**
 * Étiquette la plus probable pour une note : cellule texte au-dessus, à
 * gauche. Le plafond de longueur écarte les bandeaux/titres — voir la même
 * mesure (219 caractères pour le plus long libellé réel) dans gen-schema.js.
 */
const MAX_LABEL_LEN = 250;
function findLabel(cells, ref) {
  const r = rowOf(ref);
  const c = colNum(colOf(ref));
  for (const row of [r - 1, r, r - 2]) {
    let best = null;
    for (const [cref, cell] of Object.entries(cells)) {
      if (rowOf(cref) !== row) continue;
      const v = String(cell.v ?? '').trim();
      if (!v || v.length > MAX_LABEL_LEN) continue;
      const cc = colNum(colOf(cref));
      if (cc <= c && (!best || cc > best.cc)) best = { cc, v };
    }
    if (best) return best.v.replace(/\s+/g, ' ');
  }
  return null;
}

const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const index = [];

for (const sheet of wb.sheets) {
  const fields = [];
  const behaviours = [];

  const refs = Object.keys(sheet.notes).sort(
    (a, b) => rowOf(a) - rowOf(b) || colNum(colOf(a)) - colNum(colOf(b))
  );

  for (const ref of refs) {
    const note = strip(sheet.notes[ref]);
    if (!note) continue;
    const label = findLabel(sheet.cells, ref);
    const { type, options } = classify(note, label);

    if (type) fields.push({ ref, label, type, options, note });
    else behaviours.push({ ref, label, note });
  }

  // Valeurs autorisées écrites directement dans une cellule
  const inCell = [];
  for (const [ref, c] of Object.entries(sheet.cells)) {
    const opts = cellEnum(String(c.v ?? '').trim());
    if (opts) inCell.push({ ref, label: findLabel(sheet.cells, ref), options: opts, raw: String(c.v).trim() });
  }

  // Bornée à MAX_LABEL_LEN : plusieurs relectures ont buté sur des libellés
  // légitimes exclus de ce dump (donc invisibles, y compris pour un
  // relecteur humain) alors que la légende du fichier le présente comme la
  // vérité de référence exhaustive.
  const titles = Object.entries(sheet.cells)
    .map(([ref, c]) => ({ ref, v: String(c.v ?? '').trim() }))
    .filter((x) => x.v && x.v.length > 2 && x.v.length < MAX_LABEL_LEN);

  const md = [];
  md.push(`# ${sheet.name}`);
  md.push('');
  md.push(
    `> Spécification extraite de \`audit_technique.xlsx\`, onglet « ${sheet.name} ».`
  );
  md.push(
    `> ${Object.keys(sheet.cells).length} cellules, ${Object.keys(sheet.notes).length} notes.`
  );
  md.push('');

  // Rôle de la page
  md.push('## Rôle de la page');
  md.push('');
  const isListe = /^liste/i.test(sheet.name);
  if (isListe) {
    md.push(
      "Page **index** : elle récapitule les éléments saisis et sert de point d'entrée vers la fiche de chaque élément."
    );
  } else {
    md.push("Page de **saisie** : formulaire décrivant un élément de l'audit.");
  }
  md.push('');

  // Champs
  if (fields.length) {
    md.push('## Champs attendus');
    md.push('');
    md.push('| Cellule | Libellé | Type attendu | Valeurs |');
    md.push('|---|---|---|---|');
    for (const f of fields) {
      const vals = f.options?.length ? f.options.join(' · ') : '—';
      md.push(
        `| \`${f.ref}\` | ${f.label ?? '_(non identifié)_'} | ${f.type} | ${vals} |`
      );
    }
    md.push('');

    const selects = fields.filter((f) => f.options?.length && f.type === 'Liste déroulante');
    if (selects.length) {
      md.push('### Listes de valeurs');
      md.push('');
      md.push(
        'Ces énumérations sont écrites en toutes lettres dans les notes du classeur. ' +
          "Elles ne proviennent d'aucune validation Excel ni d'un onglet de référence."
      );
      md.push('');
      for (const s of selects) {
        md.push(`**${s.label ?? s.ref}**`);
        md.push('');
        for (const o of s.options) md.push(`- ${o}`);
        md.push('');
      }
    }
  }

  // Valeurs inscrites dans les cellules
  if (inCell.length) {
    md.push('## Valeurs inscrites directement dans les cellules');
    md.push('');
    md.push(
      "Contrairement aux listes ci-dessus, ces valeurs sont écrites dans la cellule " +
        "elle-même plutôt que dans une note. Le classeur ne portant aucune validation " +
        'de données, elles restent indicatives : à confirmer au cas par cas.'
    );
    md.push('');
    md.push('| Cellule | Rattaché à | Valeurs |');
    md.push('|---|---|---|');
    for (const e of inCell) {
      md.push(`| \`${e.ref}\` | ${e.label ?? '—'} | ${e.options.join(' · ')} |`);
    }
    md.push('');
  }

  // Comportements
  if (behaviours.length) {
    md.push('## Comportements attendus');
    md.push('');
    md.push(
      'Notes du classeur qui ne décrivent pas un champ mais une règle de navigation, ' +
        "d'enregistrement ou une question laissée ouverte par les auteurs."
    );
    md.push('');
    for (const b of behaviours) {
      const ctx = b.label ? `**${b.label}** — ` : '';
      md.push(`- \`${b.ref}\` ${ctx}${b.note.replace(/\n+/g, ' / ')}`);
    }
    md.push('');
  }

  // Contenu brut de la feuille, pour lever les ambiguïtés
  md.push('## Contenu de l\'onglet');
  md.push('');
  md.push('<details><summary>Cellules non vides</summary>');
  md.push('');
  md.push('| Cellule | Contenu |');
  md.push('|---|---|');
  for (const t of titles.sort(
    (a, b) => rowOf(a.ref) - rowOf(b.ref) || colNum(colOf(a.ref)) - colNum(colOf(b.ref))
  )) {
    md.push(`| \`${t.ref}\` | ${t.v.replace(/\n/g, ' ').replace(/\|/g, '\\|')} |`);
  }
  md.push('');
  md.push('</details>');
  md.push('');

  const file = `${slug(sheet.name)}.md`;
  fs.writeFileSync(path.join(OUT, file), md.join('\n'), 'utf8');
  index.push({
    file,
    name: sheet.name,
    fields: fields.length,
    selects: fields.filter((f) => f.type === 'Liste déroulante').length,
    behaviours: behaviours.length,
  });
}

// Index
const idx = [];
idx.push('# Spécification de l\'audit technique');
idx.push('');
const totalNotes = wb.sheets.reduce((n, s) => n + Object.keys(s.notes).length, 0);
idx.push(
  'Un fichier par onglet de `audit_technique.xlsx`. La spécification réelle vit dans ' +
    `les **notes de cellules** du classeur : ${totalNotes} notes réparties sur ${wb.sheets.length} onglets.`
);
idx.push('');
idx.push('## À lire en premier');
idx.push('');
idx.push('- [Agencement des pages et liens entre données](agencement.md) — hiérarchie, motif liste/fiche, relations entre entités.');
idx.push('- [Référentiel des listes de valeurs](referentiel-listes.md) — les deux sources de listes et leurs divergences.');
idx.push('');
idx.push('## Détail par onglet');
idx.push('');
idx.push('| Onglet | Champs | Listes | Règles |');
idx.push('|---|---|---|---|');
for (const i of index) {
  idx.push(`| [${i.name}](${i.file}) | ${i.fields} | ${i.selects} | ${i.behaviours} |`);
}
idx.push('');
fs.writeFileSync(path.join(OUT, 'README.md'), idx.join('\n'), 'utf8');

console.log('Fichiers générés :', index.length + 1);
console.log('\nOnglet                                   champs  listes  règles');
for (const i of index) {
  console.log(
    i.name.slice(0, 38).padEnd(40) + String(i.fields).padStart(6) + String(i.selects).padStart(8) + String(i.behaviours).padStart(8)
  );
}
