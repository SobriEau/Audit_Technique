/**
 * Contrôle de couverture : qu'est-ce que le classeur contient, et que le schéma
 * n'a pas retenu ?
 *
 * Le générateur classe les champs par heuristiques — motifs sur les notes,
 * détection d'unités, repérage des étiquettes. Une heuristique laisse toujours
 * des choses de côté, et sans ce contrôle l'oubli est **silencieux** : c'est
 * ainsi que la fiche WC est restée à 12 champs sur 27 sans que rien ne le
 * signale.
 *
 * Ce script ne juge pas, il compare. Il n'invente rien : chaque signalement
 * porte sa cellule d'origine, vérifiable dans le classeur. Ce qu'il remonte
 * n'est pas forcément un défaut — beaucoup de notes décrivent une navigation
 * ou posent une question, pas un champ. Il sert à décider quoi relire.
 *
 *   node tools/check-coverage.js            tous les onglets
 *   node tools/check-coverage.js Robinet1   un seul
 */
const fs = require('fs');
const path = require('path');

const wb = require('./.cache/workbook.json');
const SCHEMA = path.join(__dirname, '..', 'src', 'app', 'models', 'audit-schema.ts');

const rowOf = (r) => parseInt(r.match(/\d+$/)[0], 10);
const colOf = (r) => r.match(/^[A-Z]+/)[0];
const colNum = (c) => [...c].reduce((a, ch) => a * 26 + (ch.charCodeAt(0) - 64), 0);
const strip = (n) => n.replace(/^[^:\n]{0,40}:\s*/, '').replace(/\r/g, '').trim();

const norm = (s) =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Correspondance onglet → entité. Reprise de `gen-schema.js` : les deux
 * doivent rester alignés, sinon le contrôle passe à côté d'un onglet entier.
 */
const ENTITES = {
  'Compteur général': 'releve_compteur_general',
  'Sous-compteurs1': 'sous_compteurs',
  'Réducteur de Pression1': 'reducteurs_de_pression',
  'Réseau distribution EFS': 'reseaux_efs',
  'Réseau distribution ECS': 'reseaux_eau_chaude_sanitaire',
  'Production ECS': 'production_ecs',
  'Stockage ECS': 'stockage_ecs',
  'équipements ECS (v0)': 'equipements_ecs',
  Robinet1: 'robinets',
  'Douche-baignoire1': 'douches_baignoires',
  WC1: 'wc',
  Ventilation: 'ventilation_batiment',
  Piscine: 'piscines',
  'Collecte eau de pluie': 'collecte_eau_pluie',
  'Extérieur1': 'espace_vert_exterieur',
};

/** Libellés retenus par le schéma, par clé d'entité. */
function libellesDuSchema() {
  const src = fs.readFileSync(SCHEMA, 'utf8');
  const parEntite = {};
  const blocs = src.split(/\n  \{\n/).slice(1);

  for (const bloc of blocs) {
    const cle = bloc.match(/key:\s*"([^"]+)"/)?.[1];
    if (!cle) continue;
    parEntite[cle] = [...bloc.matchAll(/label:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) =>
      m[1].replace(/\\"/g, '"')
    );
  }
  return parEntite;
}

/** Notes qui décrivent une règle, non un champ : ni oubli, ni à transcrire. */
/** Cellules qui ne sont pas des champs — même filtre que `gen-schema.js`. */
const IGNORE = /^(audit sobrieau|enregistrer|num[ée]ro$)/i;

const NOTE_COMPORTEMENT =
  /retour à la page|bouton home|enregistrement des données|ajout d.un|ajout d.une|suppression de la page|incrémenter à chaque|données reprises|message avertissement|si on clique/i;

const schema = libellesDuSchema();
const filtre = process.argv[2];
let totalNotes = 0;
let totalEtiquettes = 0;

console.log('\nCONTROLE DE COUVERTURE — classeur vs schéma\n');

for (const [onglet, cle] of Object.entries(ENTITES)) {
  if (filtre && onglet !== filtre) continue;

  const s = wb.sheets.find((x) => x.name === onglet);
  if (!s) {
    console.log(`▶ ${onglet}\n    ONGLET ABSENT du classeur — le schéma le déclare pourtant.\n`);
    continue;
  }

  const retenus = new Set((schema[cle] ?? []).map(norm));
  const lignesNotees = new Set(Object.keys(s.notes).map(rowOf));

  // ── Étiquettes présentes dans la feuille, absentes du schéma ────────────
  const etiquettesOubliees = [];
  for (const [ref, cell] of Object.entries(s.cells)) {
    const v = String(cell.v ?? '').trim();
    const r = rowOf(ref);
    if (!v || v.length > 70 || r < 6 || IGNORE.test(v)) continue;
    // Une étiquette est suivie d'une cellule de saisie, donc d'une note
    if (!lignesNotees.has(r + 1)) continue;
    if (retenus.has(norm(v))) continue;
    etiquettesOubliees.push(`${ref} « ${v.replace(/\s+/g, ' ')} »`);
  }

  // ── Notes décrivant un champ, sans champ correspondant ──────────────────
  const notesOrphelines = [];
  for (const [ref, brut] of Object.entries(s.notes)) {
    const n = strip(brut);
    if (!n || NOTE_COMPORTEMENT.test(n)) continue;
    // L'étiquette est au-dessus, à gauche
    const r = rowOf(ref) - 1;
    const c = colNum(colOf(ref));
    let etiquette = null;
    let meilleur = -1;
    for (const [cref, cell] of Object.entries(s.cells)) {
      if (rowOf(cref) !== r) continue;
      const cc = colNum(colOf(cref));
      const v = String(cell.v ?? '').trim();
      if (!v || cc > c || cc <= meilleur) continue;
      meilleur = cc;
      etiquette = v;
    }
    if (etiquette && retenus.has(norm(etiquette))) continue;
    notesOrphelines.push(`${ref} ${etiquette ? `(sous « ${etiquette}` + ' »)' : '(étiquette non trouvée)'} : ${n.replace(/\s+/g, ' ').slice(0, 90)}`);
  }

  totalEtiquettes += etiquettesOubliees.length;
  totalNotes += notesOrphelines.length;

  const nb = (schema[cle] ?? []).length;
  const etat = etiquettesOubliees.length + notesOrphelines.length === 0 ? 'complet' : 'À RELIRE';
  console.log(`▶ ${onglet}  →  ${cle}   ${nb} champs retenus   [${etat}]`);

  if (etiquettesOubliees.length) {
    console.log(`    Étiquettes sans champ (${etiquettesOubliees.length}) :`);
    etiquettesOubliees.slice(0, 8).forEach((l) => console.log('      · ' + l));
    if (etiquettesOubliees.length > 8) console.log(`      … et ${etiquettesOubliees.length - 8} autres`);
  }
  if (notesOrphelines.length) {
    console.log(`    Notes non rattachées (${notesOrphelines.length}) :`);
    notesOrphelines.slice(0, 6).forEach((l) => console.log('      · ' + l));
    if (notesOrphelines.length > 6) console.log(`      … et ${notesOrphelines.length - 6} autres`);
  }
  console.log();
}

// ── Onglets du classeur qu'aucune entité ne couvre ────────────────────────
if (!filtre) {
  const couverts = new Set(Object.keys(ENTITES));
  const ignores = wb.sheets
    .filter((s) => !couverts.has(s.name) && !/^liste|visuel|^infos/i.test(s.name))
    .filter((s) => s.cellCount > 0);

  if (ignores.length) {
    console.log('▶ Onglets renseignés qu\'aucune entité ne couvre :');
    ignores.forEach((s) => console.log(`    · ${s.name} (${s.cellCount} cellules, ${s.noteCount} notes)`));
    console.log();
  }

  console.log(
    `TOTAL : ${totalEtiquettes} étiquette(s) sans champ, ${totalNotes} note(s) non rattachée(s).\n` +
      'Toutes ne sont pas des oublis — ce relevé sert à décider quoi relire.'
  );
}
