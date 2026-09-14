#!/usr/bin/env node
/**
 * Contrôle : le fichier autonome peut-il se reproduire lui-même à l'identique ?
 *
 * La page « Télécharger l'application » ne peut pas relire son propre fichier —
 * `fetch` est refusé en `file://` — elle re-sérialise donc son DOM en y
 * réinjectant le `<app-root>` d'origine, mis de côté au démarrage.
 *
 * Le contrôle interroge la page elle-même. On ouvre `#/telecharger`, qui
 * affiche l'empreinte SHA-256 de la copie qu'elle produirait, et on la compare
 * à celle du fichier sur le disque. Passer par l'affichage éprouve **le vrai
 * chemin de code** — restitution du gabarit, mise à l'écart des feuilles de
 * style injectées à l'exécution, sérialisation — et pas une reconstitution
 * parallèle qui pourrait diverger sans qu'on le voie.
 *
 * En cas d'écart, un second passage refait la reconstitution ici pour situer la
 * divergence : un « échec » sans position ne sert à rien.
 *
 * Deux causes possibles : le build n'écrit plus le fichier sous la forme que le
 * navigateur produit en le re-sérialisant (voir la fin de `inline-build.js`),
 * ou l'exécution ajoute au document des nœuds qui ne sont pas écartés.
 *
 * Aucune dépendance : `--dump-dom` évite d'avoir à piloter le navigateur.
 *
 * Usage : node tools/check-extract.js [chemin/index.html]
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const RACINE = path.resolve(__dirname, '..');
const CIBLE = path.resolve(process.argv[2] || path.join(RACINE, 'index.html'));

const CHROMES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

function trouverChrome() {
  const explicite = process.env.CHROME_PATH;
  if (explicite && fs.existsSync(explicite)) return explicite;
  const trouve = CHROMES.find((p) => fs.existsSync(p));
  if (!trouve) {
    console.error(
      'Chrome est introuvable. Indiquez son chemin dans la variable CHROME_PATH.'
    );
    process.exit(2);
  }
  return trouve;
}

/** Sépare `<app-root>…</app-root>` du reste, pour les comparer à part. */
function decouper(html) {
  const m = html.match(/<app-root[^>]*>[\s\S]*?<\/app-root>/i);
  if (!m) return null;
  return {
    avant: html.slice(0, m.index),
    racine: m[0],
    apres: html.slice(m.index + m[0].length),
  };
}

function sha(s) {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

/** Première divergence, avec son contexte — un « différent » seul n'aide pas. */
function ecart(a, b) {
  let i = 0;
  while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
  let j = 0;
  while (j < Math.min(a.length, b.length) - i && a[a.length - 1 - j] === b[b.length - 1 - j]) j++;
  return {
    position: i,
    attendu: a.slice(i, Math.min(a.length - j, i + 160)),
    obtenu: b.slice(i, Math.min(b.length - j, i + 160)),
  };
}

if (!fs.existsSync(CIBLE)) {
  console.error(`Fichier introuvable : ${CIBLE}`);
  process.exit(2);
}

const disque = fs.readFileSync(CIBLE, 'utf8');

function charger(route) {
  const profil = fs.mkdtempSync(path.join(os.tmpdir(), 'sobrieau-extract-'));
  try {
    return execFileSync(
      trouverChrome(),
      [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${profil}`,
        '--virtual-time-budget=8000',
        '--dump-dom',
        'file:///' + CIBLE.replace(/\\/g, '/') + route,
      ],
      {
        encoding: 'utf8',
        maxBuffer: 256 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 30000,
      }
    );
  } catch (e) {
    console.error('Chrome a échoué :', e.message);
    process.exit(2);
  } finally {
    fs.rmSync(profil, { recursive: true, force: true });
  }
}

let dump = charger('#/telecharger');

// `--dump-dom` passe par la sortie standard, qui laisse trois traces étrangères
// au navigateur : les fins de ligne converties sous Windows, le doctype remis en
// majuscules, et un saut de ligne final ajouté à l'écriture. Une sérialisation
// de DOM ne se termine jamais après `</html>` — on les défait toutes les trois.
dump = dump
  .replace(/\r\n/g, '\n')
  .replace(/^<!DOCTYPE html>/, '<!doctype html>')
  .replace(/\n$/, '');

const attendue = sha(disque);

console.log(`fichier      : ${path.relative(RACINE, CIBLE) || CIBLE}`);
console.log(`taille       : ${Math.round(disque.length / 1024)} Ko`);
console.log(`empreinte    : ${attendue.slice(0, 32)}…`);

// La page a-t-elle seulement pu s'afficher ? Les motifs tolèrent les attributs
// qu'Angular ajoute à chaque balise (`_ngcontent-…`), placés avant `class`.
const indispo = dump.match(/<p[^>]*class="alerte"[^>]*>([\s\S]*?)<\/p>/);
const annoncee = dump.match(/<code[^>]*class="somme"[^>]*>\s*([0-9a-f]{64})\s*<\/code>/);

if (!annoncee) {
  console.log('\nECHEC — la page n’a pas annoncé d’empreinte.');
  if (indispo) console.log(`  elle indique : ${indispo[1].replace(/\s+/g, ' ').trim()}`);
  else console.log("  la page « Télécharger l'application » ne s'est pas affichée.");
  process.exit(1);
}

console.log(`annoncée     : ${annoncee[1].slice(0, 32)}…`);

// Combien de feuilles de style l'exécution a-t-elle ajoutées ? Zéro rendrait le
// contrôle du filtrage sans objet — autant le savoir.
const styles = (s) => (s.match(/<style[\s>]/g) || []).length;
console.log(
  `styles       : ${styles(disque)} dans le fichier, ${styles(dump)} après rendu ` +
    `(${styles(dump) - styles(disque)} injectés, donc écartés)`
);

if (annoncee[1] === attendue) {
  console.log('\nOK — la copie produite par la page est identique au livrable.');
  process.exit(0);
}

console.log('\nECHEC — la copie produite différerait du livrable.');

// Second passage : refaire la reconstitution ici, pour situer l'écart.
const aDisque = decouper(disque);
const aDump = decouper(dump);
if (!aDisque || !aDump) {
  console.log('  <app-root> introuvable : impossible de situer la divergence.');
  process.exit(1);
}
const reconstitue = aDump.avant + aDisque.racine + aDump.apres;
console.log(`  longueurs : ${disque.length} attendu, ${reconstitue.length} reconstitué ici`);
const d = ecart(disque, reconstitue);
console.log(`  divergence au caractère ${d.position}`);
console.log(`    fichier : ${JSON.stringify(d.attendu)}`);
console.log(`    copie   : ${JSON.stringify(d.obtenu)}`);
console.log(
  '\nPistes : la forme canonique écrite par inline-build.js ne correspond plus\n' +
    "à ce que le navigateur sérialise, ou l'exécution ajoute des nœuds au document."
);
process.exit(1);
