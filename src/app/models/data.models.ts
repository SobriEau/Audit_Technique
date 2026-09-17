/**
 * Modèles de données SobriEau.
 * Conserve les mêmes clés que le localStorage existant pour la rétrocompatibilité.
 */

/**
 * Référence à une image stockée en IndexedDB (plan ou photo).
 * Seule cette référence légère transite par le JSON de l'audit.
 */
export interface AssetRef {
  id: string;
  name: string;
  /**
   * Chemin relatif du fichier, en mode « fichiers voisins ».
   *
   * Renseigné uniquement lorsque la photo a été téléchargée à côté de la page.
   * Quand il est présent, il sert de première source d'affichage.
   */
  path?: string;

  /**
   * Identifiant du fichier déposé sur Drive, s'il l'a été.
   *
   * Sert de **secours d'affichage** quand le fichier local est introuvable —
   * déplacé, renommé, ou nettoyé du dossier de téléchargement — et de preuve
   * que la photo ne repose plus uniquement sur ce poste.
   */
  driveId?: string;

  /** Date du plan (ex. date du relevé), au format `input[type=date]`. Facultative. */
  date?: string | null;
}

/**
 * Emplacement d'un élément sur un plan.
 * x et y sont des fractions (0 à 1) de la largeur et de la hauteur du plan,
 * afin que la punaise reste juste quelle que soit la taille d'affichage.
 */
export interface PlanLocation {
  planId: string;
  x: number;
  y: number;
}

/**
 * Socle commun à tout élément d'audit listé puis détaillé sur sa propre fiche
 * (robinets aujourd'hui ; sous-compteurs, WC, douches… à venir).
 *
 * Deux notions à ne jamais confondre :
 *
 * - `Id` est l'identité technique. Attribuée une fois, jamais réattribuée,
 *   jamais renumérotée. C'est vers elle que pointent les relations entre
 *   éléments et les URL de fiche.
 * - `Numero` est un simple libellé affiché à l'auditeur. La spécification
 *   prévoit de le renuméroter après une suppression ; il ne peut donc pas
 *   servir de clé, sous peine de faire glisser silencieusement les relations
 *   d'un élément vers un autre.
 */
export interface AuditEntity {
  /** Identité technique stable. Ne jamais la réutiliser ni la recalculer. */
  Id: string;
  /** Numéro affiché. Libellé uniquement — jamais une clé. */
  Numero?: string | null;
  /**
   * Les autres champs sont déclarés dans le schéma (`audit-schema.ts`) et non
   * dans le type : c'est ce qui permet à un même moteur de rendre les dix
   * entités. Les entités fortement typées, comme `Robinet`, précisent leurs
   * champs en plus de cette signature.
   */
  [key: string]: unknown;
}

/**
 * Niveau de remplissage des fiches de l'audit technique. Voir
 * `AppData.NiveauRemplissage` et `FieldDef.requirement` (`field.models.ts`).
 */
export type NiveauRemplissage = 'complet' | 'allege' | 'minimal';

/**
 * Référence vers un autre élément de l'audit, par son `Id`.
 *
 * À utiliser pour toutes les relations décrites par la spécification
 * (« Numéro robinet correspondant », « Numéro réseau ECS d'appartenance »…) :
 * on stocke l'identité, on n'affiche que le `Numero` de la cible.
 */
export type EntityRef = string;

export interface Robinet extends AuditEntity {
  /** Emplacement sur un plan de l'audit. Stocké dans l'élément lui-même,
   *  pour qu'il suive le robinet lors des suppressions dans la liste. */
  Localisation?: PlanLocation | null;
  /** Photos propres à ce robinet. */
  Photos?: AssetRef[];
  Emplacement?: string | null;
  PrecisionEmplacement?: string | null;
  Type?: string | null;
  Usages?: string | null;
  Debit?: number | null;
  PresenceReducteur?: boolean | null;
  TempsECS?: number | null;
  NumeroReseauECS?: string | null;
  NbUtilisationSemaine?: number | null;
  NbEquipementIdentique?: number | null;
  Remarques?: string | null;
}

/**
 * Contexte du bâtiment, saisi sur le tableau de bord de l'audit technique
 * (onglet « Tableau de bord » du classeur, lignes 7 à 23).
 *
 * Rangé dans un objet imbriqué plutôt qu'à plat sous `Qte` : `isEmpty()` du
 * registre ne regarde que les tableaux et les objets nommés sous `Qte`, et
 * sept clés scalaires à plat feraient passer pour vide un audit rempli
 * uniquement ici — l'arbitrage d'adresse renommerait alors sans demander.
 */
export interface TableauDeBord {
  /** Année, saisie sur quatre chiffres. */
  AnneeConstruction?: string | null;
  AnneeDerniereRenovation?: string | null;
  TravauxDerniereRenovation?: string | null;
  DysfonctionnementsBatiment?: string | null;
  PlaintesUtilisateurs?: string | null;
  /** Pression mesurée au point le plus proche du compteur, en bar. */
  PressionProcheCompteur?: number | null;
  PressionEloigneeCompteur?: number | null;
}

export interface QteData {
  Info?: string | null;

  /** Contexte du bâtiment — voir `TableauDeBord`. */
  TableauDeBord?: TableauDeBord;

  /** Robinets — typés explicitement car historiquement les plus anciens. */
  robinets?: Robinet[];

  /**
   * Vestige de l'époque où les sections étaient éditées en JSON brut :
   * localisation et photos y étaient rangées à part, faute d'éléments
   * structurés où les loger. Conservé pour relire les audits existants ;
   * les nouvelles entités portent ces données dans l'élément lui-même.
   */
  Localisations?: Record<string, PlanLocation>;
  PhotosSections?: Record<string, AssetRef[]>;

  /**
   * Les autres clés sont celles du schéma (`audit-schema.ts`) : un tableau
   * d'éléments pour une entité listée, un objet unique pour une entité
   * `single` comme le compteur général.
   */
  [key: string]: unknown;
}

/**
 * Fiche signalétique d'un audit dans le registre.
 *
 * Le registre reste léger : il est relu à chaque démarrage et ne doit pas
 * charger les données complètes de tous les audits.
 */
export interface AuditSummary {
  /** Identité technique stable. Ne change jamais, même si l'adresse change. */
  Id: string;
  /** Adresse telle que saisie, pour l'affichage. */
  Adresse: string;
  /** Adresse normalisée, pour retrouver un audit — jamais une identité. */
  AdresseKey: string;
  Auditeur?: string | null;
  Date?: string | null;
  /** Nom libre donné au projet, pour l'identifier dans la liste des audits. */
  NomProjet?: string | null;
  /** Horodatage ISO de la dernière écriture, pour trier du plus récent. */
  UpdatedAt: string;
}

export interface AppData {
  /** Identité de l'audit, reprise dans le registre. */
  Id?: string;
  Adresse?: string | null;
  /** Forme normalisée de `Adresse`, recalculée à chaque enregistrement. */
  AdresseKey?: string;
  /** Nom libre donné au projet (n'importe pas pour le rapprochement, voir Adresse). */
  NomProjet?: string | null;
  /** Nom du site audité (site et bâtiment), distinct de l'adresse postale. */
  NomSite?: string | null;
  Info?: string | null;
  Date?: string | null;
  Auditeur?: string | null;
  /** Nom et fonction de la personne qui accompagne l'auditeur sur place. */
  Accompagnant?: string | null;
  /** Effectif fréquentant le bâtiment (salariés, élèves, visiteurs…). */
  Effectif?: string | null;
  /** Plans du bâtiment chargés depuis l'accueil, communs à tout l'audit. */
  Plans?: AssetRef[];
  /** Galerie générale de l'audit, indépendante des éléments techniques. */
  Photos?: AssetRef[];
  Qge?: Record<string, unknown>;
  Qte?: QteData;
  Qus?: Record<string, unknown>;

  /**
   * Équipements que l'auditeur a explicitement déclarés absents du bâtiment,
   * pour ne pas afficher leur section sur le tableau de bord de l'audit
   * technique. `false` = absent ; une clé manquante vaut présent, pour ne
   * jamais faire disparaître une section sur un audit déjà commencé.
   *
   * Une section contenant déjà des éléments reste affichée même décochée
   * (voir `QteIndexComponent.isVisible`) : la case ne masque qu'une section
   * vide, jamais une saisie déjà faite.
   *
   * Deux usages subsistent depuis le passage à `UtilisationsEau` :
   *  - les audits commencés avant, qui n'ont pas d'`UtilisationsEau` et
   *    gardent ce régime ;
   *  - les entités **hors classeur** (le surpresseur), qu'aucun usage de l'eau
   *    ne commande : `true` les affiche, et une clé absente vaut ici
   *    « masqué », puisque le classeur V3 ne les décrit plus.
   */
  EquipementsPresents?: Record<string, boolean>;

  /**
   * Utilisations de l'eau cochées sur l'accueil du projet, par clé
   * d'utilisation (voir `utilisations-eau.ts`).
   *
   * Le classeur raisonne en **usages** (« lavage vaisselle », « eau chaude
   * sanitaire »), l'application affichait jusqu'ici des **équipements** tirés
   * du schéma. Ce n'est pas la même liste : un usage peut commander deux
   * sections, trois usages peuvent commander la même. `EquipementsPresents`
   * reste lu pour les audits saisis avant ce changement.
   *
   * Une clé absente vaut « non coché » — à l'inverse d'`EquipementsPresents`,
   * où l'absence valait « présent ». Le classeur part d'un formulaire vierge
   * et demande à l'auditeur de déclarer ce qu'il voit.
   */
  UtilisationsEau?: Record<string, boolean>;

  /**
   * Documents que l'auditeur a pu récupérer, par identifiant de document
   * (voir `documents-collectes.ts`, généré depuis le classeur).
   *
   * `precision` ne sert qu'aux lignes libres « Autre, préciser : ».
   */
  Documents?: Record<string, { coche?: boolean; precision?: string | null }>;

  /**
   * Niveau de remplissage des fiches de l'audit technique, d'après le
   * `requirement` de chaque champ (V3 du classeur). Une valeur absente vaut
   * `'complet'` : un audit déjà commencé ne doit jamais voir des champs déjà
   * remplis se masquer sans que l'auditeur l'ait choisi.
   *
   * `'complet'` affiche tous les champs ; `'allege'` seulement les champs
   * `obligatoire`/`recommande` ; `'minimal'` les seuls `obligatoire`. Dans
   * tous les cas, un champ masqué déjà rempli reste consultable depuis le
   * volet dépliable de la fiche (voir `EntityFormComponent`), et un champ
   * `obligatoire` est exigé à la validation quel que soit le niveau choisi —
   * pourvu que son bloc concerne l'élément (voir `BlocConditionnel`).
   */
  NiveauRemplissage?: NiveauRemplissage;
}
