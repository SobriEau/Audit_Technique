/**
 * Description déclarative des formulaires d'audit.
 *
 * Les entités de la partie technique partagent le même motif « liste puis
 * fiche ». Plutôt que de dupliquer vingt composants, chaque entité est décrite
 * ici en données et rendue par les composants génériques `entity-list` et
 * `entity-form`. Ajouter un champ ou une entité se fait dans le schéma, pas
 * dans un gabarit.
 */

/**
 * Niveau d'exigence d'un champ, tel que le classeur V3 le note dans une
 * cellule voisine du libellé : 481 cellules, trois valeurs, aucune variante.
 *
 * **Une seule donnée, trois usages** :
 *  - la **pastille** affichée après l'intitulé (`audit-field`) ;
 *  - le **niveau de remplissage** choisi sur l'accueil du projet, qui masque
 *    les champs les moins exigés (`AppData.NiveauRemplissage`) ;
 *  - la **validation** d'une fiche, qui exige les champs `obligatoire`.
 *
 * Deux migrations V3 menées en parallèle en avaient fait deux notions — une
 * `priority` affichée en pastille, un `requirement` affiché en badge neutre et
 * pilotant la validation — portant exactement les mêmes valeurs, tirées des
 * mêmes cellules. Un champ en montrait alors deux à la suite. Voir
 * `fusion-origin-main.md`.
 *
 * Un champ sans `requirement` (le classeur ne dit rien, ou l'onglet a disparu)
 * n'affiche aucune pastille, est traité comme `facultatif` pour le filtrage, et
 * n'est jamais exigé. L'absence n'est pas un quatrième niveau : la distinguer
 * garde la trace des questions que le classeur n'a pas arbitrées.
 */
export type FieldRequirement = 'obligatoire' | 'recommande' | 'facultatif';

/** Nature de la saisie, qui détermine le composant partagé utilisé. */
export type FieldKind =
  | 'text' // texte court
  | 'textarea' // texte long
  | 'rich' // texte mis en forme (app-rich-editor)
  | 'number' // nombre, avec unité facultative
  | 'select' // choix dans une liste du référentiel
  | 'boolean' // Oui / Non
  | 'entity-ref' // référence vers un autre élément de l'audit
  | 'photos' // galerie (app-photo-editor)
  | 'plan'; // localisation sur plan (app-plan-locator)

export interface FieldDef {
  /** Clé de stockage dans le JSON de l'audit. Ne jamais la renommer à la légère. */
  key: string;
  label: string;
  kind: FieldKind;

  /** Valeurs autorisées, pour `select`. Issues de `value-lists.ts`. */
  options?: readonly string[];

  /** Unité affichée à côté d'un `number` (L/min, mm, m3…). */
  unit?: string;

  /** Entité cible d'un `entity-ref` (clé d'une EntityDef). */
  refTo?: string;

  /**
   * Numéro de ligne dans le tableau du classeur.
   *
   * C'est la **mise en page prescrite** : les champs partageant cette valeur
   * sont affichés côte à côte, dans l'ordre de leurs colonnes Excel. Le nombre
   * de champs par ligne varie donc d'une ligne à l'autre (un, deux ou trois),
   * exactement comme dans le classeur.
   */
  row?: number;

  /** Le champ occupe toute la largeur, quelle que soit sa ligne. */
  wide?: boolean;

  /**
   * Intitulé du bloc auquel le champ appartient (« Localisation »,
   * « Lave linge — Caractéristiques »…), repris du classeur.
   *
   * Découpe la fiche en sections, **au-dessus** du groupement par `row` : les
   * champs d'une même ligne restent côte à côte, les sections ne font que les
   * rassembler par blocs. Absent pour les champs qui précèdent le premier
   * intitulé de la fiche — ils forment un bloc de tête sans titre, plutôt
   * qu'un titre inventé.
   */
  section?: string;

  /**
   * Intitulé de premier niveau englobant la section — « Lave linge »,
   * « Douche », « Réducteur de pression ». Absent quand la section n'est pas
   * imbriquée. Sert à rattacher un champ à un bloc conditionnel
   * (`EntityDef.blocsConditionnels`).
   */
  bloc?: string;

  /** Niveau d'exigence du classeur. Voir `FieldRequirement`. */
  requirement?: FieldRequirement;

  /** Aide affichée sous le champ, reprise de la note du classeur. */
  help?: string;

  /** Cellule d'origine dans `audit_technique.xlsx`, pour retrouver la source. */
  source?: string;

  /** Divergence ou question laissée ouverte par les auteurs du classeur. */
  warn?: string;
}

/**
 * Bloc d'une fiche qui ne concerne l'élément que sous condition.
 *
 * Le classeur décrit plusieurs objets sur une même fiche : les quatre types
 * d'appareils de lavage, la douche et la baignoire, le réducteur de pression
 * du compteur général. Chaque bloc a ses champs obligatoires — et un lave-linge
 * ne peut pas remplir ceux de l'autolaveuse.
 *
 * Aujourd'hui, seule la **validation** en tient compte : un champ obligatoire
 * n'est exigé que si son bloc est actif. Masquer les blocs inactifs est
 * l'affichage conditionnel, reporté à une passe ultérieure (`arbitrages-v3.md`,
 * Q17) ; cette table en est le point de départ.
 */
export interface BlocConditionnel {
  /** Intitulé du bloc, tel que `FieldDef.bloc` le porte. */
  bloc: string;
  /** Clé du champ qui commande le bloc. */
  champ: string;
  /** Valeurs de ce champ qui rendent le bloc actif. */
  valeurs: readonly (string | boolean)[];
  /** Cellule du classeur qui énonce la règle. */
  source: string;
}

export interface EntityDef {
  /** Clé de stockage sous `AppData.Qte`. */
  key: string;
  /** Segment d'URL : `#/qte/<route>` et `#/qte/<route>/<Id>`. */
  route: string;
  singular: string;
  plural: string;

  /**
   * Entité unique (une seule fiche, pas de liste) : compteur général,
   * collecte d'eau de pluie.
   */
  single?: boolean;

  /**
   * Cette entité est rendue **en tête de la page d'une autre**, dont la clé est
   * donnée ici, et n'apparaît pas comme une section du tableau de bord.
   *
   * Un seul cas : la zone piscine (pédiluve, nettoyage des plages), que le
   * classeur décrit sur l'onglet « Liste Piscines » parce qu'elle vaut pour
   * l'ensemble des bassins et non pour chacun d'eux.
   */
  embedded?: string;

  /** Clé de l'entité à rendre en tête de cette liste. Réciproque d'`embedded`. */
  preambule?: string;

  /**
   * L'onglet de cette entité a disparu du classeur ; ses champs sont figés
   * depuis la dernière version qui la décrivait. Un seul cas : le surpresseur,
   * conservé depuis la V2 et masqué par défaut sur l'accueil du projet.
   */
  horsClasseur?: boolean;

  /** Blocs de la fiche qui ne valent que sous condition. */
  blocsConditionnels?: readonly BlocConditionnel[];

  /** Clés de champs affichées en colonnes de la page liste. */
  listColumns: string[];

  fields: FieldDef[];
}

/** Champs communs à toute fiche, ajoutés automatiquement par le moteur. */
export const COMMON_FIELDS: FieldDef[] = [
  { key: 'Photos', label: 'Photos', kind: 'photos', wide: true },
];
