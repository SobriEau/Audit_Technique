/**
 * Description déclarative des formulaires d'audit.
 *
 * Les dix entités de la partie technique partagent le même motif « liste puis
 * fiche ». Plutôt que de dupliquer vingt composants, chaque entité est décrite
 * ici en données et rendue par les composants génériques `entity-list` et
 * `entity-form`. Ajouter un champ ou une entité se fait dans le schéma, pas
 * dans un gabarit.
 */

/**
 * Niveau de remplissage attendu pour un champ, tel que noté dans le classeur
 * (V3, 2026-08-21 — colonne voisine du libellé). Pilote le filtrage par
 * niveau de remplissage (voir `AppData.NiveauRemplissage`) et, pour
 * `obligatoire`, la validation à l'enregistrement d'une fiche.
 *
 * Sans rapport avec `Priority` (`field-priority.ts`) : celle-ci est un badge
 * visuel curé à la main, délibérément indépendant de toute notion de
 * validation. Un champ absent du classeur V3 (onglet disparu, ancien champ
 * jamais reclassé) n'a pas de `requirement` : il est alors traité comme
 * `facultatif` pour l'affichage, et jamais exigé à la validation.
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

  /** Aide affichée sous le champ, reprise de la note du classeur. */
  help?: string;

  /** Cellule d'origine dans `audit_technique.xlsx`, pour retrouver la source. */
  source?: string;

  /** Divergence ou question laissée ouverte par les auteurs du classeur. */
  warn?: string;

  /** Niveau de remplissage attendu (V3 du classeur). Voir `FieldRequirement`. */
  requirement?: FieldRequirement;
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

  /** Clés de champs affichées en colonnes de la page liste. */
  listColumns: string[];

  fields: FieldDef[];
}

/** Champs communs à toute fiche, ajoutés automatiquement par le moteur. */
export const COMMON_FIELDS: FieldDef[] = [
  { key: 'Photos', label: 'Photos', kind: 'photos', wide: true },
];
