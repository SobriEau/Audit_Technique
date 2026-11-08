/**
 * Contrôle de l'écrivain ZIP : l'archive s'ouvre-t-elle vraiment ?
 *
 * L'archive est le livrable qu'un auditeur remet à un collègue. Une archive
 * refusée par l'Explorateur de Windows, ou dont une photo revient tronquée, ne
 * se voit pas au moment de la produire — seulement à la réception, quand il est
 * trop tard pour refaire la visite.
 *
 * Ce script compile `zip.ts` tel que l'application l'embarque, en produit une
 * archive aux contenus pénibles (accents, dossiers, fichier vide, binaire
 * aléatoire, nom en double), puis la confie à **`unzip`**, un lecteur
 * indépendant : intégrité déclarée, arborescence, et chaque octet relu comparé
 * à l'octet écrit.
 *
 *   node tools/check-zip.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { compiler } = require('./lib/compiler');

const ts = compiler(['src/app/core/utils/zip.ts']);
const { creerZip, crc32, nomUnique } = ts.charger('app/core/utils/zip.js');
ts.nettoyer();

let echecs = 0;
const ok = (cond, message, detail) => {
  if (cond) return;
  echecs++;
  console.log('  ✗ ' + message + (detail === undefined ? '' : '\n      ' + String(detail).slice(0, 500)));
};

function aUnzip() {
  try {
    execFileSync('unzip', ['-v'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// ── Contenus à éprouver ────────────────────────────────────────────────────

const encodeur = new TextEncoder();

/** Binaire pseudo-aléatoire reproductible : un JPEG ne se compresse pas. */
function binaire(n, graine) {
  const out = new Uint8Array(n);
  let x = graine;
  for (let i = 0; i < n; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    out[i] = (x >>> 16) & 0xff;
  }
  return out;
}

const ATTENDUS = [
  { chemin: 'index.html', contenu: encodeur.encode('<!doctype html>\n<p>Café — école</p>\n') },
  // Un nom de dossier accentué : c'est le cas courant, les audits s'appellent
  // « École Jean Moulin ». Le bit UTF-8 de l'en-tête doit être posé.
  { chemin: 'ecole-jean-moulin-a1b2c3d4/audit.json', contenu: encodeur.encode(JSON.stringify({ NomSite: 'École « Jean Moulin »', n: 12.5 })) },
  { chemin: 'ecole-jean-moulin-a1b2c3d4/20261108_robinet-3_1f2e3d4c.jpg', contenu: binaire(40000, 7), stocker: true },
  { chemin: 'ecole-jean-moulin-a1b2c3d4/plans/rdc.png', contenu: binaire(9000, 11), stocker: true },
  // Un texte très répétitif : la compression doit mordre.
  { chemin: 'ecole-jean-moulin-a1b2c3d4/notes.txt', contenu: encodeur.encode('fuite au compteur\n'.repeat(3000)) },
  // Un fichier vide, et un chemin à nettoyer (« ./ » en tête).
  { chemin: 'vide.txt', contenu: new Uint8Array(0) },
  { chemin: './LISEZ-MOI.txt', contenu: 'Archive SobriEau\n' },
];

console.log("\nCONTRÔLE DE L'ÉCRIVAIN ZIP — l'archive s'ouvre-t-elle ?\n");

(async () => {
  // ── CRC-32, contre une valeur connue ────────────────────────────────────
  // « 123456789 » → 0xCBF43926, la valeur de référence du CRC-32.
  ok(crc32(encodeur.encode('123456789')) === 0xcbf43926, 'CRC-32 : valeur de référence', crc32(encodeur.encode('123456789')).toString(16));
  ok(crc32(new Uint8Array(0)) === 0, 'CRC-32 : un contenu vide donne 0');

  // ── nomUnique ───────────────────────────────────────────────────────────
  const pris = new Set();
  const noms = ['photo.jpg', 'photo.jpg', 'photo.jpg', 'sansext'].map((n) => nomUnique(pris, n));
  ok(
    noms.join(' ') === 'photo.jpg photo-2.jpg photo-3.jpg sansext',
    'nomUnique : deux photos homonymes doivent être numérotées',
    noms.join(' ')
  );

  // ── Refus ───────────────────────────────────────────────────────────────
  const refuse = async (entrees, quoi) => {
    try {
      await creerZip(entrees);
      ok(false, `${quoi} : aurait dû être refusé`);
    } catch {
      /* attendu */
    }
  };
  await refuse([{ chemin: 'a.txt', contenu: 'x' }, { chemin: 'a.txt', contenu: 'y' }], 'deux fois le même chemin');
  await refuse([{ chemin: '', contenu: 'x' }], 'chemin vide');
  await refuse([{ chemin: '/', contenu: 'x' }], 'chemin réduit à une barre');

  // Une remontée de dossier est **résolue**, pas refusée, et ne descend jamais
  // sous la racine : l'extraction ne doit pas pouvoir écrire hors de son
  // dossier. Refuser ferait perdre toute l'archive pour un nom mal formé.
  if (aUnzip()) {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'sobrieau-zip-evasion-'));
    try {
      const a = path.join(d, 'evasion.zip');
      const z = await creerZip([
        { chemin: '../evasion.txt', contenu: 'x' },
        { chemin: 'a/../b/c.txt', contenu: 'y' },
      ]);
      fs.writeFileSync(a, Buffer.from(await z.arrayBuffer()));
      const liste = execFileSync('unzip', ['-Z', '-1', a], { encoding: 'utf8' }).trim().split('\n').sort();
      ok(
        liste.join('|') === 'b/c.txt|evasion.txt',
        'une remontée de dossier doit être neutralisée, pas conservée',
        liste.join('|')
      );
    } finally {
      fs.rmSync(d, { recursive: true, force: true });
    }
  }

  // ── L'archive complète ──────────────────────────────────────────────────
  const blob = await creerZip(ATTENDUS);
  const octets = Buffer.from(await blob.arrayBuffer());
  ok(blob.type === 'application/zip', 'type MIME de l’archive', blob.type);
  ok(octets.subarray(0, 4).toString('hex') === '504b0304', 'signature ZIP en tête', octets.subarray(0, 4).toString('hex'));

  const brut = ATTENDUS.reduce((n, e) => n + (typeof e.contenu === 'string' ? encodeur.encode(e.contenu).length : e.contenu.length), 0);
  ok(octets.length < brut, `l'archive (${octets.length} o) doit être plus petite que son contenu (${brut} o)`);

  if (!aUnzip()) {
    console.log("  ⚠ `unzip` est absent : la relecture indépendante est sautée.");
    console.log(echecs ? `\n${echecs} échec(s).` : "\nL'écrivain ZIP est conforme (relecture non effectuée).");
    process.exit(echecs ? 1 : 0);
  }

  const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'sobrieau-zip-'));
  const archive = path.join(dossier, 'archive.zip');
  fs.writeFileSync(archive, octets);
  try {
    // ── Intégrité, par un lecteur indépendant ─────────────────────────────
    let test = '';
    try {
      test = execFileSync('unzip', ['-t', archive], { encoding: 'utf8' });
    } catch (e) {
      ok(false, 'unzip refuse l’archive', (e.stdout || '') + (e.stderr || ''));
    }
    ok(/No errors detected/.test(test), 'unzip -t doit ne signaler aucune erreur', test);

    // ── Arborescence ──────────────────────────────────────────────────────
    const extrait = path.join(dossier, 'extrait');
    execFileSync('unzip', ['-q', '-o', archive, '-d', extrait], { stdio: 'ignore' });

    const listes = [];
    const parcourir = (d, prefixe) => {
      for (const n of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        const p = path.join(d, n.name);
        if (n.isDirectory()) parcourir(p, prefixe + n.name + '/');
        else listes.push(prefixe + n.name);
      }
    };
    parcourir(extrait, '');

    const voulus = ATTENDUS.map((e) => e.chemin.replace(/^\.\//, '')).sort();
    ok(
      listes.sort().join('|') === voulus.join('|'),
      "l'arborescence extraite doit être celle demandée",
      `obtenu : ${listes.join(', ')}\n      voulu  : ${voulus.join(', ')}`
    );

    // ── Chaque octet ──────────────────────────────────────────────────────
    let faux = 0;
    for (const e of ATTENDUS) {
      const chemin = path.join(extrait, e.chemin.replace(/^\.\//, ''));
      if (!fs.existsSync(chemin)) {
        faux++;
        continue;
      }
      const relu = new Uint8Array(fs.readFileSync(chemin));
      const voulu = typeof e.contenu === 'string' ? encodeur.encode(e.contenu) : e.contenu;
      const identique = relu.length === voulu.length && relu.every((o, i) => o === voulu[i]);
      if (!identique) {
        faux++;
        ok(false, `contenu altéré : ${e.chemin}`, `${voulu.length} o écrits, ${relu.length} o relus`);
      }
    }
    ok(faux === 0, `${faux} fichier(s) ne sont pas revenus identiques`);

    console.log(
      `  ${'archive relue par unzip'.padEnd(44)} ${String(ATTENDUS.length).padStart(5)} fichiers, ` +
        `${brut} o → ${octets.length} o` + (echecs ? '   ✗' : '')
    );
  } finally {
    fs.rmSync(dossier, { recursive: true, force: true });
  }

  console.log(echecs ? `\n${echecs} échec(s).` : "\nL'archive produite s'ouvre et rend chaque octet à l'identique.");
  process.exit(echecs ? 1 : 0);
})();
