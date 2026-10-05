/**
 * Génère `audit-schema.ts` depuis le classeur.
 *
 * Quatre informations sont reprises telles quelles :
 *  - les champs et leur type, décrits dans les notes de cellules ;
 *  - **la disposition** : les étiquettes situées sur une même ligne du tableau
 *    Excel restent sur une même ligne du formulaire ;
 *  - **les sections** qui découpent la fiche en blocs ;
 *  - **l'exigence** de chaque question (obligatoire, recommandé, facultatif),
 *    qui pilote la pastille, le niveau de remplissage et la validation.
 *
 * La lecture de la mise en page — ce qui est un libellé, une section, une
 * priorité ou une cellule technique — vit dans `lib/classeur.js`, partagée
 * avec les contrôles. Ce script n'en garde que ce qui lui est propre : les
 * types de champ, les listes de valeurs et les clés de stockage.
 *
 * Régénérer avec `node tools/gen-schema.js` après modification du classeur.
 */
const fs = require('fs');
const path = require('path');
const wb = require('./.cache/workbook.json');
const {
  colName,
  normCell,
  strip,
  ENTITIES,
  CHAMPS_FIGES,
  MESURES_DEBIT,
  lireFiche,
} = require('./lib/classeur');

const normLabel = (s) => normCell(s);

/**
 * Coquilles du classeur dans les **valeurs**, corrigées à la génération.
 *
 * Même raison que pour les titres de section : une faute dans une option se
 * lit à l'écran par tous les auditeurs. Le moment de le faire est celui-ci —
 * une valeur d'énumération est une donnée stockée, la corriger plus tard,
 * quand des audits circuleront, rendrait illisibles les saisies faites sous
 * l'ancienne graphie. À signaler au Cerema pour correction amont.
 */
const VALUE_FIXES = {
  'à aproffondir': 'à approfondir',
  'à approffondir': 'à approfondir',
  'Entérée': 'Enterrée',
  "Extérieure avec possibilté d'être couverte": "Extérieure avec possibilité d'être couverte",
};

// ── Correspondance option-set → constante du référentiel ───────────────────
//
// Une liste ne mérite une constante que si elle se répète, ou si elle est
// assez centrale pour qu'on veuille la relire d'un seul endroit. Les autres
// restent inlinées dans le schéma : les mettre en commun de force fusionnerait
// des notions distinctes qui partagent un libellé (« Type » désigne un
// compteur ici, un bassin là).
const L = {
  TYPE_COMPTEUR: ['Compteur à jet unique','Compteur à jet multiple','Compteur à palettes','Compteur volumétrique','Compteur électromagnétique','Compteur ultrasonique','Compteur à pression différentielle','Compteur à insertion','Inconnu'],
  CLASSE_METROLOGIQUE: ['Classe A','Classe B','Classe C','Classe D','R40','R50','R63','R80','R100','R125','R160','R200','R250','R315','R400','R500','R630','R800','Inconnue'],
  TYPE_ROBINET: ['Simple EF','Simple ECS','Mélangeur','Mitigeur classique','Mitigeur thermostatique'],
  COMMANDE_ROBINET: ['manuelle','fémorale','à pédale','à détection'],
  TEMPORISATION: ['Aucune','Mécanique','Electronique'],
  MATERIAU_TUYAU: ['Cuivre','Multicouche','PER','PEHD','PE','PVC pression','inconnu'],
  TYPE_EQUIPEMENT_DOUCHE: ['Douche','Baignoire'],
  JETS_EMETTEUR: ['aucune','pluie laminaire','aéré','brumisé','pulsé/massage','concentré/puissant','multi-jets'],
  TYPE_WC: ['Urinoir masculin à eau','Urinoir masculin sans eau','Urinoir féminin sans eau','Urinoir féminin à eau',"Stalle d'urinoir",'Toilette à eau standard','Toilette avec broyeur','Toilette avec rince main intégré','Toilette japonaise','Toilette à la turque','Toilette à produit chimique','Toilette sans eau unitaire','Toilette sans eau à séparation','Toilette à eau à séparation','Latrine'],
  COMMANDE_CHASSE: ['manuelle double chasse','manuelle simple chasse','manuelle poussoir temporisé','à pédale','à détection','à pas de temps','écoulement en continu','non concerné'],
  EMPLACEMENT_BASSIN: ['Intérieure','Extérieure',"Extérieure avec possibilité d'être couverte"],
  MODE_NETTOYAGE: ['auto laveuse','nettoyeur haute pression','tuyaux simple','autre'],
  MODE_ARROSAGE: ['Tuyau manuel','Arrosoir','Oyas','Micro asperseur','Arrosage goutte à goutte','Arrosage tuyaux poreux','Tuyères','Arrosage non sélectif','Autre'],
  EXIGENCE_PROPRETE: ['faible','modéré','forte','réglementaire'],
  MATERIAU_GOUTTIERE: ['PVC','Zinc','aluminium','béton','acier galvanisé','plomb','pierre','terre cuite','fonte','cuivre'],
  CHEMINEMENT_RESEAU: ['des faux-plafonds','des gaines techniques','des vides sanitaires','des trémies','en apparent','la dalle','autre'],
  POTENTIEL_TECHNIQUE: ['fort','moyen','faible','à approfondir'],
  UTILISATION_ROBINET: ['Evier','Evier cuisine','Lave-main','Fontaine','Lavabo','Ménage/lavage du sol','Lavage poubelle','Lavage matériel (pinceau, ...)','Table à langer','Poste de plonge','Poste de rinçage','Robinet extérieur','Arrosage','Lavage de véhicule','Chaufferie/technique','Autre'],
  USAGE_APPAREIL_LAVAGE: ['domestique','collectif','professionnel'],
  ETAT_GENERAL: ['Bon','Moyen','Mauvais'],
  OUI_NON_NSP: ['Oui','Non','Ne sait pas'],
};

/**
 * Listes imposées à un champ, par cellule d'origine.
 *
 * Le classeur laisse cohabiter plusieurs versions d'une même liste, et l'écart
 * est un défaut, non une intention. Corriger le classeur serait plus juste ;
 * en attendant, la correction vit ici — sourcée, et limitée aux cas arbitrés
 * (voir `MAJ/done/arbitrages-v3.md`).
 *
 * **Ne rien ajouter ici sans arbitrage** : deux listes différentes décrivent le
 * plus souvent deux notions différentes, et les fusionner effacerait une
 * distinction voulue.
 */
const OPTION_OVERRIDES = {
  // Les trois utilisations d'un même robinet n'offraient pas les mêmes choix :
  // « Lavage matériel » manquait à la deuxième, et la troisième disait « Evier
  // cuisine » là où les autres disaient « Evier ». Un auditeur ne pouvait donc
  // pas saisir en usage secondaire ce qu'il venait de saisir en principal.
  'Robinets!F15': 'UTILISATION_ROBINET',
  'Robinets!I15': 'UTILISATION_ROBINET',
  'Robinets!L15': 'UTILISATION_ROBINET',
  // Lave-linge au féminin, lave-vaisselle au masculin, pour la même question.
  'Appareils de lavage!E19': 'USAGE_APPAREIL_LAVAGE',
  'Appareils de lavage!E50': 'USAGE_APPAREIL_LAVAGE',
  // La note énumère sans marqueur, et une ligne dépasse la longueur qu'une
  // énumération implicite tolère : le champ retombait en texte libre (« pas de
  // liste déroulante », Victor Ledoux, 2026-09). Deux matériaux partagent une
  // ligne, séparés par une virgule. « autre » ajouté au second retour de test
  // (2026-10), comme sur les matériaux de revêtement voisins.
  'Bassin1!K14': [
    'maçonné en béton armé',
    'maçonné en béton projeté',
    'blocs à bancher ou parpaings',
    'coque polyester',
    'panneaux modulaires (acier, polymère, aluminium)',
    'bois',
    'inox',
    'composite',
    'PVC',
    'autre',
  ],
  // « Autre » ajouté au second retour de test (2026-10) ; les sept premiers
  // sont ceux de la note du classeur.
  'WC1!F15': ['Public extérieur', 'Personnel', 'Autres adultes', 'Enfants', 'Adolescents', 'Personnes âgées', 'PMR', 'Autre'],
  // « Nuit » et « Variable » ajoutés à la demande de Victor Ledoux (2026-09).
  'Extérieur1!L41': ['Matin', 'Soir', 'En pleine journée', 'Nuit', 'Variable'],
  // « oui à côté, derrière un des murs » est une seule réponse : la virgule
  // la coupait en deux options sans objet.
  'WC1!J48': ['non', 'oui à côté, derrière un des murs', "oui à l'aplomb aux étages inférieurs"],
};

/**
 * Champs à choix multiple que le classeur ne marque pas « à cocher ».
 *
 * Demandés par Victor Ledoux (retour de test, 2026-09) ; les autres choix
 * multiples se déduisent de la note (`MULTI_RE`).
 */
const MULTIPLES_IMPOSES = new Set([
  'Appareils de lavage!K94', // Type de zone lavée — autolaveuse
  'Appareils de lavage!E138', // Type de zone lavée — lavage manuel du sol
  'Appareils de lavage!H138', // Type de surface
  'Extérieur1!N38', // Type de paillage
  'Extérieur1!F41', // Mode d'arrosage
  'Extérieur1!F44', // Origine eau pour l'arrosage
  'Bassin1!F17', // Type de couverture
  'Opportunités1!F15', // Utilisations extérieures potentielles — eau de pluie
  'Opportunités1!I15', // Utilisations intérieures potentielles — eau de pluie
  'Opportunités1!F48', // Utilisations extérieures potentielles — eaux ménagères
  'Opportunités1!I48', // Utilisations intérieures potentielles — eaux ménagères
  // Second retour de test (2026-10) : une même fiche peut porter à la fois une
  // « autre information » et une « autre utilisation de l'eau ».
  'Autre1!F8', // Choix
]);

/**
 * Champ libre ouvert **pour chaque option cochée** d'un choix multiple.
 *
 * Demandé au second retour de test (2026-10) pour la fréquentation des WC :
 * cocher « Public extérieur » ouvre « Fréquence d'utilisation — Public
 * extérieur ». Les saisies sont stockées à part, sous `cle`, en
 * `{ option: texte }` : la valeur du champ reste la liste des options cochées.
 */
const CHAMPS_PAR_OPTION = {
  'WC1!F15': { cle: 'FrequenceDUtilisation', libelle: "Fréquence d'utilisation" },
};

/**
 * Exigences corrigées par l'auteur du classeur après coup.
 *
 * Toutes viennent du retour de test de Victor Ledoux (2026-09), qui les
 * reconnaît comme des erreurs du classeur : un renvoi vers un réseau ECS rendu
 * obligatoire bloquerait l'enregistrement dans les bâtiments où l'on ne saisit
 * pas les réseaux, et l'on ne démontera pas chaque douche pour y chercher un
 * limiteur de débit. À reporter dans le classeur.
 */
const REQUIREMENT_OVERRIDES = {
  'Production Stockage ECS!F16': 'recommande', // Numéro de réseau ECS associé
  'Production Stockage ECS!F33': 'facultatif', // Combustible
  'Robinets!K21': 'recommande', // Numéro réseau ECS d'appartenance
  'Douche-baignoire1!I11': 'recommande', // Numéro réseau ECS d'appartenance
  'Douche-baignoire1!E41': 'facultatif', // Présence d'un limiteur de débit — douche
  // Même question, même raison, sur la baignoire : étendu par cohérence.
  'Douche-baignoire1!E80': 'facultatif',
  'Douche-baignoire1!E114': 'facultatif', // Diamètre nominal de l'alimentation
};

/** Unités absentes ou ambiguës dans le libellé (Victor Ledoux, 2026-09). */
const UNIT_OVERRIDES = {
  'Toiture1!I19': '%', // « (% ou °) » : le pourcentage est retenu
  'Extérieur1!I47': 'min', // Durée d'un arrosage
  'Extérieur1!F63': 'min', // Durée d'un nettoyage
  'Liste Piscines!E47': 'min', // Durée d'un nettoyage des plages
};

/**
 * Aides imposées, par cellule d'origine — `null` n'en affiche aucune.
 *
 * L'aide vient d'ordinaire de la parenthèse finale du libellé.
 */
const HELP_OVERRIDES = {
  // Le classeur la pose sous le tableau, renvoyée par l'astérisque d'une
  // option (« Toilette avec rince main intégré* ») ; Victor Ledoux la veut sur
  // les remarques, reformulée.
  'WC1!F57': "Le cas échéant, précisez le débit du lave-main présent au-dessus de la chasse d'eau.",
  // La parenthèse « (% ou °) » est devenue l'unité.
  'Toiture1!I19': null,
};

/**
 * Champs retirés. « Emplacement » de l'espace technique aménageable doublait
 * celui de la fiche, rempli juste au-dessus (Victor Ledoux, 2026-09).
 * « Continuité de l'isolation » du calorifugeage est comprise dans l'état
 * bon / moyen / mauvais de l'isolant, demandé juste après (second retour de
 * test, 2026-10).
 */
const CHAMPS_RETIRES = new Set(['Structure1!F45', 'Réseaux ECS!F38']);

/**
 * Remarques générales rangées par le classeur sous la dernière rubrique de la
 * fiche. Tant que les rubriques n'étaient pas masquées, c'était sans
 * conséquence ; désormais, elles disparaîtraient avec la rubrique qu'elles
 * suivent (les urines, le nettoyage…). Elles forment leur propre bloc.
 */
const CHAMPS_DETACHES = new Set([
  'Compteur général!H63',
  'Extérieur1!F69',
  'Structure1!F65',
  'Opportunités1!F77',
  'Autre1!F56',
]);
const SECTION_DETACHEE = 'Remarques';


const norm = (a) => a.map((s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()).sort().join('|');
const LOOKUP = new Map(Object.entries(L).map(([k, v]) => [norm(v), k]));

/**
 * Clés de champs à figer par [onglet][libellé exact] → clé de stockage.
 *
 * Vide pour cette régénération (V3 du classeur, 2026-08) : aucun audit réel
 * n'est en circulation — confirmé par l'auteur du projet avant de régénérer —
 * donc rien ne dépend encore des clés dérivées. La V3 fait pourtant dériver
 * 47 clés et en met 3 en collision (une clé qui survit mais change de sens,
 * bien plus dangereux qu'une clé perdue). La table reste prête à l'emploi :
 * dès que de vrais audits circuleront, toute régénération future devra y
 * figer les clés des entités concernées **avant** de faire tourner ce script.
 */
const KEY_OVERRIDES = {
  // La coquille « réservie » est corrigée à l'affichage (`LABEL_FIXES`), pas
  // dans la clé : des audits d'essai ont été saisis sous celle-ci.
  Incendie: { "Présence d'une réserve incendie ?": 'PresenceDUneReservieIncendie' },
};

/** Clé de stockage dérivée du libellé, stable et lisible. */
function keyFor(sheet, label) {
  const o = KEY_OVERRIDES[sheet] && KEY_OVERRIDES[sheet][label];
  if (o) return o;
  const base = label
    .replace(/\([^)]*\)/g, ' ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 5)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join('');
  return base || 'Champ';
}

/**
 * Unité entre parenthèses. Le motif exige que la parenthèse **ne contienne que**
 * l'unité : « (chocs, gel) » n'en est pas une, alors qu'un simple `h` accepté
 * n'importe où dans la parenthèse le faisait passer pour tel.
 */
const UNITES = 'l\\/min|L\\/min|l\\/s|m3\\/h|m3|m³|m²|m2|mm|cm|m|°C|bar|kWh|%|kg|s|L|h';
const UNIT_RE = new RegExp('\\(\\s*(?:en\\s+)?(' + UNITES + ')\\s*\\)');
/** Une parenthèse qui ne contient qu'une unité — « (mm) », « (en m) ». */
const UNIT_SEULE_RE = new RegExp('^\\s*(?:en\\s+)?(?:' + UNITES + ')\\s*$');

/** Première lettre en capitale, pour une aide tirée d'une parenthèse. */
const capitale = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);

/**
 * Sépare le libellé affiché de ses indications entre parenthèses.
 *
 * « Dysfonctionnements observés (tourne sans débit, bloqué, bruit,…) » : la
 * parenthèse finale est une aide à la saisie. Le générateur la retirait du
 * libellé et la perdait — tous les exemples du classeur avaient disparu de
 * l'écran (Victor Ledoux, 2026-09). Elle devient `help`, affichée en petit sous
 * le champ. Une parenthèse qui ne porte qu'une unité est retirée : l'unité est
 * affichée à part.
 *
 * Seules les parenthèses **finales**, précédées d'une espace, sont prises :
 * « vanne(s) thermostatique(s) » garde les siennes. Les parenthèses sont
 * appariées, « lourdes (huile, boue)) » compris.
 */
function decouperLibelle(brut) {
  const sansEtoile = (t) => t.replace(/\s*\*+\s*$/, '').trim();
  let label = sansEtoile(brut);
  const aides = [];
  for (;;) {
    if (!label.endsWith(')')) break;
    let prof = 0;
    let debut = -1;
    for (let i = label.length - 1; i >= 0; i--) {
      if (label[i] === ')') prof++;
      else if (label[i] === '(' && --prof === 0) {
        debut = i;
        break;
      }
    }
    if (debut <= 0 || !/\s/.test(label[debut - 1])) break;
    const dedans = label.slice(debut + 1, -1).trim();
    label = sansEtoile(label.slice(0, debut));
    if (!UNIT_SEULE_RE.test(dedans)) aides.unshift(capitale(dedans));
  }
  return { label: label || brut, help: aides.join(' — ') || null };
}

/** Une ligne d'exemple posée sous le libellé : « exemple : Trace de fuite… ». */
const EXEMPLE_RE = /^exemples?\s*:/i;

/**
 * Marqueur d'énumération dans une note. Le classeur emploie plusieurs
 * formulations pour la même intention (liste déroulante, menu déroulant,
 * cases à cocher) — s'en tenir à « liste déroulante » seul avait fait perdre
 * 13 champs sur le seul onglet WC1.
 */
const ENUM_MARKER_RE = /liste\s*d[ée]roulante|menu\s*d[ée]roulant|(?:cases?\s*)?[aà]\s*cocher/i;

/**
 * Plusieurs réponses possibles. « À cocher » est la forme du classeur pour une
 * liste à choix multiple ; « plusieurs réponses possibles » la précise parfois.
 * Tous ces champs n'acceptaient qu'une réponse (Victor Ledoux, 2026-09).
 */
const MULTI_RE = /cocher|plusieurs\s+(?:r[ée]ponses\s+|choix\s+)?possibles/i;

/**
 * Découpe une liste d'options en respectant les parenthèses : une virgule à
 * l'intérieur d'une parenthèse fait partie de la valeur (« maçonnée (brique,
 * parpaing, carreau de plâtre) » est une seule option, pas trois).
 */
function splitOptions(text) {
  const parts = [];
  let cur = '';
  let depth = 0;
  for (const ch of text) {
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && /[\n,;]/.test(ch)) {
      parts.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  parts.push(cur);
  return parts;
}

// ── Renvois d'une fiche vers une autre ─────────────────────────────────────

/**
 * Note décrivant une référence croisée déguisée en liste déroulante — ex.
 * « Liste déroulante : avec les choix de la liste des réseaux ECS ». Sans
 * cette détection, le champ devient un select à une seule option absurde,
 * au lieu d'une vraie référence stockant l'Id de l'élément visé.
 */
const ENTITY_REF_RE =
  /(?:avec\s+les\s+choix\s+de\s+la\s+liste\s+des?|choix\s+de\s+la\s+liste\s+des?|liste\s+des?)\s+([^.\n,;()]+)/i;

/**
 * Le renvoi est parfois porté par le seul libellé, la note se bornant à
 * « Champ libre » — « Numéro de réseau ECS associé », « Numéro du robinet de
 * remplissage ». Trois des cinq renvois simples de la V3 sont dans ce cas :
 * s'en tenir à la note les rendrait en texte libre, et l'auditeur y saisirait
 * à la main un numéro que la renumérotation d'une suppression fera pointer
 * ailleurs (voir §3 de CLAUDE.md — `Numero` n'est jamais une clé).
 */
const LABEL_REF_RE = /^num[ée]ros?\s+(?:du|des|de\s+la|de|d')\s+(.+?)\s*$/i;

/** Un libellé au pluriel — « Numéros des robinets » — désigne plusieurs cibles. */
const MULTI_REF_RE = /^num[ée]ros\s/i;

/**
 * Compléments que le classeur ajoute au nom de l'entité visée et qui n'en font
 * pas partie : « du robinet **de remplissage** », « de réseau ECS **associé** ».
 */
const REF_TAIL_RE = /\s*(?:correspondants?|associ[ée]s?|d'appartenance|de\s+remplissage|de\s+l'appareil)\s*$/i;

/**
 * Noms d'entités tels que le classeur les cite, ramenés à la clé visée.
 * `entityByPlural` ne reconnaît que le pluriel exact du schéma ; le classeur
 * écrit « réseau ECS » au singulier.
 */
const REF_ALIASES = {
  'reseau ecs': 'reseaux_eau_chaude_sanitaire',
  'reseaux ecs': 'reseaux_eau_chaude_sanitaire',
  robinet: 'robinets',
  robinets: 'robinets',
};

/** Pour résoudre « la liste des réseaux ECS » → `reseaux_eau_chaude_sanitaire`. */
const entityByPlural = new Map(ENTITIES.map((e) => [normLabel(e.plural), e.key]));

/**
 * Nom d'entité cité par le classeur → clé de l'entité visée.
 *
 * Le nom est suivi d'un complément de longueur variable — « robinet **utilisé
 * pour le remplissage** ». On retient le plus long préfixe qui désigne une
 * entité, en partant de trois mots : au-delà, aucun nom d'entité du schéma.
 */
function resolveRef(nom) {
  const mots = normLabel(String(nom).replace(REF_TAIL_RE, '')).split(' ').filter(Boolean);
  for (let n = Math.min(3, mots.length); n >= 1; n--) {
    const essai = mots.slice(0, n).join(' ');
    if (REF_ALIASES[essai]) return REF_ALIASES[essai];
    const e = entityByPlural.get(essai);
    if (e) return e;
  }
  return null;
}

/**
 * Met au propre une liste d'options brute, quelle que soit la façon dont elle
 * a été trouvée — note marquée « liste déroulante » ou énumération implicite.
 *
 * Les deux chemins doivent nettoyer pareil : la liste des types de toilettes,
 * quinze options, n'a aucun marqueur dans le classeur et gardait son
 * astérisque de renvoi là où les listes marquées le perdaient.
 */
function cleanOptions(list) {
  return list
    // L'astérisque final renvoie à une légende du classeur, absente de
    // l'écran : affiché tel quel il ressemble à une marque d'obligation.
    .map((o) => o.trim().replace(/[.,;]+$/, '').replace(/\s*\*+$/, '').replace(/^["«»\s]+|["«»\s]+$/g, ''))
    .map((o) => VALUE_FIXES[o] || o)
    // « (plusieurs réponses possibles) » n'est pas une valeur mais une
    // consigne, que le classeur écrit sur la ligne du marqueur.
    .filter((o) => o && o.length < 80 && !/^\(.*\)$/.test(o) && !CONSIGNE_OPTION_RE.test(o));
}

/**
 * Consigne glissée parmi les options : « ouvrant les champs à la suite en
 * question : », « plusieurs possibles », « Ouvrir la suite en fonction du
 * choix ». Plus étroite qu'`INTERFACE_NOTE_RE` : « bouton » ou « page »
 * peuvent être de vraies valeurs (« Bouton chasse cassé ou bloqué », perdu
 * jusqu'ici de la liste des dysfonctionnements des WC).
 */
const CONSIGNE_OPTION_RE = /affich|si\s+oui|si\s+non|\bouvr|incr[ée]menter|calcul|^plusieurs\b|:$/i;

/**
 * Note qui énumère sans le dire.
 *
 * Seize champs de la V3 portent une liste de valeurs sans aucun marqueur —
 * dont « Type de toilette ou urinoir » et ses quinze options, pourtant
 * obligatoire. Ils retombaient en texte libre. Une note faite de plusieurs
 * lignes courtes, sans ponctuation de phrase ni consigne d'interface, est une
 * énumération : c'est la même forme que les notes marquées.
 */
const INTERFACE_NOTE_RE = /affich|si\s+oui|si\s+non|\bouvr|bouton|page|onglet|incr[ée]menter|calcul/i;
function looksEnumerated(note) {
  const lignes = note.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lignes.length < 3) return null;
  if (lignes.some((l) => l.length > 60)) return null;
  if (INTERFACE_NOTE_RE.test(note)) return null;
  if (lignes.filter((l) => /[.!?]$/.test(l)).length > 1) return null;
  return cleanOptions(lignes);
}

function classify(note, cellBelow, label) {
  const n = note || '';

  // Renvoi vers **plusieurs** éléments : `entity-ref` n'en stocke qu'un seul.
  // À tester avant toute autre reconnaissance de renvoi, sinon la note (« avec
  // les choix de la liste des robinets ») fait passer le champ pour une
  // référence simple et l'auditeur perd les autres cibles sans le voir.
  if (MULTI_REF_RE.test(label)) {
    const lm = label.match(LABEL_REF_RE);
    const cible = lm ? resolveRef(lm[1]) : null;
    if (cible) {
      return {
        kind: 'text',
        warn: `Le classeur attend ici plusieurs ${cible} ; la saisie multiple n'est pas encore gérée.`,
      };
    }
  }

  const ref = n.match(ENTITY_REF_RE);
  if (ref) {
    const target = resolveRef(ref[1]);
    if (target) return { kind: 'entity-ref', refTo: target };
  }

  // Renvoi porté par le seul libellé, la note se bornant à « Champ libre ».
  const lref = label.match(LABEL_REF_RE);
  if (lref) {
    const target = resolveRef(lref[1]);
    if (target) return { kind: 'entity-ref', refTo: target };
  }

  // « oui/non » seul dans la note, sans marqueur de liste : « Possibilité
  // d'installer un réseau supplémentaire… » restait en texte libre.
  if (
    /\bo\s*\/\s*n\b/i.test(n) ||
    /^\s*oui\s*\/\s*non\s*$/i.test(n) ||
    /^\s*oui\s*\/\s*non\s*$/i.test(cellBelow || '')
  ) {
    return { kind: 'boolean' };
  }

  if (ENUM_MARKER_RE.test(n)) {
    // Le classeur sépare d'une ligne vide la liste et le commentaire qui la
    // suit : « liste déroulante douche ou baignoire ⏎⏎ Affiche ensuite la
    // partie "Douche" ou "Baignoire" ». Sans cette coupe, la consigne
    // d'interface devient deux options de plus.
    const blocs = n.split(/\n\s*\n/);
    let utile = blocs[0];
    for (let i = 1; i < blocs.length; i++) {
      if (INTERFACE_NOTE_RE.test(blocs[i])) break;
      utile += '\n' + blocs[i];
    }

    const after = utile.replace(new RegExp('^[\\s\\S]*?(?:' + ENUM_MARKER_RE.source + ')\\s*:?\\s*', 'i'), '');
    let opts = cleanOptions(splitOptions(after));
    // Un seul item retenu : les options sont peut-être jointes par « / » plutôt
    // que par une virgule (« Bon / Moyen / Mauvais », « oui/non/ne sait pas »).
    // Ne s'applique qu'à un item unique : un « / » à l'intérieur d'un item d'une
    // liste déjà scindée (ex. « PVC/EPDM ») fait partie de sa valeur.
    if (opts.length === 1 && /\bou\b/.test(opts[0])) {
      opts = opts[0].split(/\bou\b/).map((o) => o.trim()).filter(Boolean).map((o) => o[0].toUpperCase() + o.slice(1));
    } else if (opts.length === 1 && opts[0].includes('/')) {
      opts = opts[0].split('/').map((o) => o.trim()).filter(Boolean);
    }
    // Le classeur écrit ses doublons : « R160, R200, R400 » revient deux fois
    // dans la classe métrologique. Dédoublonner en conservant l'ordre.
    const vus = new Set();
    opts = opts.filter((o) => {
      const k = normLabel(o);
      if (vus.has(k)) return false;
      vus.add(k);
      return true;
    });

    // Une liste déroulante à deux entrées « oui / non » est un booléen : le
    // classeur l'écrit comme une énumération, mais la stocker en texte ferait
    // cohabiter « oui », « Oui » et `true` selon la formulation de la note.
    if (opts.length === 2 && norm(opts) === norm(['oui', 'non'])) {
      return { kind: 'boolean' };
    }

    return { kind: 'select', options: opts, multiple: MULTI_RE.test(n) };
  }

  const unit = label.match(UNIT_RE);
  if (unit) return { kind: 'number', unit: unit[1].trim() };
  if (/^nombre|^nb\b|^dur[ée]e|^ann[ée]e|^volume|^temps|^fr[ée]quentation|^surface/i.test(label)) {
    return { kind: 'number' };
  }
  if (/remarques|dysfonctionnements|raisons|pr[ée]cisions?$/i.test(label)) return { kind: 'textarea' };

  const implicites = looksEnumerated(n);
  if (implicites) return { kind: 'select', options: implicites };

  return { kind: 'text' };
}

// ── Écriture du schéma ─────────────────────────────────────────────────────

const out = [];
out.push(`import { EntityDef } from './field.models';`);
out.push(`import * as L from './value-lists';`);
out.push('');
out.push(`/**`);
out.push(` * Schéma de la partie technique — GÉNÉRÉ depuis \`audit_technique.xlsx\`.`);
out.push(` *`);
out.push(` * \`row\` reproduit le numéro de ligne du tableau Excel : les champs partageant`);
out.push(` * la même valeur sont affichés côte à côte, comme le prescrit le classeur.`);
out.push(` * \`section\` reprend les blocs du classeur, \`requirement\` le niveau d'exigence`);
out.push(` * porté par la cellule voisine du libellé, et \`source\` la cellule d'origine.`);
out.push(` *`);
out.push(` * Régénérer avec \`node tools/gen-schema.js\` après modification du classeur.`);
out.push(` * **Ne pas l'éditer à la main** : la prochaine régénération écraserait tout.`);
out.push(` */`);
out.push(`export const AUDIT_SCHEMA: EntityDef[] = [`);

const report = [];

for (const ent of ENTITIES) {
  const sheet = wb.sheets.find((x) => x.name === ent.sheet);
  const fields = [];
  const seen = new Set();

  if (!sheet) {
    // Onglet disparu : l'entité n'est conservée que si des champs figés la
    // décrivent (voir `CHAMPS_FIGES`). Sinon c'est un oubli dans `ENTITIES`.
    const figes = CHAMPS_FIGES[ent.key];
    if (!ent.horsClasseur || !figes) {
      report.push(`  ⚠ onglet absent : ${ent.sheet}`);
      continue;
    }
    for (const c of figes) {
      const f = { ...c, source: `${ent.sheet} (V2, champs figés)` };
      if (Array.isArray(c.options)) {
        const constant = LOOKUP.get(norm(c.options));
        f.options = constant ? `L.${constant}` : JSON.stringify(c.options);
      }
      if (c.kind === 'textarea') f.wide = true;
      fields.push(f);
    }
  }

  const { champs, legendes } = sheet ? lireFiche(wb, sheet) : { champs: [], legendes: [] };

  // Ligne d'en-têtes des tableaux de mesure de débit de cette feuille : ce
  // qu'on y lit est une colonne du tableau, pas un champ.
  const lignesMesures = new Set(
    Object.entries(MESURES_DEBIT)
      .filter(([src]) => src.startsWith(ent.sheet + '!'))
      .map(([, r]) => r)
  );

  for (const c of champs) {
    const source = `${ent.sheet}!${colName(c.c)}${c.r}`;
    if (CHAMPS_RETIRES.has(source) || lignesMesures.has(c.r)) continue;

    const { kind, options, unit, refTo, warn, multiple } = classify(c.note, c.below, c.label);

    // La clé dérive du libellé **complet** : en retirer les parenthèses ici
    // ferait dériver des clés déjà en circulation.
    let key = keyFor(ent.sheet, c.label);
    while (seen.has(key)) key += 'Bis';
    seen.add(key);

    const { label, help } = decouperLibelle(c.label);
    const f = {
      key,
      label,
      kind: c.kind || kind,
      row: c.r,
      source,
      rawLabel: c.label,
    };
    if (MESURES_DEBIT[source]) f.kind = 'mesures-debit';

    const aide = source in HELP_OVERRIDES ? HELP_OVERRIDES[source] : help || (EXEMPLE_RE.test(c.below) ? capitale(c.below.replace(/\s+/g, ' ').replace(/\s+:/, ' :')) : null);
    if (aide) f.help = aide;
    const unite = UNIT_OVERRIDES[source] || (f.kind === 'number' ? unit : null);
    if (unite) {
      f.unit = unite;
      if (f.kind !== 'number') f.kind = 'number';
    }
    if (refTo) f.refTo = refTo;
    if (warn) f.warn = warn;
    const impose = OPTION_OVERRIDES[source];
    if (impose) {
      f.optionsArr = Array.isArray(impose) ? impose : L[impose];
      f.options = Array.isArray(impose) ? JSON.stringify(impose) : `L.${impose}`;
      // Le champ devient un choix même si la note ne le disait pas clairement.
      if (f.kind !== 'select') f.kind = 'select';
    } else if (options && options.length && f.kind === 'select') {
      const constant = LOOKUP.get(norm(options));
      // Les valeurs stockées sont celles de la constante, pas celles de la note.
      f.optionsArr = constant ? L[constant] : options;
      f.options = constant ? `L.${constant}` : JSON.stringify(options);
    }
    if (f.kind === 'select' && (multiple || MULTIPLES_IMPOSES.has(source))) f.multiple = true;
    const parOption = CHAMPS_PAR_OPTION[source];
    if (parOption) {
      // Un champ par option cochée n'a de sens que sur un choix multiple, et
      // sa clé de stockage ne doit pas recouvrir celle d'un champ de la fiche.
      if (!f.multiple) throw new Error(`${source} : champ par option déclaré sur un champ qui n'est pas à choix multiple`);
      if (seen.has(parOption.cle)) throw new Error(`${source} : la clé ${parOption.cle} est déjà celle d'un champ`);
      seen.add(parOption.cle);
      f.parOption = parOption;
    }
    if (f.kind === 'textarea' || f.kind === 'mesures-debit') f.wide = true;
    if (CHAMPS_DETACHES.has(source)) {
      f.section = SECTION_DETACHEE;
    } else {
      if (c.section) f.section = c.section;
      if (c.bloc) f.bloc = c.bloc;
    }
    const exigence = REQUIREMENT_OVERRIDES[source] || c.requirement;
    if (exigence) f.requirement = exigence;

    fields.push(f);
  }

  // Une table de correction qui ne trouve plus sa cellule est une correction
  // perdue en silence : le classeur a bougé, la table doit suivre.
  for (const table of [OPTION_OVERRIDES, REQUIREMENT_OVERRIDES, UNIT_OVERRIDES, HELP_OVERRIDES, MESURES_DEBIT, CHAMPS_PAR_OPTION]) {
    for (const src of Object.keys(table)) {
      if (src.startsWith(ent.sheet + '!') && !fields.some((f) => f.source === src)) {
        throw new Error(`${src} : correction déclarée pour un champ introuvable`);
      }
    }
  }
  // Un retrait qui ne retire plus rien : la cellule a bougé, et le champ
  // écarté est revenu à l'écran sous une autre référence.
  for (const src of CHAMPS_RETIRES) {
    if (src.startsWith(ent.sheet + '!') && !champs.some((c) => `${ent.sheet}!${colName(c.c)}${c.r}` === src)) {
      throw new Error(`${src} : retrait déclaré pour un champ introuvable`);
    }
  }
  for (const table of [MULTIPLES_IMPOSES, CHAMPS_DETACHES]) {
    for (const src of table) {
      if (src.startsWith(ent.sheet + '!') && !fields.some((f) => f.source === src)) {
        throw new Error(`${src} : correction déclarée pour un champ introuvable`);
      }
    }
  }

  // ── Légendes ─────────────────────────────────────────────────────────────
  //
  // Chaque légende va aux champs qu'elle définit. D'abord ceux dont le libellé
  // porte l'astérisque de renvoi, entre la légende précédente et celle-ci ;
  // sinon, dans la même fenêtre, ceux dont les options sont les termes de la
  // légende (« Etat général » des WC n'a pas d'astérisque) ; sinon, n'importe
  // où plus haut (l'exigence de propreté, définie une fois en bas de fiche
  // pour deux champs). Il faut trois termes communs : « faible / moyen /
  // élevé » ne doit pas hériter de la légende « fort / moyen / faible ».
  const motsDe = (t) => normLabel(VALUE_FIXES[t] || t).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const couvre = (f, lg) => {
    const opts = f.optionsArr || [];
    const communs = opts.filter((o) => {
      const mo = motsDe(o).join(' ');
      return lg.entrees.some((e) => {
        const me = motsDe(e.terme);
        return me.join(' ') === mo || me.includes(mo) || me.join(' ').startsWith(mo) || mo.startsWith(me.join(' '));
      });
    });
    return communs.length >= Math.min(3, lg.entrees.length);
  };
  let rPrec = 0;
  for (const lg of [...legendes].sort((x, y) => x.r - y.r)) {
    const libres = fields.filter((f) => !f.legend && f.row < lg.r);
    const fenetre = libres.filter((f) => f.row > rPrec);
    let cibles = fenetre.filter((f) => /\*\s*$/.test(f.rawLabel));
    if (!cibles.length) cibles = fenetre.filter((f) => couvre(f, lg));
    if (!cibles.length) cibles = libres.filter((f) => couvre(f, lg));
    if (!cibles.length) report.push(`  ⚠ ${ent.sheet}!${lg.ref} : légende sans champ`);
    for (const f of cibles) {
      f.legend = lg.entrees.map((e) => ({ terme: VALUE_FIXES[e.terme] || e.terme, definition: e.definition }));
    }
    rPrec = lg.r;
  }

  // ── Blocs conditionnels ────────────────────────────────────────────────
  //
  // Déclarés dans `lib/classeur.js` par cellule d'origine du champ qui les
  // commande, résolus ici en clé. Tout écart **arrête la génération** : un bloc
  // mal résolu désactiverait en silence l'exigence de ses champs obligatoires,
  // ou au contraire bloquerait la validation d'une fiche pour un bloc qui ne
  // la concerne pas — le défaut que cette table corrige.
  //
  // Un bloc désigne un intitulé de premier niveau (`bloc`) ou une section.
  const blocs = [];
  for (const b of ent.blocs || []) {
    const commande = fields.find((f) => f.source === `${ent.sheet}!${b.champSource}`);
    if (!commande) throw new Error(`${ent.sheet} : bloc « ${b.bloc} », champ ${b.champSource} introuvable`);
    if (!fields.some((f) => f.key !== commande.key && (f.bloc === b.bloc || f.section === b.bloc))) {
      throw new Error(`${ent.sheet} : bloc « ${b.bloc} » introuvable parmi les sections`);
    }
    const valeurs = b.valeurs.filter((v) => {
      if (commande.kind === 'boolean') return typeof v === 'boolean';
      if (typeof v !== 'string') return false;
      return (commande.optionsArr || []).includes(v);
    });
    if (!valeurs.length) {
      throw new Error(
        `${ent.sheet} : bloc « ${b.bloc} », aucune valeur de ${JSON.stringify(b.valeurs)} ` +
          `ne correspond au champ ${commande.key} (${commande.kind}, ${commande.options || 'sans options'})`
      );
    }
    blocs.push({ bloc: b.bloc, champ: commande.key, valeurs, source: b.source });
  }

  const sansExigence = fields.filter((f) => !f.requirement).length;
  report.push(
    `  ${ent.sheet.padEnd(26)} ${String(fields.length).padStart(3)} champs, ` +
      `${new Set(fields.map((f) => f.section || '—')).size} sections, ${sansExigence} sans exigence` +
      (blocs.length ? `, ${blocs.length} bloc(s) conditionnel(s)` : '') +
      (ent.horsClasseur ? '  [hors classeur, champs figés]' : '')
  );

  out.push(`  {`);
  out.push(`    key: ${JSON.stringify(ent.key)},`);
  out.push(`    route: ${JSON.stringify(ent.route)},`);
  out.push(`    singular: ${JSON.stringify(ent.singular)},`);
  out.push(`    plural: ${JSON.stringify(ent.plural)},`);
  if (ent.single) out.push(`    single: true,`);
  if (ent.embedded) out.push(`    embedded: ${JSON.stringify(ent.embedded)},`);
  if (ent.preambule) out.push(`    preambule: ${JSON.stringify(ent.preambule)},`);
  if (ent.horsClasseur) out.push(`    horsClasseur: true,`);
  if (blocs.length) {
    out.push(`    blocsConditionnels: [`);
    for (const b of blocs) {
      out.push(
        `      { bloc: ${JSON.stringify(b.bloc)}, champ: ${JSON.stringify(b.champ)}, ` +
          `valeurs: ${JSON.stringify(b.valeurs)}, source: ${JSON.stringify(b.source)} },`
      );
    }
    out.push(`    ],`);
  }
  out.push(`    listColumns: ${JSON.stringify(ent.cols)},`);
  if (ent.colLabels) out.push(`    listColumnLabels: ${JSON.stringify(ent.colLabels)},`);
  out.push(`    fields: [`);
  for (const f of fields) {
    const parts = [
      `key: ${JSON.stringify(f.key)}`,
      `label: ${JSON.stringify(f.label)}`,
      `kind: ${JSON.stringify(f.kind)}`,
      `row: ${f.row}`,
    ];
    if (f.unit) parts.push(`unit: ${JSON.stringify(f.unit)}`);
    if (f.refTo) parts.push(`refTo: ${JSON.stringify(f.refTo)}`);
    if (f.options) parts.push(`options: ${f.options}`);
    if (f.multiple) parts.push(`multiple: true`);
    if (f.parOption) {
      parts.push(`parOption: { cle: ${JSON.stringify(f.parOption.cle)}, libelle: ${JSON.stringify(f.parOption.libelle)} }`);
    }
    if (f.section) parts.push(`section: ${JSON.stringify(f.section)}`);
    if (f.bloc) parts.push(`bloc: ${JSON.stringify(f.bloc)}`);
    if (f.requirement) parts.push(`requirement: ${JSON.stringify(f.requirement)}`);
    if (f.help) parts.push(`help: ${JSON.stringify(f.help)}`);
    if (f.legend) parts.push(`legend: ${JSON.stringify(f.legend)}`);
    if (f.source) parts.push(`source: ${JSON.stringify(f.source)}`);
    if (f.warn) parts.push(`warn: ${JSON.stringify(f.warn)}`);
    if (f.wide) parts.push(`wide: true`);
    out.push(`      { ${parts.join(', ')} },`);
  }
  out.push(`    ],`);
  out.push(`  },`);
}

out.push(`];`);
out.push('');
out.push(`/** Retrouve une entité par sa clé de stockage. */`);
out.push(`export function entityByKey(key: string): EntityDef | undefined {`);
out.push(`  return AUDIT_SCHEMA.find((e) => e.key === key);`);
out.push(`}`);
out.push('');
out.push(`/** Retrouve une entité par son segment d'URL. */`);
out.push(`export function entityByRoute(route: string): EntityDef | undefined {`);
out.push(`  return AUDIT_SCHEMA.find((e) => e.route === route);`);
out.push(`}`);
out.push('');

fs.writeFileSync(path.join(__dirname, '..', 'src', 'app', 'models', 'audit-schema.ts'), out.join('\n'), 'utf8');
console.log(report.join('\n'));
