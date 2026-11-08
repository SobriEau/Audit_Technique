/**
 * Contrôle des chemins de photos et de l'ordre des sources d'affichage.
 *
 * Deux règles invisibles vivent ici, et chacune s'est déjà révélée fausse :
 *
 *  - **le nom du dossier d'un audit**, que le chemin des photos porte et que
 *    l'archive crée. S'il cessait d'être unique, les photos de deux audits
 *    homonymes se mélangeraient une fois les archives réunies — exactement ce
 *    que les sous-dossiers servent à empêcher ;
 *  - **l'ordre des sources d'affichage**. Le fichier à plat est le cas normal
 *    (le navigateur télécharge dans un dossier unique et aplatit les
 *    séparateurs) ; le sous-dossier n'est le bon chemin qu'après l'archivage.
 *    L'ordre inverse échouait à chaque affichage sur le poste de l'auditeur
 *    pour réussir sur un cas qui n'arrive qu'après.
 *
 * Rien de tout cela ne se voit à l'écran : une vignette finit par s'afficher,
 * par la source suivante, et seul le réseau ou le cache garde la trace de
 * l'essai perdu.
 *
 *   node tools/check-photos.js
 */
const { compiler } = require('./lib/compiler');

const ts = compiler(['src/app/core/utils/photo-mode.ts']);
const { propre, dossierAudit, cheminPhoto, nomSeul, nomDeFichier, sourcePhoto } =
  ts.charger('app/core/utils/photo-mode.js');
ts.nettoyer();

let echecs = 0;
let regles = 0;
const ok = (cond, message, detail) => {
  regles++;
  if (cond) return;
  echecs++;
  console.log('  ✗ ' + message + (detail === undefined ? '' : '\n      ' + String(detail).slice(0, 400)));
};
const egal = (obtenu, voulu, message) => ok(obtenu === voulu, message, `obtenu ${JSON.stringify(obtenu)}, voulu ${JSON.stringify(voulu)}`);

console.log("\nCONTRÔLE DES CHEMINS DE PHOTOS\n");

// ── Noms de fichiers ───────────────────────────────────────────────────────
egal(propre('École « Jean Moulin »'), 'ecole-jean-moulin', 'propre : accents, guillemets et espaces');
egal(propre('   '), '', 'propre : un texte sans lettre ni chiffre ne donne rien');
// « № » est un caractère unique, que la décomposition NFD ne rend pas en
// « No » : il tombe, comme tout symbole sans équivalent alphanumérique.
egal(propre('Café — № 3'), 'cafe-3', 'propre : tirets typographiques et symboles');
egal(propre('abcdefghij', 4), 'abcd', 'propre : la longueur est bornée');
// Une troncature ne doit pas laisser un tiret en fin de nom.
egal(propre('ab-cdefgh', 3), 'ab', 'propre : pas de tiret en fin de nom tronqué');

// ── Dossier d'un audit ─────────────────────────────────────────────────────
egal(dossierAudit('École de l’archive', 'arch-1'), 'ecole-de-l-archive-arch-1', "dossierAudit : nom et identité");
egal(dossierAudit('', 'abcdef123456'), 'audit-abcdef12', 'dossierAudit : un audit sans nom garde son identité');
egal(dossierAudit('   ', 'xy'), 'audit-xy', 'dossierAudit : un nom vide de sens vaut un nom absent');

// **La règle qui compte** : deux audits homonymes ne partagent pas de dossier.
// Sans elle, réunir deux archives mélangerait leurs photos.
const a = dossierAudit('École Jean Moulin', '1111aaaa-2222');
const b = dossierAudit('École Jean Moulin', '3333bbbb-4444');
ok(a !== b, 'dossierAudit : deux audits homonymes doivent avoir des dossiers distincts', `${a} / ${b}`);

egal(cheminPhoto('mon-audit-ab12cd34', 'photo.jpg'), './mon-audit-ab12cd34/photo.jpg', 'cheminPhoto');
egal(nomSeul('./mon-audit/photo.jpg'), 'photo.jpg', 'nomSeul');
egal(nomSeul('./mon-audit/photo.jpg?r=1731000000'), 'photo.jpg', 'nomSeul : le paramètre anti-cache est retiré');
egal(nomSeul('photo.jpg'), 'photo.jpg', 'nomSeul : un nom déjà seul');

const compose = nomDeFichier('Robinet 3', 'IMG_0421.JPEG', 'ab12cd34ef');
ok(/^\d{8}T\d{6}_robinet-3_ab12cd34\.jpeg$/.test(compose), 'nomDeFichier : horodatage, contexte, identité, extension', compose);

// ── Ordre des sources ──────────────────────────────────────────────────────
//
// C'est la règle corrigée : le fichier **à plat** avant le sous-dossier.

const CHEMIN = './ecole-a1b2c3d4/photo.jpg';
const tout = { base: 'blob:xyz', chemin: CHEMIN, drive: 'blob:drive' };
const choix = (etat) => sourcePhoto(etat) || { source: null, url: null };

egal(choix(tout).source, 'base', 'ordre : le binaire local passe avant tout');

const sansBase = { ...tout, echoues: { base: true } };
egal(choix(sansBase).source, 'voisin', 'ordre : le fichier À PLAT vient avant le sous-dossier');
egal(choix(sansBase).url, './photo.jpg', 'le fichier à plat est cherché à côté de la page');

const sansVoisin = { ...tout, echoues: { base: true, voisin: true } };
egal(choix(sansVoisin).source, 'archive', 'ordre : le sous-dossier est le repli, pour les archives réunies');
egal(choix(sansVoisin).url, CHEMIN, "le repli est le chemin enregistré tel quel");

const sansFichier = { ...tout, echoues: { base: true, voisin: true, archive: true } };
egal(choix(sansFichier).source, 'drive', 'ordre : le Drive est le dernier recours');

const rien = { ...tout, echoues: { base: true, voisin: true, archive: true, drive: true } };
egal(choix(rien).source, null, 'toutes les pistes épuisées : plus de source');

// Le parcours est fini : chaque échec retire exactement une source.
let etat = { base: 'blob:xyz', chemin: CHEMIN, drive: 'blob:drive', echoues: {} };
const parcours = [];
for (let i = 0; i < 10; i++) {
  const s = sourcePhoto(etat);
  if (!s) break;
  parcours.push(s.source);
  etat.echoues[s.source] = true;
}
egal(parcours.join(' → '), 'base → voisin → archive → drive', 'le parcours épuise les sources une à une, sans boucler');

// Un audit d'avant les sous-dossiers : le chemin est déjà à plat, et la source
// `archive` ne redonne pas la même URL une seconde fois.
const plat = { chemin: './photo.jpg', drive: 'blob:drive', echoues: { base: true } };
egal(choix(plat).source, 'voisin', 'chemin déjà à plat : source voisine');
egal(choix({ ...plat, echoues: { base: true, voisin: true } }).source, 'drive', "chemin déjà à plat : pas de second essai identique");

// Le paramètre anti-cache de « Réessayer » doit survivre sur les deux formes.
const buste = { chemin: CHEMIN + '?r=42', echoues: { base: true } };
egal(choix(buste).url, './photo.jpg?r=42', 'anti-cache conservé sur le fichier à plat');
egal(choix({ ...buste, echoues: { base: true, voisin: true } }).url, CHEMIN + '?r=42', 'anti-cache conservé sur le sous-dossier');

// Sans chemin enregistré (mode « dans le navigateur »), seuls la base et le Drive.
const sansChemin = { base: 'blob:xyz', drive: 'blob:drive' };
egal(choix(sansChemin).source, 'base', 'sans chemin : la base');
egal(choix({ ...sansChemin, echoues: { base: true } }).source, 'drive', 'sans chemin : puis le Drive, sans fichier voisin');

console.log(
  `  ${'règles éprouvées'.padEnd(44)} ${String(regles).padStart(5)}\n` +
    `  ${"ordre des sources d'affichage".padEnd(44)} base → voisin → archive → drive`
);
console.log(echecs ? `\n${echecs} échec(s).` : "\nLes chemins sont composés comme prévu, et les sources essayées dans l'ordre.");
process.exit(echecs ? 1 : 0);
