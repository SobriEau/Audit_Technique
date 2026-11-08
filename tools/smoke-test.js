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
  '/snap/bin/chromium',
];

function trouverChrome() {
  const explicite = process.env.CHROME_PATH;
  if (explicite && fs.existsSync(explicite)) return explicite;
  for (const c of CANDIDATS) if (fs.existsSync(c)) return c;
  console.error('Chrome est introuvable. Indiquez son chemin dans CHROME_PATH.');
  process.exit(2);
}

const chrome = trouverChrome();

const DRAPEAUX = [
  '--headless=new',
  '--disable-gpu',
  // Repris de check-extract.js (origin/main) : nécessaire quand Chrome
  // est remplacé par le Chromium de Puppeteer, ou lancé en conteneur.
  '--no-sandbox',
  '--no-first-run',
  '--no-default-browser-check',
];

function ouvrir(url, profil, budget) {
  return execFileSync(
    chrome,
    [...DRAPEAUX, `--user-data-dir=${profil}`, `--virtual-time-budget=${budget}`, '--dump-dom', url],
    { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'], timeout: 60000 }
  );
}

/**
 * Charge un écran dans un profil neuf.
 *
 * `graine` permet d'**amorcer le stockage** avant de charger la page : certains
 * écrans n'existent que sur un audit déjà rempli — la page d'une pièce, la
 * colonne « Pièce » d'une liste — et un audit neuf les renvoie ailleurs. Le
 * code de la graine est exécuté par une page `file://` du même profil, ce qui
 * suffit : toutes les pages `file://` d'un profil partagent le même
 * `localStorage` (mesuré, voir CLAUDE.md §2). C'est aussi, accessoirement, la
 * preuve que ce partage tient toujours.
 */
/** Page jetable, écrite là où le navigateur sait la lire (voir `charger`). */
function pageJetable(chemin, corps) {
  fs.writeFileSync(chemin, `<!DOCTYPE html><meta charset="utf-8"><title>sobrieau</title>${corps}`);
  return 'file:///' + chemin.replace(/\\/g, '/');
}

function charger(route, graine, releve) {
  const profil = fs.mkdtempSync(path.join(os.tmpdir(), 'sobrieau-smoke-'));
  // La page d'amorçage est écrite **à côté de la cible**, et non dans le
  // dossier temporaire du système : un navigateur installé en paquet confiné
  // (snap, flatpak) ne voit pas le `/tmp` de l'hôte, et la graine passait
  // alors inaperçue — les écrans amorcés retombaient sur un audit vide sans
  // qu'on sache pourquoi. Le fichier est retiré dans tous les cas.
  const amorce = path.join(path.dirname(CIBLE), `.sobrieau-graine-${process.pid}.html`);
  try {
    if (graine) ouvrir(pageJetable(amorce, `<script>${graine}</script>pret`), profil, 2000);

    const rendu = ouvrir('file:///' + CIBLE.replace(/\\/g, '/') + route, profil, 8000);
    if (!releve) return rendu;

    // Relevé de l'état **enregistré**, après le passage de l'application.
    // Certaines reprises ne se voient pas à l'écran : une identité attribuée
    // aux éléments d'un audit ancien ne change rien au tableau — Angular rend
    // la liste même sans elle — mais sans identité, la fiche est inatteignable
    // par son URL. C'est donc le `localStorage` qu'il faut regarder.
    const corps =
      '<pre id="r"></pre><script>try{document.getElementById("r").textContent=' +
      `(function(){${releve}})();}catch(e){document.getElementById("r").textContent="ERREUR "+e.message;}</script>`;
    return ouvrir(pageJetable(amorce, corps), profil, 2000);
  } catch (e) {
    console.error('Chrome a échoué :', e.message);
    process.exit(2);
  } finally {
    fs.rmSync(profil, { recursive: true, force: true });
    fs.rmSync(amorce, { force: true });
  }
}

/**
 * Audit amorcé : une pièce, et un robinet qui s'y trouve.
 *
 * Écrit sous la disposition réelle du registre (`sobrieau.index`,
 * `sobrieau.current`, `sobrieau.audit.<Id>`) : si celle-ci changeait sans que
 * la graine suive, les écrans ci-dessous retomberaient sur un audit vide et le
 * contrôle le dirait.
 */
const AUDIT_AMORCE = (() => {
  const audit = {
    Id: 'smoke-1',
    NomSite: 'École de la fumée',
    Adresse: '1 rue du Test',
    UtilisationsEau: { robinet: true },
    Pieces: [{ Id: 'piece-smoke', Nom: 'Sanitaires du test', Niveau: 'R+0', Localisation: null }],
    Qte: {
      robinets: [{ Id: 'rob-smoke', Numero: '1', Piece: 'piece-smoke', Emplacement: 'Près de la porte', Photos: [] }],
    },
  };
  const fiche = {
    Id: audit.Id,
    Adresse: audit.Adresse,
    AdresseKey: '1 rue du test',
    NomProjet: null,
    UpdatedAt: new Date().toISOString(),
  };
  return (
    `localStorage.setItem('sobrieau.index', ${JSON.stringify(JSON.stringify([fiche]))});` +
    `localStorage.setItem('sobrieau.current', 'smoke-1');` +
    `localStorage.setItem('sobrieau.audit.smoke-1', ${JSON.stringify(JSON.stringify(audit))});`
  );
})();

/**
 * Audit de **l'ancien format**, tel qu'un auditeur en a sur son poste.
 *
 * Il cumule tout ce que les versions successives ont laissé derrière elles, et
 * c'est voulu : chacun de ces points s'est déjà cassé, ou aurait pu.
 *
 *  - rangé sous la **clé mono-audit** `sobrieau`, d'avant le registre — la
 *    reprise doit avoir lieu au démarrage (`migrateLegacy`) ;
 *  - adresse en **texte enrichi**, du temps où le champ l'était ;
 *  - **aucun `Id`** sur les éléments : `ensureEntityIds` doit leur en donner,
 *    sinon leur fiche est inatteignable par son URL ;
 *  - **compteur général en objet**, d'avant son passage en liste (2026-09) ;
 *  - **`EquipementsPresents` sans `UtilisationsEau`** : l'ancien régime
 *    d'affichage, où une clé absente valait « présent » — les sections que
 *    l'auditeur voyait la veille ne doivent pas disparaître ;
 *  - `Qte.Localisations`, la table annexe du temps des sections en JSON brut ;
 *  - **ni `Pieces`, ni clé `Piece`** : tout ce qui a été ajouté depuis doit se
 *    taire plutôt que de s'afficher à vide.
 */
const AUDIT_ANCIEN = (() => {
  const audit = {
    Adresse: '<p>3 place du <b>Marché</b></p>',
    Auditeur: 'Jean Dupont',
    EquipementsPresents: { piscines: false },
    Plans: [{ id: 'plan-ancien', name: 'RDC' }],
    Qte: {
      // Deux éléments, et **aucun `Id`** : c'est ce qui rend l'écran concluant.
      // Le tableau suit l'identité (`track item.Id`) ; deux identités
      // manquantes sont deux clés identiques, et Angular refuse de rendre la
      // liste. Si `ensureEntityIds` ne faisait plus son travail, la page
      // tomberait au lieu d'afficher une ligne sans numéro.
      robinets: [
        { Numero: '1', Emplacement: 'Cuisine du réfectoire' },
        { Numero: '2', Emplacement: 'Sanitaires du préau' },
      ],
      releve_compteur_general: { Emplacement: 'Regard trottoir', Type: 'Inconnu' },
      Localisations: { robinets: { planId: 'plan-ancien', x: 0.2, y: 0.4 } },
    },
  };
  return `localStorage.setItem('sobrieau', ${JSON.stringify(JSON.stringify(audit))});`;
})();

/**
 * Chaque écran, avec ce qui doit s'y trouver.
 *
 * `absent` liste ce qui ne doit **pas** s'afficher — une section masquée par
 * défaut qui réapparaîtrait est une régression aussi réelle qu'un écran vide.
 * Le repli statique de `index.html` est traité à part (`REPLI`) : s'il est
 * encore là, Angular n'a pas démarré.
 */
const ECRANS = [
  { route: '#/accueil', attendu: ['Nouvel audit', 'France 2030', 'Ponts et Chaussées', 'Tout emporter', 'Exporter tout en ZIP'], titre: 'Accueil général' },
  { route: '#/home', attendu: ['Nom du site audité', 'Effectif', "Nom et fonction de l'accompagnant", "Utilisations de l'eau", 'Voir la liste des documents collectés', 'Niveau de remplissage des fiches', 'Pièces du bâtiment', 'Travailler à deux', 'Ajouter une pièce'], absent: ['Surpresseurs'], titre: 'Accueil du projet' },
  { route: '#/documents', attendu: ['Documents collectés', 'Dossier Technique Amiante', 'priority--obligatoire'], titre: 'Documents à collecter' },
  { route: '#/glossaire', attendu: ['Glossaire', 'Eau Chaude Sanitaire', 'Plénum'], titre: 'Glossaire' },
  // Audit neuf, rien de coché : seules les sept sections permanentes
  // s'affichent. « Points d'eau intérieurs » n'a donc rien à montrer — sa
  // présence signalerait qu'un audit neuf retombe dans l'ancien régime où tout
  // était visible (défaut corrigé à la fusion avec origin/main).
  {
    route: '#/qte',
    attendu: ['Arrivée d’eau', 'Date de construction du bâtiment', 'Structure et opportunités', 'Toitures', 'Liste des documents collectés', 'Avancer pièce par pièce'],
    absent: ['Points d’eau intérieurs', 'Surpresseurs', 'Zone piscine'],
    titre: 'Tableau de bord',
  },
  { route: '#/qte/robinets', attendu: ['Robinets', 'Nombre total de robinets'], titre: 'Liste des robinets' },
  // Entrée par pièce. Un audit neuf n'en a aucune : c'est l'invitation à en
  // définir qui doit s'afficher, et non un écran vide.
  { route: '#/pieces', attendu: ['Avancer pièce par pièce', 'Ajouter une pièce', 'Aucune pièce définie'], titre: 'Pièces' },
  { route: '#/qte/piscines', attendu: ['Pédiluve', 'Nettoyage des plages', 'Piscines'], titre: 'Piscines et zone commune' },
  // Le compteur général est répétable depuis 2026-09 : sa route mène à une liste.
  { route: '#/qte/compteur-general', attendu: ['Compteurs généraux', 'Ajouter — Compteur général'], titre: 'Liste compteurs généraux' },

  // ── Écrans qui n'existent que sur un audit rempli ────────────────────────
  {
    route: '#/pieces',
    graine: AUDIT_AMORCE,
    attendu: ['Sanitaires du test', 'Points d', 'Niveau, plan'],
    absent: ['Aucune pièce définie'],
    titre: 'Pièces (audit rempli)',
  },
  {
    // La page d'une pièce : le tableau des points d'eau qu'elle contient, celui
    // des listes par type. Inatteignable sans pièce — donc jamais vue par les
    // écrans ci-dessus.
    route: '#/pieces/piece-smoke',
    graine: AUDIT_AMORCE,
    attendu: ['Sanitaires du test', 'Robinets', 'Près de la porte', 'Ajouter un point d'],
    absent: ['Aucun point d'],
    titre: 'Page d’une pièce',
  },
  {
    // La liste par type gagne une colonne « Pièce » dès qu'un audit en définit :
    // c'est le seul endroit où les deux entrées se recoupent.
    route: '#/qte/robinets',
    graine: AUDIT_AMORCE,
    attendu: ['Pièce', 'Sanitaires du test', 'Près de la porte'],
    titre: 'Robinets, colonne pièce',
  },

  // ── Un audit de l'ancien format doit rester lisible ──────────────────────
  {
    route: '#/accueil',
    graine: AUDIT_ANCIEN,
    // La reprise de la clé mono-audit a eu lieu : l'audit figure dans la liste.
    attendu: ['Marché', 'Nouvel audit'],
    absent: ['Aucun audit enregistré'],
    titre: 'Accueil, audit ancien',
  },
  {
    route: '#/qte',
    graine: AUDIT_ANCIEN,
    // Ancien régime : une section non déclarée absente reste affichée, **même
    // vide**. Les faire basculer sur la règle du classeur V3 ferait
    // disparaître, d'une mise à jour à l'autre, des sections que l'auditeur
    // voyait la veille.
    //
    // Les deux sections attendues ici sont vides dans cet audit : c'est ce qui
    // les rend concluantes. « Robinets » ne prouverait rien — elle contient un
    // élément, et une section non vide reste affichée sous les deux régimes.
    // Le même écran sur un audit neuf les attend justement **absentes**.
    attendu: ['Douches et baignoires', 'Appareils de lavage', 'Avancer pièce par pièce'],
    absent: ['Piscines'],
    titre: 'Tableau de bord ancien',
  },
  {
    route: '#/qte/robinets',
    graine: AUDIT_ANCIEN,
    // Les deux éléments s'affichent, donc `ensureEntityIds` leur a donné une
    // identité. Et rien de ce qui touche aux pièces ne s'affiche : l'audit
    // n'en a pas, la colonne « Pièce » ne doit donc pas apparaître.
    attendu: ['Cuisine du réfectoire', 'Sanitaires du préau'],
    absent: ['Pièce'],
    titre: 'Robinets, audit ancien',
  },
  {
    route: '#/qte/compteur-general',
    graine: AUDIT_ANCIEN,
    // La fiche unique d'avant 2026-09 est devenue le premier élément de la
    // liste. Sans la conversion, la page afficherait un tableau vide — et la
    // saisie serait inatteignable sans que rien le signale.
    attendu: ['Regard trottoir'],
    absent: ['Aucun élément'],
    titre: 'Compteur ancien → liste',
  },
  {
    route: '#/pieces',
    graine: AUDIT_ANCIEN,
    // Aucune pièce, et c'est normal : l'invitation à en définir, pas un écran vide.
    attendu: ['Aucune pièce définie', 'Ajouter une pièce'],
    titre: 'Pièces, audit ancien',
  },
  {
    // Les reprises que l'écran ne montre pas : identités attribuées aux
    // éléments, ancienne clé mono-audit rangée en sauvegarde, registre créé.
    // Toutes trois sont silencieuses — et toutes trois rendent un audit ancien
    // inutilisable si elles cessent d'avoir lieu.
    route: '#/qte/robinets',
    graine: AUDIT_ANCIEN,
    releve: `
      const index = JSON.parse(localStorage.getItem('sobrieau.index') || '[]');
      const id = index[0] && index[0].Id;
      const audit = JSON.parse(localStorage.getItem('sobrieau.audit.' + id) || '{}');
      const robinets = ((audit.Qte || {}).robinets) || [];
      const ids = robinets.map(function (r) { return r.Id || 'SANS-ID'; });
      return [
        'audits=' + index.length,
        'robinets=' + robinets.length,
        'identites-distinctes=' + new Set(ids).size,
        'sans-identite=' + ids.filter(function (x) { return x === 'SANS-ID'; }).length,
        'compteur-en-liste=' + Array.isArray((audit.Qte || {}).releve_compteur_general),
        'sauvegarde-ancienne-cle=' + (localStorage.getItem('sobrieau.legacy-backup') ? 'oui' : 'non'),
        'ancienne-cle=' + (localStorage.getItem('sobrieau') ? 'encore-la' : 'rangee'),
        'adresse=' + JSON.stringify(audit.Adresse || ''),
      ].join(' ');`,
    attendu: [
      'audits=1',
      'robinets=2',
      'identites-distinctes=2',
      'sans-identite=0',
      'compteur-en-liste=true',
      'sauvegarde-ancienne-cle=oui',
      'ancienne-cle=rangee',
    ],
    absent: ['ERREUR'],
    titre: 'Reprises enregistrées',
  },
];

const REPLI = 'Le navigateur a refusé';

let ko = 0;
console.log(`\nÉPREUVE DE FUMÉE — ${path.basename(CIBLE)} en file://\n`);

for (const e of ECRANS) {
  const dom = charger(e.route, e.graine, e.releve);
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
