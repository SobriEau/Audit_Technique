/**
 * Extraction structurée d'un classeur xlsx décompressé :
 * feuilles, cellules, notes de cellules, listes déroulantes (validations)
 * et plages nommées, avec résolution des références inter-onglets.
 */
const fs = require('fs');
const path = require('path');
const sax = require('sax');

/**
 * Dossier du classeur décompressé et fichier de sortie, tous deux surchargeables
 * en argument : `node tools/xlsx-extract.js [dossier] [sortie.json]`. Comparer
 * deux versions du classeur suppose de les extraire côte à côte sans que la
 * seconde écrase la première.
 */
const ROOT = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, '.cache', 'xlsx');
const OUT = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(__dirname, '.cache', 'workbook.json');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));

/** Parcours SAX générique : appelle les gestionnaires fournis. */
function parse(xml, { open, text, close }) {
  const parser = sax.parser(true, { trim: false, normalize: false });
  parser.onopentag = (n) => open?.(n.name, n.attributes, n.isSelfClosing);
  parser.ontext = (t) => text?.(t);
  parser.oncdata = (t) => text?.(t);
  parser.onclosetag = (n) => close?.(n);
  parser.write(xml).close();
}

// ── Chaînes partagées ──────────────────────────────────────────────────────
function sharedStrings() {
  if (!exists('xl/sharedStrings.xml')) return [];
  const out = [];
  let cur = null;
  let inT = false;
  parse(read('xl/sharedStrings.xml'), {
    open: (name) => {
      if (name === 'si') cur = [];
      if (name === 't') inT = true;
    },
    text: (t) => {
      if (inT && cur) cur.push(t);
    },
    close: (name) => {
      if (name === 't') inT = false;
      if (name === 'si') {
        out.push(cur.join(''));
        cur = null;
      }
    },
  });
  return out;
}

// ── Relations ──────────────────────────────────────────────────────────────
function rels(relPath) {
  const map = {};
  if (!exists(relPath)) return map;
  parse(read(relPath), {
    open: (name, a) => {
      if (name === 'Relationship') map[a.Id] = a.Target;
    },
  });
  return map;
}

// ── Classeur : feuilles + plages nommées ───────────────────────────────────
function workbook() {
  const sheets = [];
  const definedNames = {};
  let dnName = null;
  let dnBuf = '';

  parse(read('xl/workbook.xml'), {
    open: (name, a) => {
      if (name === 'sheet') {
        sheets.push({ name: a.name, sheetId: a.sheetId, rid: a['r:id'], state: a.state || 'visible' });
      }
      if (name === 'definedName') {
        dnName = a.name;
        dnBuf = '';
      }
    },
    text: (t) => {
      if (dnName !== null) dnBuf += t;
    },
    close: (name) => {
      if (name === 'definedName' && dnName !== null) {
        definedNames[dnName] = dnBuf.trim();
        dnName = null;
      }
    },
  });
  return { sheets, definedNames };
}

// ── Notes de cellules ──────────────────────────────────────────────────────
function comments(partPath) {
  const notes = {};
  if (!partPath || !exists(partPath)) return notes;

  const authors = [];
  let inAuthor = false;
  let ref = null;
  let buf = [];
  let inT = false;

  parse(read(partPath), {
    open: (name, a) => {
      if (name === 'author') { inAuthor = true; authors.push(''); }
      if (name === 'comment') { ref = a.ref; buf = []; }
      if (name === 't') inT = true;
      // Un saut de ligne explicite dans la note
      if (name === 'br') buf.push('\n');
    },
    text: (t) => {
      if (inAuthor) authors[authors.length - 1] += t;
      else if (inT && ref) buf.push(t);
    },
    close: (name) => {
      if (name === 'author') inAuthor = false;
      if (name === 't') inT = false;
      if (name === 'comment' && ref) {
        notes[ref] = buf.join('').replace(/\r/g, '').trim();
        ref = null;
      }
    },
  });
  return notes;
}

// ── Feuille : cellules + validations ───────────────────────────────────────
function worksheet(sheetPath, strings) {
  const cells = {};
  const validations = [];
  const merges = [];

  let ref = null;
  let type = null;
  let style = null;
  let inV = false;
  let inF = false;
  let vBuf = '';
  let fBuf = '';

  // Validation courante
  let dv = null;
  let inF1 = false;
  let f1Buf = '';

  parse(read(sheetPath), {
    open: (name, a) => {
      if (name === 'c') { ref = a.r; type = a.t || 'n'; style = a.s; vBuf = ''; fBuf = ''; }
      if (name === 'v') inV = true;
      if (name === 'f') inF = true;
      if (name === 'mergeCell') merges.push(a.ref);
      if (name === 'dataValidation') {
        dv = { sqref: a.sqref, type: a.type || '', allowBlank: a.allowBlank === '1', prompt: a.prompt, promptTitle: a.promptTitle, error: a.error, formula1: '' };
      }
      if (name === 'formula1') { inF1 = true; f1Buf = ''; }
      // Validations « x14 » (Excel moderne, souvent utilisées pour les listes inter-onglets)
      if (name === 'x14:dataValidation') {
        dv = { sqref: '', type: a.type || '', allowBlank: a.allowBlank === '1', prompt: a.prompt, promptTitle: a.promptTitle, error: a.error, formula1: '', x14: true };
      }
      if (name === 'x14:formula1') { inF1 = true; f1Buf = ''; }
      if (name === 'xm:f') { inF1 = true; f1Buf = ''; }
    },
    text: (t) => {
      if (inV) vBuf += t;
      else if (inF) fBuf += t;
      if (inF1) f1Buf += t;
    },
    close: (name) => {
      if (name === 'v') inV = false;
      if (name === 'f') inF = false;
      if (name === 'formula1' || name === 'x14:formula1') { inF1 = false; if (dv && !dv.formula1) dv.formula1 = f1Buf.trim(); }
      if (name === 'xm:f') { inF1 = false; if (dv) dv.formula1 = f1Buf.trim(); }
      if (name === 'xm:sqref') { /* géré via texte */ }
      if (name === 'c' && ref) {
        let value = vBuf;
        if (type === 's') value = strings[parseInt(vBuf, 10)] ?? '';
        if (value !== '' || fBuf) {
          cells[ref] = { v: value, t: type, f: fBuf || undefined };
          // Index de style : c'est lui qui distingue un intertitre de section
          // d'un libellé de champ, la V3 du classeur ne les séparant que par
          // le fond de la cellule et l'orientation du texte.
          if (style !== undefined && style !== null) cells[ref].s = parseInt(style, 10);
        }
        ref = null;
      }
      if (name === 'dataValidation' || name === 'x14:dataValidation') {
        if (dv) validations.push(dv);
        dv = null;
      }
    },
  });

  // Les validations x14 portent leur plage dans <xm:sqref>, récupérée séparément
  const sqrefs = [...read(sheetPath).matchAll(/<xm:sqref>([^<]+)<\/xm:sqref>/g)].map((m) => m[1]);
  let si = 0;
  for (const v of validations) if (v.x14 && !v.sqref) v.sqref = sqrefs[si++] ?? '';

  return { cells, validations, merges };
}

/**
 * Formats de cellule (`cellXfs`), réduits à ce qui sert à lire la mise en page :
 * le fond et l'orientation du texte.
 *
 * La V3 du classeur découpe ses fiches en sections sans le dire nulle part en
 * toutes lettres : un intitulé de section se reconnaît à son fond distinct, ou
 * à son texte écrit à la verticale dans une cellule fusionnée. Sans ces deux
 * attributs, la moitié des sections sont indiscernables d'un libellé de champ.
 */
function cellFormats() {
  if (!exists('xl/styles.xml')) return [];
  const xfs = [];
  let inCellXfs = false;
  let cur = null;

  parse(read('xl/styles.xml'), {
    open: (name, a, selfClosing) => {
      if (name === 'cellXfs') inCellXfs = true;
      if (!inCellXfs) return;
      if (name === 'xf') {
        cur = { fillId: a.fillId !== undefined ? parseInt(a.fillId, 10) : 0 };
        if (selfClosing) { xfs.push(cur); cur = null; }
      }
      if (name === 'alignment' && cur && a.textRotation) {
        cur.textRotation = parseInt(a.textRotation, 10);
      }
    },
    close: (name) => {
      if (name === 'xf' && inCellXfs && cur) { xfs.push(cur); cur = null; }
      if (name === 'cellXfs') inCellXfs = false;
    },
  });
  return xfs;
}

// ── Assemblage ─────────────────────────────────────────────────────────────
const strings = sharedStrings();
const { sheets, definedNames } = workbook();
const wbRels = rels('xl/_rels/workbook.xml.rels');

const result = { definedNames, cellFormats: cellFormats(), sheets: [] };

for (const s of sheets) {
  const target = wbRels[s.rid];
  if (!target) continue;
  const sheetPath = 'xl/' + target.replace(/^\/?xl\//, '').replace(/^\//, '');
  if (!exists(sheetPath)) continue;

  const { cells, validations, merges } = worksheet(sheetPath, strings);

  // Notes rattachées à la feuille
  const base = path.basename(sheetPath);
  const dir = path.dirname(sheetPath);
  const sheetRels = rels(`${dir}/_rels/${base}.rels`);
  let commentsPart = null;
  for (const t of Object.values(sheetRels)) {
    if (/comments\d*\.xml$/i.test(t)) {
      commentsPart = path.posix.normalize(path.posix.join(dir, t)).replace(/\\/g, '/');
    }
  }
  const notes = comments(commentsPart);

  result.sheets.push({
    name: s.name,
    state: s.state,
    file: sheetPath,
    cellCount: Object.keys(cells).length,
    noteCount: Object.keys(notes).length,
    validationCount: validations.length,
    cells,
    notes,
    validations,
    merges,
  });
}

fs.writeFileSync(OUT, JSON.stringify(result, null, 1), 'utf8');

console.log('Plages nommées :', Object.keys(definedNames).length);
console.log('Formats de cellule :', result.cellFormats.length);
console.log('\nFeuille                                   cellules  notes  listes');
console.log('─'.repeat(72));
for (const s of result.sheets) {
  console.log(
    `${s.name.slice(0, 40).padEnd(40)} ${String(s.cellCount).padStart(8)} ${String(s.noteCount).padStart(6)} ${String(s.validationCount).padStart(7)}` +
      (s.state !== 'visible' ? `  [${s.state}]` : '')
  );
}
const tot = result.sheets.reduce((a, s) => ({ c: a.c + s.cellCount, n: a.n + s.noteCount, v: a.v + s.validationCount }), { c: 0, n: 0, v: 0 });
console.log('─'.repeat(72));
console.log(`${'TOTAL'.padEnd(40)} ${String(tot.c).padStart(8)} ${String(tot.n).padStart(6)} ${String(tot.v).padStart(7)}`);
