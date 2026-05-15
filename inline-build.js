/**
 * inline-build.js
 *
 * Lit le build Angular depuis dist/sobrieau/ et inline tous les scripts
 * et feuilles de styles dans un unique fichier index.html autonome (offline).
 *
 * Usage : node inline-build.js
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist', 'sobrieau');
const outputFile = path.join(__dirname, 'index.html');

if (!fs.existsSync(distDir)) {
  console.error('ERREUR : dist/sobrieau/ introuvable.');
  console.error('Lancez "ng build" ou "npm run build" avant ce script.');
  process.exit(1);
}

const indexPath = path.join(distDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('ERREUR : dist/sobrieau/index.html introuvable.');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

// Inline les feuilles de styles (<link rel="stylesheet" href="...">)
html = html.replace(
  /<link rel="stylesheet" href="([^"]+)"[^>]*\/?>/gi,
  (match, href) => {
    const filePath = path.join(distDir, href);
    if (!fs.existsSync(filePath)) {
      console.warn(`Avertissement : fichier CSS introuvable : ${href}`);
      return match;
    }
    const css = fs.readFileSync(filePath, 'utf8');
    return `<style>${css}</style>`;
  }
);

// Inline les scripts (<script src="..." ...></script>)
html = html.replace(
  /<script ([^>]*?)src="([^"]+)"([^>]*)><\/script>/gi,
  (match, before, src, after) => {
    const filePath = path.join(distDir, src);
    if (!fs.existsSync(filePath)) {
      console.warn(`Avertissement : fichier JS introuvable : ${src}`);
      return match;
    }
    const js = fs.readFileSync(filePath, 'utf8');
    // Conserver les attributs existants (type="module", defer, etc.)
    const attrs = (before + after).trim();
    return `<script ${attrs}>${js}</script>`;
  }
);

// Supprimer <base href="/"> pour compatibilite file://
html = html.replace(/<base href="\/">/i, '<base href="">');

fs.writeFileSync(outputFile, html, 'utf8');

const sizeKo = Math.round(fs.statSync(outputFile).size / 1024);
console.log(`index.html autonome cree (${sizeKo} Ko) : ${outputFile}`);
