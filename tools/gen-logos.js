/**
 * Encode les logos de `src/assets/logos/` en data URI dans un module TypeScript.
 *
 * Pourquoi ne pas les servir comme fichiers : le livrable terrain est un
 * `index.html` unique ouvert en `file://`, où toute ressource externe échoue
 * silencieusement. Les inliner garantit leur affichage dans les deux cibles de
 * build.
 *
 * Régénérer après remplacement d'un logo :  node tools/gen-logos.js
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src', 'assets', 'logos');
const OUT = path.join(__dirname, '..', 'src', 'app', 'shared', 'logos.ts');

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };

/**
 * Les logos sont repérés par un motif, pas par un nom exact : un fichier
 * remplacé change souvent de nom et d'extension, et cela ne doit pas casser
 * la génération.
 */
const LOGOS = [
  { match: /sobrieau/i, name: 'LOGO_SOBRIEAU', desc: "Logotype SobriEau : symbole, nom et signature. Tient lieu de titre." },
  { match: /cerema/i, name: 'LOGO_CEREMA', desc: 'République Française — Cerema, climat & territoires de demain.' },
  { match: /agro/i, name: 'LOGO_AGROPARISTECH', desc: 'AgroParisTech Innovation SAS.' },
  // Repris de la maquette du classeur V3 (onglet « Accueil », image ancrée sous
  // « Ce projet est financé par : »). PNG faute de SVG : ~100 Ko une fois
  // inliné, alourdissement accepté (arbitrages-v3.md, Q19).
  { match: /financeurs/i, name: 'LOGO_FINANCEURS', desc: 'Financé par : République Française, France 2030, ADEME.' },
  { match: /ponts/i, name: 'LOGO_PONTS_IPPARIS', desc: 'École nationale des Ponts et Chaussées — Institut Polytechnique de Paris.' },
];

/**
 * Un SVG peut s'encoder en base64 ou en texte pourcent-encodé. Le second est
 * souvent plus compact, mais pas toujours : on produit les deux et on garde le
 * plus court.
 */
function svgDataUri(raw) {
  const clean = raw
    .replace(/<\?xml[\s\S]*?\?>/g, '') // déclaration XML : inutile en data URI
    .replace(/<!--[\s\S]*?-->/g, '') // commentaires de l'export Illustrator
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();

  const percent = 'data:image/svg+xml,' + encodeURIComponent(clean);
  const b64 = 'data:image/svg+xml;base64,' + Buffer.from(clean, 'utf8').toString('base64');
  return percent.length <= b64.length ? percent : b64;
}

const files = fs.existsSync(SRC) ? fs.readdirSync(SRC) : [];
const out = [
  '/**',
  ' * Logos encodés en data URI — FICHIER GÉNÉRÉ, ne pas éditer à la main.',
  ' *',
  " * Source : `src/assets/logos/`. Régénérer avec `node tools/gen-logos.js`.",
  " * L'inlining est imposé par le livrable autonome, qui ne peut charger aucune",
  ' * ressource externe depuis `file://`.',
  ' */',
  '',
];

let total = 0;
for (const l of LOGOS) {
  const file = files.find((f) => l.match.test(f) && MIME[path.extname(f).toLowerCase()]);
  if (!file) {
    console.error(`ERREUR : aucun fichier ne correspond à ${l.match} dans src/assets/logos/`);
    process.exit(1);
  }

  const ext = path.extname(file).toLowerCase();
  const p = path.join(SRC, file);
  const uri =
    ext === '.svg'
      ? svgDataUri(fs.readFileSync(p, 'utf8'))
      : `data:${MIME[ext]};base64,${fs.readFileSync(p).toString('base64')}`;

  total += uri.length;
  out.push(`/** ${l.desc} */`);
  out.push(`export const ${l.name} =`);
  out.push(`  '${uri.replace(/'/g, "\\'")}';`);
  out.push('');

  const src = Math.round(fs.statSync(p).size / 1024);
  console.log(`  ${file.padEnd(24)} ${String(src).padStart(3)} Ko → ${String(Math.round(uri.length / 1024)).padStart(3)} Ko inliné`);
}

fs.writeFileSync(OUT, out.join('\n'), 'utf8');
console.log(`\n  total : ${Math.round(total / 1024)} Ko → ${path.relative(path.join(__dirname, '..'), OUT)}`);
