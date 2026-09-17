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
 * **Il lit le classeur avec `lib/classeur.js`, exactement comme le
 * générateur.** C'est essentiel : tant qu'il portait sa propre copie des
 * règles, il signalait comme oubliés des champs que le générateur retenait, et
 * prenait les 374 cellules de priorité de la V3 pour autant d'étiquettes
 * perdues — 81 % de bruit, qui poussait les vrais signalements hors du
 * rapport.
 *
 *   node tools/check-coverage.js            tous les onglets
 *   node tools/check-coverage.js Robinets   un seul
 */
const fs = require('fs');
const path = require('path');

const wb = require('./.cache/workbook.json');
const {
  colName,
  normCell,
  isTechnical,
  requirementOf,
  ENTITIES,
  lireFiche,
  strip,
} = require('./lib/classeur');

const SCHEMA = path.join(__dirname, '..', 'src', 'app', 'models', 'audit-schema.ts');

const norm = (s) =>
  String(s == null ? '' : s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Colonnes de liste déclarées mais introuvables parmi les champs.
 *
 * `listColumns` est écrit à la main dans `lib/classeur.js`, alors que les clés
 * de champ sont dérivées des libellés du classeur : une reformulation en amont
 * suffit à rendre une colonne orpheline. Le tableau se contente alors de ne
 * pas l'afficher — sans erreur, sans trou visible. C'est arrivé dès cette
 * régénération, sur les espaces extérieurs.
 */
function colonnesOrphelines() {
  const src = fs.readFileSync(SCHEMA, 'utf8');
  const out = [];
  for (const bloc of src.split(/\n  \{\n/).slice(1)) {
    const cle = (bloc.match(/key: "([^"]+)"/) || [])[1];
    const brut = (bloc.match(/listColumns: (\[[^\]]*\])/) || [null, '[]'])[1];
    const champs = new Set([...bloc.matchAll(/\{ key: "([^"]+)"/g)].map((m) => m[1]));
    for (const c of JSON.parse(brut)) {
      if (!champs.has(c)) out.push(`${cle} → « ${c} »`);
    }
  }
  return out;
}

/** Libellés retenus par le schéma, par clé d'entité. */
function libellesDuSchema() {
  const src = fs.readFileSync(SCHEMA, 'utf8');
  const parEntite = {};
  const blocs = src.split(/\n  \{\n/).slice(1);

  for (const bloc of blocs) {
    const cle = (bloc.match(/key:\s*"([^"]+)"/) || [])[1];
    if (!cle) continue;
    parEntite[cle] = [...bloc.matchAll(/label:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) =>
      m[1].replace(/\\"/g, '"')
    );
  }
  return parEntite;
}

/** Notes qui décrivent une règle d'interface, non un champ : ni oubli, ni à transcrire. */
const NOTE_COMPORTEMENT =
  /retour à la page|bouton home|enregistrement des données|ajout d.un|ajout d.une|suppression de la page|incrémenter à chaque|données reprises|message avertissement|si on clique|prise de photo|afficher|si oui|si non|ouvrir le plan|code batiment/i;

const schema = libellesDuSchema();
const filtre = process.argv[2];

let totalNotes = 0;
let totalEtiquettes = 0;
let totalPrio = 0;

console.log('\nCONTROLE DE COUVERTURE — classeur vs schéma\n');

const orphelines = colonnesOrphelines();
if (orphelines.length) {
  console.log('▶ COLONNES DE LISTE INTROUVABLES — le tableau les omettra en silence :');
  orphelines.forEach((o) => console.log('    · ' + o));
  console.log();
}

for (const ent of ENTITIES) {
  if (filtre && ent.sheet !== filtre) continue;

  const sheet = wb.sheets.find((x) => x.name === ent.sheet);
  if (!sheet) {
    if (ent.horsClasseur) {
      // Repli connu : champs figés depuis la dernière version qui décrivait
      // l'entité (`CHAMPS_FIGES`). Le signaler comme un manque ferait croire
      // à un oubli à chaque exécution.
      console.log(`▶ ${ent.sheet}  →  ${ent.key}   hors classeur, champs figés conservés   [repli connu]\n`);
    } else {
      console.log(`▶ ${ent.sheet}\n    ONGLET ABSENT du classeur — le schéma le déclare pourtant.\n`);
    }
    continue;
  }

  const { champs, sections, candidats, priorites } = lireFiche(wb, sheet);
  const retenus = new Set((schema[ent.key] || []).map(norm));
  const refsRetenues = new Set(champs.map((c) => c.ref));

  // ── Étiquettes vues par le lecteur mais absentes du schéma ──────────────
  //
  // Un candidat sans note ni priorité n'est pas devenu un champ : c'est le
  // seul motif de rejet possible ici, puisque le tri des cellules est commun
  // aux deux.
  //
  // La plupart de ces cellules sont des **légendes** — les tables qui
  // définissent « Bon état / Etat moyen / Mauvais état », les noms de formes
  // de gouttières, les questions que les auteurs se posent en marge. Elles se
  // reconnaissent à leur voisinage : une phrase longue sur la même ligne, ou
  // un libellé qui est lui-même une phrase. Les mélanger aux vrais oublis
  // noyait ces derniers — 169 signalements dont une poignée seulement
  // demandent une décision.
  const LONG = 55;
  const lignesLongues = new Set();
  for (const [ref, cell] of Object.entries(sheet.cells)) {
    const v = String(cell.v == null ? '' : cell.v).trim();
    if (v.length > LONG) lignesLongues.add(parseInt(ref.match(/\d+$/)[0], 10));
  }
  // Une ligne de vraies questions porte presque toujours un niveau de
  // priorité — 426 champs sur 470. Son absence, jointe à une phrase longue,
  // signe une légende ou un commentaire d'auteur.
  const lignesAvecPrio = new Set(priorites.map((p) => p.r));

  const orphelins = candidats.filter((c) => !refsRetenues.has(c.ref) && !retenus.has(norm(c.label)));
  const estLegende = (c) =>
    !lignesAvecPrio.has(c.r) && (c.label.length > LONG || lignesLongues.has(c.r));

  const etiquettesOubliees = orphelins
    .filter((c) => !estLegende(c))
    .map((c) => `${c.ref} « ${c.label} »`);
  const legendes = orphelins.filter(estLegende);

  // ── Notes décrivant un champ, sans champ correspondant ──────────────────
  const notesRattachees = new Set();
  for (const c of champs) if (c.note) notesRattachees.add(norm(c.note).slice(0, 60));

  const notesOrphelines = [];
  for (const [ref, brut] of Object.entries(sheet.notes)) {
    const n = strip(brut);
    if (!n || NOTE_COMPORTEMENT.test(n)) continue;
    if (notesRattachees.has(norm(n).slice(0, 60))) continue;
    notesOrphelines.push(`${ref} : ${n.replace(/\s+/g, ' ').slice(0, 90)}`);
  }

  // ── Priorités non rattachées ────────────────────────────────────────────
  //
  // Une priorité orpheline signale un champ que le lecteur n'a pas vu : le
  // classeur a jugé la question digne d'un niveau d'exigence, donc elle
  // existe. C'est le contrôle le plus utile de la V3.
  const prioOrphelines = priorites
    .filter((p) => !p.pris)
    .map((p) => `${colName(p.c)}${p.r} « ${p.niveau} » sans champ`);

  // ── Garde-fous ──────────────────────────────────────────────────────────
  //
  // Un champ dont le libellé est un mot technique ou un niveau de priorité
  // signifie que le tri des cellules a laissé passer un faux libellé. Attendu
  // à zéro ; s'il remonte, c'est le générateur qu'il faut corriger, pas le
  // classeur.
  const fauxChamps = champs
    .filter((c) => isTechnical(c.label) || requirementOf(c.label))
    .map((c) => `${c.ref} « ${c.label} » retenu comme champ`);

  totalEtiquettes += etiquettesOubliees.length;
  totalNotes += notesOrphelines.length;
  totalPrio += prioOrphelines.length;

  const nb = (schema[ent.key] || []).length;
  const sansPrio = champs.filter((c) => !c.requirement).length;
  const anomalies =
    etiquettesOubliees.length + notesOrphelines.length + prioOrphelines.length + fauxChamps.length;

  console.log(
    `▶ ${ent.sheet}  →  ${ent.key}   ${nb} champs, ${sections.length} sections, ` +
      `${sansPrio} sans priorité   [${anomalies === 0 ? 'complet' : 'À RELIRE'}]`
  );

  const bloc = (titre, lignes, max) => {
    if (!lignes.length) return;
    console.log(`    ${titre} (${lignes.length}) :`);
    lignes.slice(0, max).forEach((l) => console.log('      · ' + l));
    if (lignes.length > max) console.log(`      … et ${lignes.length - max} autres`);
  };

  bloc('FAUX CHAMPS — à corriger dans le générateur', fauxChamps, 10);
  bloc('Priorités sans champ', prioOrphelines, 10);
  bloc('Étiquettes sans champ', etiquettesOubliees, 8);
  bloc('Notes non rattachées', notesOrphelines, 6);
  if (legendes.length) console.log(`    (+ ${legendes.length} légende(s) et commentaire(s) du classeur, ignorés)`);
  console.log();
}

// ── Onglets du classeur qu'aucune entité ne couvre ────────────────────────
if (!filtre) {
  const couverts = new Set(ENTITIES.map((e) => e.sheet));

  /**
   * Onglets volontairement hors du schéma généré : ce sont des écrans écrits à
   * la main, pas des fiches d'équipement. Les lister comme « non couverts »
   * ferait croire à un oubli à chaque exécution.
   */
  const HORS_SCHEMA = /^\s*(accueil|généralités|tableau de bord|documents collectés)\s*$/i;

  const ignores = wb.sheets
    .filter((s) => !couverts.has(s.name))
    .filter((s) => !/^\s*liste/i.test(s.name) && !HORS_SCHEMA.test(s.name))
    .filter((s) => s.cellCount > 0);

  if (ignores.length) {
    console.log("▶ Onglets renseignés qu'aucune entité ne couvre :");
    ignores.forEach((s) => console.log(`    · ${s.name} (${s.cellCount} cellules, ${s.noteCount} notes)`));
    console.log();
  }

  console.log(
    `TOTAL : ${totalEtiquettes} étiquette(s) sans champ, ${totalNotes} note(s) non rattachée(s), ` +
      `${totalPrio} priorité(s) sans champ.\n` +
      'Toutes ne sont pas des oublis — ce relevé sert à décider quoi relire.'
  );
}
