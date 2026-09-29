/**
 * Génère `illustrations.ts` : les images du classeur qui expliquent une liste
 * de choix — types d'émetteur et de jets de douche, types de toilettes,
 * gouttières et chéneaux.
 *
 * Le classeur les pose à côté du champ, chacune avec une légende dans une
 * cellule voisine. Elles manquaient à l'écran (Victor Ledoux, 2026-09).
 *
 * Trois contraintes :
 *  - **Inlinées en data URI**, comme les logos : un fichier à part ne se
 *    chargerait pas en `file://`.
 *  - **Recadrées comme dans Excel** : le classeur réutilise une même image
 *    découpée en trois (les gouttières), le recadrage fait partie du dessin.
 *  - **Réencodées en JPEG réduit** : les originaux pèsent jusqu'à 350 Ko
 *    (PNG). Node n'a pas de quoi traiter une image sans dépendance ; Chrome,
 *    déjà requis par les contrôles, le fait par un canevas. Chrome est cherché
 *    comme pour `smoke-test.js` (sinon `CHROME_PATH`).
 *
 * Le rattachement image → champ est écrit à la main (`ILLUSTRATIONS`, dans
 * `lib/classeur.js`), par cellule d'ancrage et cellule de légende : rien dans le classeur ne relie
 * une image à une question. Une cellule qui ne se résout plus **arrête la
 * génération** plutôt que d'associer une image au mauvais champ.
 *
 * Usage : node tools/gen-illustrations.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const wb = require('./.cache/workbook.json');
const { colName, ILLUSTRATIONS } = require('./lib/classeur');

const XLSX = path.join(__dirname, '.cache', 'xlsx', 'xl');
const SORTIE = path.join(__dirname, '..', 'src', 'app', 'models', 'illustrations.ts');

/** Plus grand côté de l'image réencodée, en pixels. */
const COTE_MAX = 520;

// ── Lecture des dessins ─────────────────────────────────────────────────────

const lire = (p) => fs.readFileSync(path.join(XLSX, p), 'utf8');
const relations = (p) => {
  const f = path.join(XLSX, p);
  if (!fs.existsSync(f)) return {};
  const out = {};
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/<Relationship\b[^>]*>/g)) {
    const id = m[0].match(/Id="([^"]+)"/)[1];
    const cible = m[0].match(/Target="([^"]+)"/)[1];
    out[id] = cible;
  }
  return out;
};

/** Images d'une feuille, indexées par cellule d'ancrage. */
function imagesDeFeuille(nomFeuille) {
  const wbRels = relations('_rels/workbook.xml.rels');
  const feuille = [...lire('workbook.xml').matchAll(/<sheet\b[^>]*>/g)]
    .map((m) => m[0])
    .find((t) => t.includes(`name="${nomFeuille.replace(/&/g, '&amp;')}"`));
  if (!feuille) throw new Error(`feuille « ${nomFeuille} » introuvable`);
  const fichier = path.basename(wbRels[feuille.match(/r:id="([^"]+)"/)[1]]);
  // Pas le dessin VML des commentaires, qui vit dans le même dossier.
  const dessin = Object.values(relations(`worksheets/_rels/${fichier}.rels`)).find((t) => /drawings\/drawing\d+\.xml$/.test(t));
  if (!dessin) return new Map();
  const nomDessin = path.basename(dessin);
  const medias = relations(`drawings/_rels/${nomDessin}.rels`);

  const parAncre = new Map();
  for (const m of lire(`drawings/${nomDessin}`).matchAll(/<xdr:twoCellAnchor[\s\S]*?<\/xdr:twoCellAnchor>/g)) {
    const a = m[0];
    const embed = a.match(/r:embed="([^"]+)"/);
    if (!embed) continue; // forme, pas image
    const de = a.match(/<xdr:from><xdr:col>(\d+)<\/xdr:col>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/);
    const ref = colName(Number(de[1]) + 1) + (Number(de[2]) + 1);
    const rect = a.match(/<a:srcRect\b([^>]*)\/>/);
    const recadrage = { l: 0, t: 0, r: 0, b: 0 };
    if (rect) for (const [, k, v] of rect[1].matchAll(/\b([ltrb])="(-?\d+)"/g)) recadrage[k] = Number(v) / 100000;
    parAncre.set(ref, { media: path.basename(medias[embed[1]]), recadrage });
  }
  return parAncre;
}

// ── Réencodage par Chrome ───────────────────────────────────────────────────

const CANDIDATS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

function trouverChrome() {
  const explicite = process.env.CHROME_PATH;
  if (explicite && fs.existsSync(explicite)) return explicite;
  return CANDIDATS.find((c) => fs.existsSync(c)) || null;
}

const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif' };

function reencoder(taches) {
  const chrome = trouverChrome();
  if (!chrome) {
    console.error('Chrome est introuvable (CHROME_PATH) : illustrations.ts est laissé tel quel.');
    process.exit(0);
  }
  const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'sobrieau-illus-'));
  // Les images passent en data URI : une image chargée depuis `file://`
  // teinterait le canevas, qui refuserait alors d'exporter.
  const entrees = taches.map((t) => {
    const ext = t.media.split('.').pop().toLowerCase();
    const b64 = fs.readFileSync(path.join(XLSX, 'media', t.media)).toString('base64');
    return { src: `data:${MIME[ext]};base64,${b64}`, recadrage: t.recadrage };
  });
  const page = `<!doctype html><meta charset="utf-8"><pre id="out"></pre><script>
const E = ${JSON.stringify(entrees)};
Promise.all(E.map((e) => new Promise((ok) => {
  const img = new Image();
  img.onload = () => {
    const { l, t, r, b } = e.recadrage;
    const sx = img.naturalWidth * l, sy = img.naturalHeight * t;
    const sw = img.naturalWidth * (1 - l - r), sh = img.naturalHeight * (1 - t - b);
    const k = Math.min(1, ${COTE_MAX} / Math.max(sw, sh));
    const c = document.createElement('canvas');
    c.width = Math.round(sw * k); c.height = Math.round(sh * k);
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
    ok(c.toDataURL('image/jpeg', 0.8));
  };
  img.onerror = () => ok(null);
  img.src = e.src;
}))).then((r) => { document.getElementById('out').textContent = JSON.stringify(r); });
</script>`;
  const fichier = path.join(dossier, 'reencodage.html');
  fs.writeFileSync(fichier, page);
  const dom = execFileSync(
    chrome,
    [
      // Sans `--user-data-dir` : la page ne lit ni n'écrit aucun stockage, et
      // un profil dédié faisait se bloquer Chrome sur certains postes.
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--no-first-run',
      '--virtual-time-budget=20000',
      '--dump-dom',
      'file://' + fichier,
    ],
    { maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'], timeout: 60000 }
  ).toString();
  fs.rmSync(dossier, { recursive: true, force: true });
  const brut = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
  if (!brut || !brut[1]) throw new Error('Chrome n’a rien renvoyé');
  const res = JSON.parse(brut[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
  if (res.some((x) => !x)) throw new Error('une image n’a pas pu être décodée');
  return res;
}

// ── Écriture ────────────────────────────────────────────────────────────────

const texteCellule = (feuille, ref) => {
  const s = wb.sheets.find((x) => x.name === feuille);
  const v = s && s.cells[ref] && s.cells[ref].v;
  if (!v) throw new Error(`${feuille}!${ref} : légende vide`);
  return String(v).replace(/\s+/g, ' ').trim();
};

const taches = [];
for (const ill of ILLUSTRATIONS) {
  const [feuille] = ill.champ.split('!');
  const images = imagesDeFeuille(feuille);
  for (const im of ill.images) {
    const trouvee = images.get(im.ancre);
    if (!trouvee) throw new Error(`${feuille}!${im.ancre} : aucune image ancrée ici`);
    const legende = texteCellule(feuille, im.legende);
    taches.push({ champ: ill.champ, legende: legende[0].toUpperCase() + legende.slice(1), ...trouvee });
  }
}

const encodees = reencoder(taches);

const out = [];
out.push(`/**`);
out.push(` * Illustrations des listes de choix — GÉNÉRÉ depuis \`audit_technique.xlsx\``);
out.push(` * par \`node tools/gen-illustrations.js\`. Ne pas éditer à la main.`);
out.push(` *`);
out.push(` * Indexées par cellule d'origine du champ (\`FieldDef.source\`). Images`);
out.push(` * recadrées comme dans le classeur, réduites et réencodées en JPEG, inlinées`);
out.push(` * pour fonctionner en \`file://\`.`);
out.push(` */`);
out.push(`export interface Illustration {`);
out.push(`  legende: string;`);
out.push(`  src: string;`);
out.push(`}`);
out.push('');
out.push(`export const ILLUSTRATIONS: Record<string, Illustration[]> = {`);
let poids = 0;
for (const ill of ILLUSTRATIONS) {
  out.push(`  ${JSON.stringify(ill.champ)}: [`);
  taches.forEach((t, i) => {
    if (t.champ !== ill.champ) return;
    poids += encodees[i].length;
    out.push(`    { legende: ${JSON.stringify(t.legende)}, src: ${JSON.stringify(encodees[i])} },`);
  });
  out.push(`  ],`);
}
out.push(`};`);
out.push('');
fs.writeFileSync(SORTIE, out.join('\n'), 'utf8');
console.log(`illustrations.ts        ${taches.length} images, ${Math.round(poids / 1024)} Ko inlinés`);
