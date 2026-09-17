/**
 * Épreuve de fumée du fichier autonome, en `file://`.
 *
 * La compilation ne prouve presque rien dans ce projet : l'essentiel du
 * comportement est interactif, dépend du stockage, et une page peut se rendre
 * vide sans qu'aucune erreur ne remonte (c'est exactement ce qui est arrivé
 * quand un poste refusait `localStorage`). Ce script ouvre chaque écran dans
 * Chrome, à la même origine que l'auditeur, et vérifie qu'un repère attendu
 * s'y trouve.
 *
 * Il ne remplace pas un essai à la main — il attrape la panne franche.
 *
 *   node tools/smoke-test.js [chemin.html]
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const CIBLE = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));

const CANDIDATS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

function trouverChrome() {
  const explicite = process.env.CHROME_PATH;
  if (explicite && fs.existsSync(explicite)) return explicite;
  for (const c of CANDIDATS) if (fs.existsSync(c)) return c;
  console.error('Chrome est introuvable. Indiquez son chemin dans CHROME_PATH.');
  process.exit(2);
}

const chrome = trouverChrome();

function charger(route) {
  const profil = fs.mkdtempSync(path.join(os.tmpdir(), 'sobrieau-smoke-'));
  try {
    return execFileSync(
      chrome,
      [
        '--headless=new',
        '--disable-gpu',
        // Repris de check-extract.js (origin/main) : nécessaire quand Chrome
        // est remplacé par le Chromium de Puppeteer, ou lancé en conteneur.
        '--no-sandbox',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${profil}`,
        '--virtual-time-budget=8000',
        '--dump-dom',
        'file:///' + CIBLE.replace(/\\/g, '/') + route,
      ],
      { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'], timeout: 30000 }
    );
  } catch (e) {
    console.error('Chrome a échoué :', e.message);
    process.exit(2);
  } finally {
    fs.rmSync(profil, { recursive: true, force: true });
  }
}

/**
 * Chaque écran, avec ce qui doit s'y trouver.
 *
 * `absent` liste ce qui ne doit **pas** s'afficher — une section masquée par
 * défaut qui réapparaîtrait est une régression aussi réelle qu'un écran vide.
 * Le repli statique de `index.html` est traité à part (`REPLI`) : s'il est
 * encore là, Angular n'a pas démarré.
 */
const ECRANS = [
  { route: '#/accueil', attendu: ['Nouvel audit', 'France 2030', 'Ponts et Chaussées'], titre: 'Accueil général' },
  { route: '#/home', attendu: ['Nom du site audité', 'Effectif', "Nom et fonction de l'accompagnant", "Utilisations de l'eau", 'Voir la liste des documents collectés', 'Niveau de remplissage des fiches', 'Surpresseurs'], titre: 'Accueil du projet' },
  { route: '#/documents', attendu: ['Documents collectés', 'Dossier Technique Amiante', 'priority--obligatoire'], titre: 'Documents à collecter' },
  { route: '#/glossaire', attendu: ['Glossaire', 'Eau Chaude Sanitaire', 'Plénum'], titre: 'Glossaire' },
  // Audit neuf, rien de coché : seules les sept sections permanentes
  // s'affichent. « Points d'eau intérieurs » n'a donc rien à montrer — sa
  // présence signalerait qu'un audit neuf retombe dans l'ancien régime où tout
  // était visible (défaut corrigé à la fusion avec origin/main).
  {
    route: '#/qte',
    attendu: ['Arrivée d’eau', 'Date de construction du bâtiment', 'Structure et opportunités', 'Toitures'],
    absent: ['Points d’eau intérieurs', 'Surpresseurs', 'Zone piscine'],
    titre: 'Tableau de bord',
  },
  { route: '#/qte/robinets', attendu: ['Robinets'], titre: 'Liste des robinets' },
  { route: '#/qte/piscines', attendu: ['Pédiluve', 'Nettoyage des plages', 'Piscines'], titre: 'Piscines et zone commune' },
  { route: '#/qte/compteur-general', attendu: ['Compteur général', 'Localisation', 'Etat lors de la visite', 'priority--obligatoire'], titre: 'Fiche compteur général' },
];

const REPLI = 'Le navigateur a refusé';

let ko = 0;
console.log(`\nÉPREUVE DE FUMÉE — ${path.basename(CIBLE)} en file://\n`);

for (const e of ECRANS) {
  const dom = charger(e.route);
  // Le fichier autonome inline son JavaScript et ses styles : le texte du
  // bundle contient tous les libellés du schéma et toutes les classes CSS.
  // Chercher dans le DOM brut validait donc des attentes que l'écran ne
  // montrait pas, et signalait comme affiché ce qui ne l'était pas. On ne
  // cherche que dans le rendu.
  const rendu = dom.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  const manquants = e.attendu.filter((a) => !rendu.includes(a));
  const intrus = (e.absent || []).filter((a) => rendu.includes(a));
  const bloque = rendu.includes(REPLI);

  if (bloque) {
    console.log(`✗ ${e.titre.padEnd(24)} ${e.route}  — Angular n'a pas démarré (repli statique affiché)`);
    ko++;
  } else if (manquants.length || intrus.length) {
    const details = [
      manquants.length ? `absent : ${manquants.join(', ')}` : '',
      intrus.length ? `ne devrait pas figurer : ${intrus.join(', ')}` : '',
    ].filter(Boolean);
    console.log(`✗ ${e.titre.padEnd(24)} ${e.route}  — ${details.join(' ; ')}`);
    ko++;
  } else {
    console.log(`✓ ${e.titre.padEnd(24)} ${e.route}`);
  }
}

console.log();
if (ko) {
  console.log(`${ko} écran(s) en défaut.`);
  process.exit(1);
}
console.log('Tous les écrans se rendent.');
