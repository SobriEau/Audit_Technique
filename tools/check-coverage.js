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
/**
 * Certaines notes ne portent pas de signature d'auteur et commencent
 * directement par le marqueur de type (« Liste déroulante : ») — voir la
 * même garde dans gen-schema.js.
 */
const NOTE_MARKER_RE = /^(liste\s*d[ée]roulante|champ[s]?\s*libre|oui\s*\/\s*non|o\s*\/\s*n\b)/i;
const strip = (n) => {
  const t = n.replace(/\r/g, '').trim();
  if (NOTE_MARKER_RE.test(t)) return t;
  return t.replace(/^[^:\n]{0,40}:\s*/, '').trim();
};

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
  'Sous-compteur1': 'sous_compteurs',
  Surpresseur1: 'surpresseurs',
  'Réseaux ECS': 'reseaux_eau_chaude_sanitaire',
  'Production Stockage ECS': 'production_stockage_ecs',
  Robinets: 'robinets',
  'Douche-baignoire1': 'douches_baignoires',
  WC1: 'wc',
  'Appareils de lavage': 'appareils_lavage',
  Structure1: 'structure',
  Ventilation1: 'ventilation_batiment',
  Incendie: 'incendie',
  Toiture1: 'toitures',
  Bassin1: 'piscines',
  'Extérieur1': 'espace_vert_exterieur',
  'Opportunités1': 'opportunites',
  Autre1: 'autre',
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
const IGNORE = /^(audit sobrieau|enregistrer|valider|num[ée]ro$)/i;

/**
 * Marqueur de niveau de remplissage (V3 du classeur) — même exclusion que
 * `gen-schema.js` : sans elle, chaque cellule « Obligatoire »/« Recommandé »/
 * « Facultatif » ressort ici comme une étiquette prétendument oubliée, alors
 * qu'elle est correctement traitée à part (`FieldDef.requirement`).
 */
const REQUIREMENT_WORDS = /^(obligatoire|recommand[ée]|facultatif)$/i;
const isRequirementMarker = (v) => REQUIREMENT_WORDS.test(v.trim());

/**
 * Titres de sous-section du classeur V3 — même exclusion que `gen-schema.js`
 * (voir `SECTION_HEADER_RE` là-bas pour le détail, notamment pourquoi
 * « Utilisations » n'y figure pas).
 */
const SECTION_HEADER_RE =
  /^(localisation|ouvrir le plan|caract[ée]ristiques|connexion|etat lors de la visite|mesures?|ou|materiel|structure|reseaux|reserve|tests|purges|organes de reseau|opportunites|\d+)$/i;
const isSectionHeader = (v) => SECTION_HEADER_RE.test(norm(v));

/**
 * Entités dont l'onglet a disparu du classeur mais que `gen-schema.js`
 * conserve volontairement (`LEGACY_FIELD_LINES`, V3 : Surpresseur1 — voir
 * `ENTITES` ci-dessus, Réducteur de pression1 a été retiré du schéma au
 * profit du bloc intégré à Compteur général) — à ne pas signaler comme un
 * oubli.
 */
const ENTITES_REPLI = new Set(['surpresseurs']);

const NOTE_COMPORTEMENT =
  /retour à la page|bouton home|enregistrement des données|ajout d.un|ajout d.une|suppression de la page|incrémenter à chaque|données reprises|message avertissement|si on clique|prise de photo/i;

const schema = libellesDuSchema();
const filtre = process.argv[2];
let totalNotes = 0;
let totalEtiquettes = 0;

console.log('\nCONTROLE DE COUVERTURE — classeur vs schéma\n');

for (const [onglet, cle] of Object.entries(ENTITES)) {
  if (filtre && onglet !== filtre) continue;

  const s = wb.sheets.find((x) => x.name === onglet);
  if (!s) {
    if (ENTITES_REPLI.has(cle)) {
      console.log(`▶ ${onglet}\n    Onglet absent — champs conservés depuis l'ancien schéma (repli connu, voir LEGACY_FIELD_LINES).\n`);
    } else {
      console.log(`▶ ${onglet}\n    ONGLET ABSENT du classeur — le schéma le déclare pourtant.\n`);
    }
    continue;
  }

  const retenus = new Set((schema[cle] ?? []).map(norm));
  const lignesNotees = new Set(Object.keys(s.notes).map(rowOf));

  // ── Étiquettes présentes dans la feuille, absentes du schéma ────────────
  // Plafond aligné sur gen-schema.js (MAX_LABEL_LEN) : un plafond différent
  // ici masquerait à ce contrôle exactement les oublis que le générateur
  // fait pour la même raison — les deux doivent voir la même chose.
  const etiquettesOubliees = [];
  for (const [ref, cell] of Object.entries(s.cells)) {
    const v = String(cell.v ?? '').trim();
    const r = rowOf(ref);
    if (!v || v.length > 250 || r < 6 || IGNORE.test(v) || isRequirementMarker(v) || isSectionHeader(v)) continue;
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
      if (!v || cc > c || cc <= meilleur || isRequirementMarker(v) || isSectionHeader(v)) continue;
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
    .filter((s) => !couverts.has(s.name) && !/^\s*liste|visuel|^\s*infos|^\s*partie technique\s*$/i.test(s.name))
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
