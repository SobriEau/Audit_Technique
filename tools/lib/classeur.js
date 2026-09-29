/**
 * Lecture de la mise en page du classeur — vocabulaire commun à tout l'outillage.
 *
 * Le classeur ne déclare rien : ni ses champs, ni ses sections, ni ses niveaux
 * de priorité. Tout se lit dans la **disposition** des cellules et dans leur
 * mise en forme. Chaque script qui a redécouvert ces règles dans son coin en a
 * produit une variante légèrement différente — il en existait trois, qui se
 * contredisaient : `check-coverage.js` signalait comme oubliés des champs que
 * `gen-schema.js` retenait, et `gen-referentiel.js` inventait des divergences
 * en regroupant des listes sous le mot « Obligatoire » voisin.
 *
 * Ce module est l'unique source de ces règles. Un script qui en a besoin le
 * charge ; aucun ne les réécrit.
 */

// ── Références de cellules ─────────────────────────────────────────────────

const colOf = (r) => r.match(/^[A-Z]+/)[0];
const rowOf = (r) => parseInt(r.match(/\d+$/)[0], 10);
const colNum = (c) => [...c].reduce((a, ch) => a * 26 + (ch.charCodeAt(0) - 64), 0);

/** Numéro de colonne → lettres, pour tracer la cellule d'origine d'un champ. */
const colName = (n) => {
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = (n - r - 1) / 26;
  }
  return s;
};

const normCell = (v) =>
  String(v == null ? '' : v)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

// ── Ce qui occupe la place d'un libellé sans en être un ────────────────────

/**
 * Cellules techniques, à écarter des libellés **et** des fenêtres de
 * recherche de notes.
 *
 * Trois familles, toutes nouvelles ou renommées dans la V3 du classeur :
 *  - les **boutons** : « Valider » (32 occurrences, renommage de
 *    « Enregistrer » que la V2 connaissait) et « Ouvrir le plan » (15, inédit) ;
 *  - les **exemples de saisie** écrits dans la cellule de saisie elle-même
 *    (« AAAA », « jj/mm/aaaa ») ;
 *  - le « ou » qui sépare deux méthodes de mesure.
 *
 * Sans cette liste, le générateur produisait 406 faux champs — plus que de
 * vrais. Et ces faux libellés **referment la fenêtre de recherche de la note**
 * du champ réel qui les précède : 48 champs perdaient ainsi leur liste
 * déroulante et retombaient en texte libre, sans que rien ne le signale.
 */
const TECHNICAL_CELLS = new Set([
  'valider',
  'enregistrer',
  'ouvrir le plan',
  'ou',
  '*',
  'aaaa',
  'jj/mm/aaaa',
  'numero',
]);

const isTechnical = (value) => TECHNICAL_CELLS.has(normCell(value));

/** Titres, bandeaux et consignes que le classeur répète en tête de fiche. */
const IGNORE = /^(audit sobrieau|enregistrer|valider|num[ée]ro$)/i;

/**
 * Un vrai libellé, même verbeux avec ses exemples entre parenthèses, ne
 * dépasse pas 250 caractères dans ce classeur — mesuré, le plus long en fait
 * 219. Au-delà, c'est un bandeau, une consigne ou une légende.
 *
 * Ce plafond doit rester le même partout : un plafond plus bas ailleurs
 * masquerait au contrôle exactement les oublis que le générateur commet.
 */
const MAX_LABEL_LEN = 250;

// ── Priorité de remplissage (nouveauté V3) ─────────────────────────────────

/**
 * Les trois niveaux du classeur. Aucune variante : mesuré sur les 481 cellules
 * des 35 feuilles, ni casse, ni pluriel, ni « Obligatoire si … ».
 */
const PRIORITY_RE = /^(obligatoire|recommandee?|facultati[fv]e?)$/;

/**
 * Niveau d'exigence porté par une cellule, sans accent pour l'application, ou
 * `null`. Devient `FieldDef.requirement` dans le schéma.
 */
function requirementOf(value) {
  const n = normCell(value);
  if (!PRIORITY_RE.test(n)) return null;
  if (n.indexOf('obligatoire') === 0) return 'obligatoire';
  if (n.indexOf('recommande') === 0) return 'recommande';
  return 'facultatif';
}

// ── Sections (nouveauté V3) ────────────────────────────────────────────────

/**
 * Fonds de cellule qui signalent un intertitre de section pleine largeur.
 *
 * Le classeur ne nomme ses sections nulle part : elles ne se distinguent d'un
 * libellé que par la mise en forme. Deux dispositifs coexistent —
 *  - **titre vertical** : texte à 90° dans une cellule fusionnée sur plusieurs
 *    lignes, à gauche des libellés (9 onglets) ;
 *  - **intertitre pleine largeur** : fond distinct (11 onglets, dont cinq
 *    n'ont que celui-là).
 *
 * Les deux sont nécessaires : s'en tenir aux fusions perd « Réseaux ECS »,
 * « Production Stockage ECS », « Extérieur1 », « Toiture1 » et
 * « Opportunités1 », qui n'ont aucun titre vertical.
 */
const SECTION_FILLS = new Set([9, 10, 13]);

/**
 * Fonds qui portent un intertitre **de premier niveau**, englobant ceux qui
 * suivent : « Réducteur de pression » sur le compteur général, « Production
 * d'ECS » et « Stockage d'ECS » sur la production/stockage.
 *
 * Sans cette distinction, la fiche du compteur général affichait deux blocs
 * « Etat lors de la visite » à la suite, sans rien qui dise que le second est
 * celui du réducteur. Les titres imbriqués sont composés « englobant — titre ».
 */
const SECTION_FILLS_N1 = new Set([9, 13]);

/**
 * Coquilles du classeur dans les intitulés de section, corrigées à l'affichage.
 *
 * Le classeur reste la référence, mais un titre fautif se voit à l'écran par
 * tous les auditeurs. Les deux graphies coexistent d'un onglet à l'autre —
 * « Etat lors de la visite » sur la plupart, « Etat lors de lavisite » sur les
 * robinets — donc les laisser telles quelles produirait aussi deux sections
 * différentes pour la même chose. À signaler au Cerema pour correction amont.
 */
const SECTION_FIXES = {
  'Etat lors de lavisite': 'Etat lors de la visite',
  // Les deux blocs de l'onglet Autre portent leurs exemples dans le titre.
  // Le titre sert aussi de nom de bloc conditionnel, commandé par « Choix » :
  // les exemples passent en aide des champs ajoutés (`CHAMPS_AJOUTES`).
  "Autre information (traitement de l'eau, adoucisseurs, fuites, CTA adiabatique, …)": 'Autre information',
  "Autre utilisation de l'eau (procédés particuliers,…)": "Autre utilisation de l'eau",
  // Le même bloc s'appelle « Utilisation » sur le lave-linge et le bassin,
  // « Utilisations » sur cinq autres fiches. Ce sont des titres affichés :
  // deux graphies donnent deux blocs différents pour la même chose.
  Utilisation: 'Utilisations',
  // Section fourre-tout, écrite au singulier sur la toiture et au pluriel sur
  // la production/stockage ECS. À ne pas confondre avec « Autre information… »
  // ou « Autre utilisation de l'eau… », que cette table exacte n'atteint pas.
  Autre: 'Autres',
};

/**
 * Coquilles du classeur dans les **libellés de champs**.
 *
 * Plus lourdes que celles des titres : le libellé sert à dériver la clé de
 * stockage. « Dispoisitif relié au GTB/GTC ? » sur les sous-compteurs donnait
 * la clé `DispoisitifRelieAuGtbGtc`, quand le même champ du compteur général,
 * correctement orthographié, donnait `DispositifRelieAuGtbGtc` — deux champs
 * que plus rien ne reliait. Corrigé ici, donc avant le calcul de la clé.
 */
const LABEL_FIXES = {
  'Dispoisitif relié au GTB/GTC ?': 'Dispositif relié au GTB/GTC ?',
  // Signalé par Victor Ledoux (2026-09). La clé d'origine est figée dans
  // `KEY_OVERRIDES` (gen-schema.js) : des audits d'essai circulent.
  "Présence d'une réservie incendie ?": "Présence d'une réserve incendie ?",
  // Sans effet sur la clé, qui ignore les accents (`TypeDEmetteur`).
  "Type d'emetteur": "Type d'émetteur",
};

/**
 * Intertitres que le classeur ne pose pas, ajoutés à la main.
 *
 * Sur la fiche Sous-compteur, le titre vertical « Localisation » couvre aussi
 * le type, l'année de pose, la classe métrologique et le propriétaire : il
 * manque la rubrique « Caractéristiques » que la fiche Compteur général porte
 * (G13). Demandé par Victor Ledoux (2026-09).
 */
const SECTIONS_AJOUTEES = {
  'Sous-compteur1': [{ r: 18, ref: 'E18', titre: 'Caractéristiques', niveau: 2 }],
};

/**
 * Légendes sans astérisque de tête.
 *
 * Une légende se reconnaît d'ordinaire à sa cellule « * » ou « * Etat … »,
 * suivie de lignes « terme | définition ». Celle de l'exigence de propreté
 * (Appareils de lavage) n'a qu'un titre.
 */
const LEGENDES_AJOUTEES = {
  'Appareils de lavage': ['E166'],
};

/**
 * Champs que la lecture automatique ne peut pas voir, ajoutés à la main.
 *
 * Un champ n'est retenu que s'il porte une note ou un niveau de priorité. Deux
 * cellules du classeur n'ont ni l'un ni l'autre et sont pourtant de vraies
 * questions — arbitré avec l'auteur du projet, voir `MAJ/done/arbitrages-v3.md`.
 *
 * Chaque entrée porte sa cellule d'origine : elle reste vérifiable dans le
 * classeur, et disparaîtra d'elle-même si une version future la décrit
 * normalement (le doublon serait alors signalé par `check-coverage.js`).
 */
const CHAMPS_AJOUTES = {
  'Extérieur1': [
    {
      ref: 'F18',
      r: 18,
      c: 6,
      label: "Précision (présences de noues, fossés, regards, bassins de récupérations, etc.)",
      // Le classeur pose sa priorité au-dessus du libellé, en F17, sans que
      // rien d'autre ne s'y rattache.
      requirement: 'facultatif',
    },
  ],
  Bassin1: [
    {
      ref: 'K20',
      r: 20,
      c: 11,
      label: 'Température de consigne de l’air (°C)',
      requirement: null,
    },
  ],
  // Oublié du classeur, demandé par Victor Ledoux (2026-09) : le traçage est
  // un type de maintien en température du réseau ECS, à côté du bouclage.
  // Aucune exigence n'a été donnée : le champ n'affiche donc pas de pastille.
  'Réseaux ECS': [
    {
      ref: 'F30',
      r: 30,
      c: 6,
      label: "Présence d'un traçage",
      note: 'Liste déroulante : oui / non / ne sait pas',
      requirement: null,
    },
  ],
  // Le bloc « Autre information » n'avait aucun champ : le classeur n'y pose
  // qu'une zone de saisie fusionnée, sans libellé (note M29). Le bloc « Autre
  // utilisation » était dans le même cas (M46). Signalé par Victor Ledoux.
  Autre1: [
    {
      ref: 'F23',
      r: 23,
      c: 6,
      label: "Autre information (traitement de l'eau, adoucisseurs, fuites, CTA adiabatique, …)",
      kind: 'textarea',
      requirement: null,
    },
    {
      ref: 'F40',
      r: 40,
      c: 6,
      label: "Autre utilisation de l'eau (procédés particuliers,…)",
      kind: 'textarea',
      requirement: null,
    },
  ],
};

// ── Entités, dans l'ordre du classeur ──────────────────────────────────────
//
// Deux entités de la V2 n'ont plus d'onglet en V3 :
//
//  - **Réducteur de pression** est replié dans la fiche « Compteur général »,
//    en bloc conditionnel (`H43` « Présence d'un réducteur de pression à
//    proximité ? », note `H44` : « Si oui, afficher les champs du dessous »).
//    Six de ses dix-sept champs survivent. La fiche à part est retirée du
//    schéma plutôt que dupliquée — décision Sacha, 2026-09.
//  - **Surpresseur** n'a aucun équivalent : il n'en reste qu'une question
//    oui/non sur la fiche Incendie (`F19`). La fusion du 2026-09-16 l'avait
//    conservé, masqué par défaut ; il est **retiré** à la demande de Victor
//    Ledoux (retour de test, 2026-09) : « on l'a finalement supprimé ». Les
//    données éventuellement saisies restent dans `Qte.surpresseurs`, que plus
//    rien n'affiche.
//
// Le **compteur général** n'est plus une fiche unique : un établissement peut
// en avoir plusieurs (Victor Ledoux, 2026-09). Il passe en liste, comme les
// sous-compteurs ; `DataService` convertit l'objet des audits antérieurs en
// liste d'un élément.
//
// `blocs` déclare les rubriques qui ne concernent l'élément que sous condition
// — masquées à l'écran et dispensées de validation tant que la condition n'est
// pas remplie. `bloc` désigne un intitulé de premier niveau (`FieldDef.bloc`)
// ou une section (`FieldDef.section`) ; le champ qui commande n'y est jamais
// soumis lui-même.
//
// `cols` ne contient pas `Numero` : `entity-list` affiche déjà cette colonne
// en dur, et la déclarer ici la faisait chercher parmi les champs, en vain.
// `colLabels` remplace l'intitulé d'une colonne quand celui du champ est trop
// long pour un en-tête de tableau.
const ENTITIES = [
  {
    sheet: 'Compteur général', key: 'releve_compteur_general', route: 'compteur-general', singular: 'Compteur général', plural: 'Compteurs généraux', cols: ['Emplacement', 'Type', 'Teletransmission'],
    blocs: [{ bloc: 'Réducteur de pression', champSource: 'H43', valeurs: [true, 'Oui'], source: 'Compteur général!H44' }],
  },
  { sheet: 'Sous-compteur1', key: 'sous_compteurs', route: 'sous-compteurs', singular: 'Sous-compteur', plural: 'Sous-compteurs', cols: ['Emplacement', 'AnneeDePose', 'Teletransmission'] },
  { sheet: 'Réseaux ECS', key: 'reseaux_eau_chaude_sanitaire', route: 'reseaux-ecs', singular: 'Réseau ECS', plural: 'Réseaux ECS', cols: ['Emplacement', 'MateriauPrincipalDesCanalisations', 'Bouclage'],
    // « La sous-partie bouclage ne doit apparaître que si la case oui a été
    // cochée dans la partie bouclage. Idem pour tous les champs de la partie
    // bouclage » (Victor Ledoux, 2026-09). Aucune note du classeur ne l'écrit.
    blocs: [
      { bloc: 'Bouclage du réseau ECS', champSource: 'F51', valeurs: ['Oui'], source: 'retour de test V. Ledoux, 2026-09' },
      { bloc: 'Sous-partie bouclage : circulateurs', champSource: 'F51', valeurs: ['Oui'], source: 'retour de test V. Ledoux, 2026-09' },
    ],
  },
  { sheet: 'Production Stockage ECS', key: 'production_stockage_ecs', route: 'production-stockage-ecs', singular: 'Production / Stockage ECS', plural: 'Production / Stockage ECS', cols: ['Emplacement', 'TypeDeSystemeDeProduction'] },
  { sheet: 'Robinets', key: 'robinets', route: 'robinets', singular: 'Robinet', plural: 'Robinets', cols: ['Emplacement', 'Utilisation1', 'NombreDEquipementsIdentiques'] },
  {
    sheet: 'Douche-baignoire1', key: 'douches_baignoires', route: 'douches-baignoires', singular: 'Douche / Baignoire', plural: 'Douches et baignoires', cols: ['TypeDEquipement', 'Emplacement', 'NombreDEquipementsIdentiques'],
    // Le bloc « Robinet » n'y figure pas : « Partie affichée systématiquement,
    // indépendamment du choix de l'équipement » (note D104).
    blocs: [
      { bloc: 'Douche', champSource: 'G8', valeurs: ['Douche'], source: 'Douche-baignoire1!I9' },
      { bloc: 'Baignoire', champSource: 'G8', valeurs: ['Baignoire'], source: 'Douche-baignoire1!I9' },
    ],
  },
  { sheet: 'WC1', key: 'wc', route: 'wc', singular: 'WC', plural: 'WC', cols: ['TypeDeToiletteOuUrinoir', 'Emplacement', 'NombreDEquipementsIdentiques'] },
  {
    sheet: 'Appareils de lavage', key: 'appareils_lavage', route: 'appareils-lavage', singular: 'Appareil de lavage', plural: 'Appareils de lavage', cols: ['Emplacement', 'Type'],
    // Aucune note ne l'écrit : c'est la structure de l'onglet qui le dit. Le
    // champ « Type » (E8) propose quatre appareils, et l'onglet porte quatre
    // blocs nommés d'après eux.
    blocs: [
      { bloc: 'Lave linge', champSource: 'E8', valeurs: ['lave linge'], source: 'Appareils de lavage!E8' },
      { bloc: 'Lave vaisselle', champSource: 'E8', valeurs: ['lave vaisselle'], source: 'Appareils de lavage!E8' },
      { bloc: 'Autolaveuse', champSource: 'E8', valeurs: ['autolaveuse'], source: 'Appareils de lavage!E8' },
      { bloc: 'Lavage manuel du sol', champSource: 'E8', valeurs: ['lavage du sol manuel'], source: 'Appareils de lavage!E8' },
    ],
  },
  { sheet: 'Incendie', key: 'incendie', route: 'incendie', singular: 'Incendie', plural: 'Incendie', cols: ['Emplacement'] },
  { sheet: 'Extérieur1', key: 'espace_vert_exterieur', route: 'espaces-exterieurs', singular: 'Espace extérieur', plural: 'Espaces extérieurs', cols: ['EmplacementDeLEspaceExterieur', 'TypeDeGestionDesEaux', 'SurfaceArrosee', 'Utilisation'],
    colLabels: { EmplacementDeLEspaceExterieur: 'Emplacement', Utilisation: 'Surfaces nettoyées' },
    blocs: [
      { bloc: 'Arrosage', champSource: 'I28', valeurs: ['arrosage'], source: 'Extérieur1!I29' },
      { bloc: 'Nettoyage', champSource: 'I28', valeurs: ['nettoyage'], source: 'Extérieur1!I29' },
    ],
  },
  { sheet: 'Bassin1', key: 'piscines', route: 'piscines', singular: 'Bassin', plural: 'Piscines', cols: ['Emplacement', 'VolumeDuBassin'], preambule: 'zone_piscine' },
  /**
   * Exception : l'onglet « Liste Piscines » n'est pas qu'une page de liste.
   * Sous le tableau des bassins, il porte deux sections de saisie entières —
   * « Pédiluve » et « Nettoyage des plages », dix-sept champs avec leurs notes
   * et leurs priorités. Aucun autre onglet « Liste » n'est dans ce cas
   * (vérifié sur les quinze).
   *
   * Ces champs valent pour **toute la zone piscine**, pas pour chaque bassin :
   * un pédiluve et des plages sont partagés. D'où `embedded` — ils s'affichent
   * en tête de la page « Piscines », au-dessus du tableau, et non comme une
   * section de plus au tableau de bord.
   */
  { sheet: 'Liste Piscines', key: 'zone_piscine', route: 'piscines-zone', singular: 'Zone piscine', plural: 'Zone piscine', single: true, embedded: 'piscines', cols: [] },
  { sheet: 'Toiture1', key: 'toitures', route: 'toitures', singular: 'Toiture', plural: 'Toitures', cols: ['Emplacement', 'SurfaceDeToiture', 'ToitureAccessible'] },
  {
    sheet: 'Structure1', key: 'structure', route: 'structure', singular: 'Structure', plural: 'Structures', cols: ['Type', 'Emplacement'],
    blocs: [
      { bloc: 'Structure du bâtiment et réseaux', champSource: 'I8', valeurs: ['Structure et réseaux'], source: 'Structure1!I9' },
      { bloc: 'Espace technique aménageable', champSource: 'I8', valeurs: ['Espace technique aménageable'], source: 'Structure1!I9' },
    ],
  },
  { sheet: 'Ventilation1', key: 'ventilation_batiment', route: 'ventilation', singular: 'Ventilation', plural: 'Ventilation', cols: ['SystemeDeVentilation', 'EmplacementDuSysteme'] },
  {
    sheet: 'Opportunités1', key: 'opportunites', route: 'opportunites', singular: 'Opportunité', plural: 'Opportunités', cols: ['Emplacement', 'OpportunitesADocumenter'],
    blocs: [
      { bloc: 'Utilisation des eaux de pluie', champSource: 'I11', valeurs: ['Eau de pluie'], source: 'Opportunités1!I12' },
      { bloc: 'Recyclage des eaux ménagères et de lavage', champSource: 'I11', valeurs: ['Eaux ménagères et de lavage'], source: 'Opportunités1!I12' },
      { bloc: 'Collecte des urines', champSource: 'I11', valeurs: ['Urines'], source: 'Opportunités1!I12' },
    ],
  },
  {
    sheet: 'Autre1', key: 'autre', route: 'autre', singular: 'Autre', plural: 'Autres', cols: ['Choix', 'Nom', 'Emplacement'],
    blocs: [
      { bloc: 'Autre information', champSource: 'F8', valeurs: ['Autre information'], source: 'Autre1!F9' },
      { bloc: "Autre utilisation de l'eau", champSource: 'F8', valeurs: ["Autre utilisation de l'eau"], source: 'Autre1!F9' },
    ],
  },
];

/**
 * Champs des entités dont l'onglet a disparu du classeur sans équivalent.
 *
 * Une entité marquée `horsClasseur` dans `ENTITIES` n'est conservée que si ses
 * champs sont figés ici, par clé de stockage écrite en toutes lettres. Le seul
 * cas, le surpresseur (champs de la V2), a été retiré en 2026-09 à la demande
 * de Victor Ledoux ; le mécanisme reste pour un prochain onglet disparu.
 */
const CHAMPS_FIGES = {};

/**
 * Tableaux de mesure de débit : trois essais « temps / volume », dont le débit
 * se calcule, et une mesure directe au bol. Le classeur les dessine sous un
 * intitulé (la cellule indiquée), avec une ligne d'en-têtes puis trois lignes
 * numérotées. Le générateur n'en voyait que la première ligne, en quatre champs
 * isolés : une seule mesure possible (Victor Ledoux, 2026-09).
 *
 * L'intitulé devient un champ `mesures-debit` ; les champs lus sur la ligne
 * d'en-têtes sont écartés.
 */
const MESURES_DEBIT = {
  'Robinets!F39': 40,
  'Douche-baignoire1!E44': 45,
  'Douche-baignoire1!E83': 84,
};

/**
 * Par champ (cellule de son libellé), les images qui l'illustrent : cellule
 * d'ancrage du coin haut-gauche de l'image, et cellule de sa légende.
 */
const ILLUSTRATIONS = [
  {
    champ: 'Douche-baignoire1!E28', // Type d'émetteur — douche
    images: [
      { ancre: 'E30', legende: 'E34' },
      { ancre: 'F30', legende: 'G34' },
      { ancre: 'G35', legende: 'H39' },
      { ancre: 'E36', legende: 'E40' },
    ],
  },
  { champ: 'Douche-baignoire1!I28', images: [{ ancre: 'I31', legende: 'I30' }] }, // Jets — douche
  { champ: 'Douche-baignoire1!I72', images: [{ ancre: 'H75', legende: 'I74' }] }, // Jets — baignoire
  {
    champ: 'WC1!F18', // Type de toilette ou urinoir
    images: [
      { ancre: 'F20', legende: 'F25' },
      { ancre: 'G20', legende: 'H25' },
      { ancre: 'I20', legende: 'J25' },
      { ancre: 'K20', legende: 'L25' },
      { ancre: 'F26', legende: 'F31' },
      { ancre: 'G26', legende: 'H31' },
      { ancre: 'I26', legende: 'J31' },
    ],
  },
  {
    champ: 'Toiture1!F35', // Type de gouttières
    images: [
      { ancre: 'F39', legende: 'F43' },
      { ancre: 'G39', legende: 'H43' },
      { ancre: 'I38', legende: 'I43' },
      { ancre: 'J38', legende: 'K43' },
    ],
  },
  {
    champ: 'Toiture1!F45', // Type de chéneaux
    images: [
      { ancre: 'F49', legende: 'F54' },
      { ancre: 'G50', legende: 'H54' },
      { ancre: 'I48', legende: 'J54' },
      { ancre: 'K50', legende: 'L54' },
    ],
  },
];

/**
 * Certaines notes ne portent pas de signature d'auteur et commencent
 * directement par le marqueur de type (« Liste déroulante : », « O/N »). Sans
 * garde, la regexp qui retire la signature avale ce marqueur, et le champ
 * retombe en texte libre sans ses options — bug constaté sur 11 notes de
 * « Réseaux ECS » et « Production Stockage ECS ».
 */
const NOTE_MARKER_RE = /^(liste\s*d[ée]roulante|menu\s*d[ée]roulant|(?:cases?\s*)?[aà]\s*cocher|champ[s]?\s*libre|oui\s*\/\s*non|o\s*\/\s*n\b)/i;

/** Retire la signature d'auteur d'une note, sans avaler son marqueur de type. */
function strip(n) {
  const t = String(n == null ? '' : n).replace(/\r/g, '').trim();
  if (NOTE_MARKER_RE.test(t)) return t;
  return t.replace(/^[^:\n]{0,40}:\s*/, '').trim();
}

// ── Lecture d'une feuille-fiche ────────────────────────────────────────────

/**
 * Dépouille une feuille-fiche : sépare les libellés de champs des marqueurs de
 * priorité, des intitulés de section et des cellules techniques, puis rattache
 * à chaque libellé sa note et son niveau de priorité.
 *
 * Renvoie `{ enTete, sections, champs }`, où chaque champ porte
 * `{ r, c, label, note, priority, section, ref }`.
 */
function lireFiche(wb, sheet) {
  const fmtOf = (cell) => (wb.cellFormats && wb.cellFormats[cell.s || 0]) || {};

  const texte = new Map();
  const cellules = [];
  for (const [ref, cell] of Object.entries(sheet.cells)) {
    const v = String(cell.v == null ? '' : cell.v).trim();
    const r = rowOf(ref);
    const c = colNum(colOf(ref));
    texte.set(r + ':' + c, v);
    if (v) cellules.push({ ref, r, c, v: v.replace(/\s+/g, ' '), cell });
  }
  const notes = Object.entries(sheet.notes).map(([ref, raw]) => ({
    ref,
    r: rowOf(ref),
    c: colNum(colOf(ref)),
    raw,
  }));

  /**
   * Ancres de fusion **mono-colonne** sur plusieurs lignes : c'est la forme
   * qu'ont les titres de section écrits à la verticale, à gauche des champs.
   */
  const titreVertical = new Set();
  for (const m of sheet.merges || []) {
    const [a, b] = m.split(':');
    if (!b) continue;
    if (colNum(colOf(a)) === colNum(colOf(b)) && rowOf(b) - rowOf(a) >= 1 && rowOf(a) >= 6) {
      titreVertical.add(a);
    }
  }

  /**
   * Tout ce qui précède la cellule « Numéro » est de l'en-tête : fil d'Ariane,
   * titre de la fiche, numérotation. Le titre a glissé de la ligne 5 à la
   * ligne 6 sur trois onglets de la V3 — une borne fixe le laissait passer
   * pour un champ (« Réseau de distribution d'Eau Chaude Sanitaire »). Le
   * compteur général n'a pas de « Numéro », étant une fiche unique : la borne
   * retombe alors sur la ligne 5, où son titre se trouve encore.
   */
  let enTete = 5;
  for (const x of cellules) {
    if (normCell(x.v) === 'numero' && x.r > enTete && x.r < 10) enTete = x.r;
  }

  // ── Tri des cellules ────────────────────────────────────────────────────
  //
  // L'ordre compte. Une cellule de priorité écartée trop tard deviendrait un
  // champ ; un titre de section pris pour un libellé décalerait toute la
  // chaîne des suffixes `Bis` et changerait le sens de clés existantes.
  const sections = [];
  const priorites = [];
  const candidats = [];

  for (const x of cellules) {
    if (x.r <= enTete) continue;

    const niveau = requirementOf(x.v);
    if (niveau) {
      priorites.push({ r: x.r, c: x.c, niveau, pris: false });
      continue;
    }

    if (isTechnical(x.v) || IGNORE.test(x.v)) continue;

    const fmt = fmtOf(x.cell);
    const intertitre = x.r >= 8 && SECTION_FILLS.has(fmt.fillId);
    if (titreVertical.has(x.ref) || intertitre) {
      sections.push({
        r: x.r,
        ref: x.ref,
        titre: SECTION_FIXES[x.v] || x.v,
        // Un titre écrit à la verticale, à gauche des champs, est toujours de
        // second niveau : c'est la colonne qui découpe la fiche en rubriques.
        niveau: intertitre && SECTION_FILLS_N1.has(fmt.fillId) && !titreVertical.has(x.ref) ? 1 : 2,
      });
      continue;
    }

    if (x.v.length > MAX_LABEL_LEN) continue;
    // Un nombre seul n'est pas un libellé : ce sont les lignes numérotées des
    // tableaux de mesures (« 1 », « 2 », « 3 » sous « Temps / Volume / Débit »).
    if (/^\d+$/.test(x.v)) continue;
    candidats.push({ ref: x.ref, r: x.r, c: x.c, label: x.v });
  }

  for (const s of SECTIONS_AJOUTEES[sheet.name] || []) {
    if (!sections.some((x) => x.r === s.r)) sections.push({ ...s });
  }
  sections.sort((a, b) => a.r - b.r);

  // ── Légendes ────────────────────────────────────────────────────────────
  //
  // « Bon état / Etat moyen / Mauvais état », « fort / moyen / faible » : le
  // classeur les définit dans un petit tableau placé sous les champs, annoncé
  // par une cellule « * » (ou « * Etat compteur ») et renvoyé par l'astérisque
  // du libellé. Chaque ligne porte un terme et, à sa droite, sa définition.
  // Leur rattachement aux champs se fait dans `gen-schema.js`, qui connaît les
  // options de chaque champ.
  const cellule = new Map(cellules.map((x) => [x.r + ':' + x.c, x]));
  const departsLegende = cellules.filter(
    (x) =>
      x.r > enTete &&
      (/^\*/.test(x.v) || (LEGENDES_AJOUTEES[sheet.name] || []).includes(x.ref))
  );
  const legendes = [];
  for (const d of departsLegende) {
    const entrees = [];
    for (let r = d.r + 1; ; r++) {
      const terme = cellule.get(r + ':' + d.c);
      const definition = cellules.find((x) => x.r === r && x.c > d.c);
      if (!terme || !definition) break;
      entrees.push({ terme: terme.v, definition: definition.v });
    }
    // « * Le cas échéant, précisez le débit… » (WC) : une consigne, pas une
    // légende — aucune ligne « terme | définition » ne la suit.
    if (entrees.length < 2) continue;
    legendes.push({ r: d.r, c: d.c, ref: d.ref, titre: d.v.replace(/^\*\s*/, ''), entrees });
  }

  // Fenêtre horizontale d'un candidat : de sa colonne à celle du candidat
  // suivant sur la même ligne. C'est dans cette fenêtre que se trouvent sa
  // note, sa priorité et sa cellule de saisie.
  const parLigne = new Map();
  for (const c of candidats) {
    if (!parLigne.has(c.r)) parLigne.set(c.r, []);
    parLigne.get(c.r).push(c);
  }
  for (const list of parLigne.values()) list.sort((a, b) => a.c - b.c);
  const borneDroite = (c) => {
    const suivant = parLigne.get(c.r).find((x) => x.c > c.c);
    return suivant ? suivant.c : Infinity;
  };

  /**
   * Note du champ. Le classeur la pose d'ordinaire sur la cellule de saisie,
   * sous le libellé ; la V3 en place aussi sur la ligne du libellé lui-même,
   * la saisie étant alors à sa droite. Chercher les deux, la ligne du dessous
   * d'abord, qui reste le cas nominal.
   */
  function noteDe(c) {
    const hi = borneDroite(c);
    for (const n of notes) {
      if (n.r === c.r + 1 && n.c >= c.c && n.c < hi) return strip(n.raw);
    }
    for (const n of notes) {
      if (n.r === c.r && n.c > c.c && n.c < hi) return strip(n.raw);
    }
    return '';
  }

  // ── Rattachement des priorités, en deux passes ──────────────────────────
  //
  // Passe 1, le cas nominal : le marqueur est à droite du libellé, sur sa
  // ligne. Passe 2 : trois onglets alignent leurs marqueurs sur une **ligne
  // dédiée**, au-dessus ou au-dessous. Faire la passe 1 partout d'abord évite
  // qu'un champ vole le marqueur du champ voisin d'une autre ligne.
  const avecNote = candidats.filter((c) => noteDe(c));
  const lignesRetenues = new Set(avecNote.map((c) => c.r));
  const prioDe = new Map();

  // La passe 1 s'applique à **tous** les candidats, pas aux seuls porteurs de
  // note : un libellé sans note mais flanqué d'un niveau de priorité est un
  // champ que le classeur a jugé digne d'une exigence — c'est ainsi que
  // « Marque et modèle du système » (Ventilation1 B15) se récupère.
  for (const c of candidats) {
    const hi = borneDroite(c);
    const m = priorites.find((p) => !p.pris && p.r === c.r && p.c > c.c && p.c < hi);
    if (m) {
      m.pris = true;
      prioDe.set(c, m.niveau);
    }
  }

  const retenus = candidats.filter((c) => noteDe(c) || prioDe.has(c));

  for (const c of retenus) {
    if (prioDe.has(c)) continue;
    const premiere = parLigne.get(c.r)[0].c;
    for (const rr of [c.r - 1, c.r + 1]) {
      if (lignesRetenues.has(rr)) continue; // cette ligne a ses propres champs
      // Une ligne de marqueurs ne porte rien d'autre que des marqueurs.
      const parasite = cellules.some(
        (x) => x.r === rr && x.c >= premiere && !requirementOf(x.v) && !isTechnical(x.v)
      );
      if (parasite) continue;
      const hi = borneDroite(c);
      const m = priorites.find((p) => !p.pris && p.r === rr && p.c >= c.c && p.c < hi);
      if (m) {
        m.pris = true;
        prioDe.set(c, m.niveau);
        break;
      }
    }
  }

  /**
   * Section courante : le dernier intitulé situé à cette ligne ou au-dessus.
   *
   * Les deux niveaux se composent — « Réducteur de pression — Réglage ». Un
   * intitulé de premier niveau ferme celui de second niveau en cours : ce qui
   * le suit appartient au nouveau bloc, pas à l'ancienne rubrique.
   */
  function rubriqueDe(r) {
    let n1 = null;
    let n2 = null;
    for (const sec of sections) {
      if (sec.r > r) break;
      if (sec.niveau === 1) {
        n1 = sec.titre;
        n2 = null;
      } else {
        n2 = sec.titre;
      }
    }
    return {
      section: n1 && n2 ? `${n1} — ${n2}` : n2 || n1,
      // Le bloc englobant, seul : c'est lui qu'une règle d'affichage
      // conditionnel désigne (« Lave linge », « Réducteur de pression »).
      bloc: n1,
    };
  }

  const champs = retenus.map((c) => ({
    ref: c.ref,
    r: c.r,
    c: c.c,
    label: LABEL_FIXES[c.label] || c.label,
    note: noteDe(c),
    below: texte.get(c.r + 1 + ':' + c.c) || '',
    requirement: prioDe.get(c) || null,
    ...rubriqueDe(c.r),
  }));

  // Champs ajoutés à la main, insérés à leur place dans la fiche. Le marqueur
  // de priorité qu'ils consomment est marqué pris, sans quoi `check-coverage`
  // continuerait à le signaler orphelin.
  for (const a of CHAMPS_AJOUTES[sheet.name] || []) {
    if (champs.some((c) => c.ref === a.ref)) continue; // déjà vu par la lecture
    champs.push({
      ref: a.ref,
      r: a.r,
      c: a.c,
      label: a.label,
      note: a.note || '',
      below: texte.get(a.r + 1 + ':' + a.c) || '',
      requirement: a.requirement || null,
      ...rubriqueDe(a.r),
      ajoute: true,
      ...(a.kind ? { kind: a.kind } : {}),
    });
    if (a.requirement) {
      const m = priorites.find((p) => !p.pris && p.niveau === a.requirement && Math.abs(p.r - a.r) <= 1);
      if (m) m.pris = true;
    }
  }

  champs.sort((a, b) => a.r - b.r || a.c - b.c);

  return { enTete, sections, champs, priorites, candidats, legendes };
}

module.exports = {
  colOf,
  rowOf,
  colNum,
  colName,
  normCell,
  isTechnical,
  TECHNICAL_CELLS,
  requirementOf,
  SECTION_FILLS,
  SECTION_FIXES,
  LABEL_FIXES,
  SECTIONS_AJOUTEES,
  LEGENDES_AJOUTEES,
  CHAMPS_AJOUTES,
  CHAMPS_FIGES,
  MESURES_DEBIT,
  ILLUSTRATIONS,
  IGNORE,
  MAX_LABEL_LEN,
  NOTE_MARKER_RE,
  strip,
  ENTITIES,
  lireFiche,
};
