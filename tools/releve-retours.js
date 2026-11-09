/**
 * Dépouillement de `MAJ/retours/retours-cumules.html`, marqueurs conservés.
 *
 * Le document est un export d'éditeur riche : l'état de chaque remarque n'est
 * pas écrit, il est **peint**. La légende est dans le document, sous le titre
 * « Victor » : vert = traité, rouge = à traiter, jaune = à vérifier partout,
 * bleu = appel nécessaire.
 *
 * ⚠️ **Une conversion naïve perd cette information**, et le relevé devient
 * faux : un premier dépouillement n'avait gardé que le rouge, concluait à huit
 * demandes traitées, et en manquait 149 — toute la partie que l'auteur avait
 * passée en vert. D'où ce script, pour que le relevé soit reproductible.
 *
 * Les **surlignages** (fonds rose, vert pâle, jaune pâle) sont une seconde
 * couche, distincte de la légende : l'auteur y répond en ligne. Un surlignage
 * vert pâle ne veut pas dire « traité ».
 *
 *   node tools/releve-retours.js [chemin.html] [--compte]
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const COMPTE = args.includes('--compte');
const CIBLE = path.resolve(
  args.find((a) => !a.startsWith('--')) ||
    path.join(__dirname, '..', 'MAJ', 'retours', 'retours-cumules.html')
);

if (!fs.existsSync(CIBLE)) {
  console.error(`Document introuvable : ${CIBLE}`);
  process.exit(2);
}

/** Couleurs de texte — la légende que le document porte lui-même. */
const LEGENDE = {
  '#26c281': 'VERT',
  '#ed3757': 'ROUGE',
  '#f5b31b': 'JAUNE',
  '#0061d5': 'BLEU',
  '#cb02b0': 'MAGENTA',
  '#909090': 'GRIS',
};

/** Fonds de surlignage — couche d'annotation distincte, jamais un état. */
const SURLIGNAGE = {
  '#fbd7dd': 'surl-rose',
  '#d4f3e6': 'surl-vert',
  '#fdf0d1': 'surl-jaune',
};

const ENTITES = {
  '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
  '&rsquo;': '’', '&lsquo;': '‘', '&ldquo;': '“', '&rdquo;': '”',
  '&eacute;': 'é', '&egrave;': 'è', '&ecirc;': 'ê', '&euml;': 'ë',
  '&agrave;': 'à', '&acirc;': 'â', '&ccedil;': 'ç', '&ugrave;': 'ù',
  '&ucirc;': 'û', '&ocirc;': 'ô', '&icirc;': 'î', '&iuml;': 'ï',
  '&deg;': '°', '&rarr;': '→', '&hellip;': '…', '&apos;': "'",
  '&sup2;': '²', '&laquo;': '«', '&raquo;': '»', '&mdash;': '—', '&ndash;': '–',
};

function decoder(t) {
  return t
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&[a-zA-Z]+\d*;/g, (e) => ENTITES[e] ?? e);
}

const texteDe = (frag) =>
  decoder(frag.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ''))
    .replace(/[\s ]+/g, ' ')
    .trim();

function marqueursDe(frag) {
  const out = [];
  for (const [re, table] of [
    [/(?<!background-)color:\s*(#[0-9a-fA-F]{6})/gi, LEGENDE],
    [/background-color:\s*(#[0-9a-fA-F]{6})/gi, SURLIGNAGE],
  ]) {
    for (const m of frag.matchAll(re)) {
      const nom = table[m[1].toLowerCase()];
      if (nom && !out.includes(nom)) out.push(nom);
    }
  }
  return out;
}

/** Part du texte réellement peinte : distingue un item coloré d'un aparté. */
function partPeinte(frag) {
  const total = texteDe(frag).length;
  if (!total) return 0;
  let peint = 0;
  const re = /<span style="[^"]*(?<!background-)color:\s*(#[0-9a-fA-F]{6})[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
  for (const m of frag.matchAll(re)) {
    if (LEGENDE[m[1].toLowerCase()]) peint += texteDe(m[2]).length;
  }
  return peint / total;
}

const html = fs.readFileSync(CIBLE, 'utf8');
const blocs = html.split(/(?=<li\b)|(?=<h[1-6]\b)|(?=<p\b)/i);

const sections = [];
let courante = { titre: '(avant la première section)', items: [] };
sections.push(courante);

for (const b of blocs) {
  const t = texteDe(b);
  if (!t) continue;
  const estTitre = /^<h[1-6]/i.test(b) || (/<strong>/i.test(b) && /<u>/i.test(b));
  if (estTitre) {
    courante = { titre: t, items: [] };
    sections.push(courante);
    continue;
  }
  // La ligne de légende porte les quatre couleurs à la fois : comptée comme un
  // item, elle gonflerait le vert d'une unité et rendrait le total incitable.
  if (/en vert\s*:\s*les remarques sont trait/i.test(t)) {
    courante.legende = t;
    continue;
  }
  const marques = marqueursDe(b);
  const partiel = marques.length > 0 && partPeinte(b) <= 0.75;
  courante.items.push({ texte: t, marques, partiel });
}

if (COMPTE) {
  const etat = (i) => {
    if (!i.marques.length) return 'nu';
    for (const m of ['VERT', 'ROUGE', 'JAUNE', 'BLEU']) if (i.marques.includes(m)) return m;
    return 'autre';
  };
  const colonnes = ['VERT', 'ROUGE', 'JAUNE', 'BLEU', 'autre', 'nu'];
  const total = Object.fromEntries(colonnes.map((c) => [c, 0]));
  console.log('section'.padEnd(52) + colonnes.map((c) => c.padStart(7)).join(''));
  for (const s of sections) {
    if (!s.items.length) continue;
    const d = Object.fromEntries(colonnes.map((c) => [c, 0]));
    for (const i of s.items) d[etat(i)]++;
    for (const c of colonnes) total[c] += d[c];
    console.log(s.titre.slice(0, 50).padEnd(52) + colonnes.map((c) => String(d[c]).padStart(7)).join(''));
  }
  console.log('TOTAL'.padEnd(52) + colonnes.map((c) => String(total[c]).padStart(7)).join(''));
  console.log(
    '\nVERT = traité · ROUGE = à traiter · JAUNE = à vérifier partout · BLEU = appel nécessaire' +
      '\nnu = non annoté (la légende ne vaut que pour la partie « Victor » et suivantes)'
  );
} else {
  for (const s of sections) {
    if (!s.items.length && !s.legende) continue;
    console.log('\n### ' + s.titre);
    if (s.legende) console.log('  (légende) ' + s.legende);
    for (const i of s.items) {
      const m = i.marques.length ? '[' + i.marques.join('+') + (i.partiel ? ' partiel' : '') + '] ' : '';
      console.log('  ' + m + i.texte);
    }
  }
}
