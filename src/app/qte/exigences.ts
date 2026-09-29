import { BlocConditionnel, EntityDef, FieldDef, FieldRequirement } from '../models/field.models';
import { NiveauRemplissage } from '../models/data.models';

/**
 * Exigence des champs d'une fiche : ce qui est affiché selon le niveau de
 * remplissage, et ce qui doit être rempli pour valider.
 *
 * Fonctions pures, sans Angular : c'est ce qui permet d'en éprouver les règles
 * contre le schéma réel, hors navigateur (`tools/check-exigences.js`). Une
 * validation bloquante mal réglée empêche l'auditeur d'enregistrer — ce n'est
 * pas une règle qu'on vérifie à l'œil.
 */

export const NIVEAU_LABELS: Record<NiveauRemplissage, string> = {
  complet: 'Complet',
  allege: 'Allégée',
  minimal: 'Minimale',
};

/**
 * Un champ est visible à un niveau de remplissage donné d'après son
 * `requirement`. Un champ sans `requirement` (le classeur ne dit rien, ou
 * l'onglet a disparu) est traité comme `facultatif` : masqué dès qu'on quitte
 * le niveau complet, jamais exigé à la validation.
 */
export function requirementVisible(
  req: FieldRequirement | undefined,
  niveau: NiveauRemplissage
): boolean {
  if (niveau === 'complet') return true;
  if (niveau === 'allege') return req === 'obligatoire' || req === 'recommande';
  return req === 'obligatoire';
}

/**
 * Un champ sans valeur : chaîne vide (après espaces), `null`/`undefined`,
 * choix multiple sans case cochée, tableau de mesures sans aucune saisie.
 * `0` et `false` comptent comme répondus — « Non » est une réponse.
 */
export function estVide(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.every((x) => estVide(x));
  if (typeof v === 'object') return Object.values(v as object).every((x) => estVide(x));
  return false;
}

/** Champs de saisie, hors photos et plan qui ont leur propre bloc. */
function saisissables(def: EntityDef): FieldDef[] {
  return def.fields.filter((f) => f.kind !== 'photos' && f.kind !== 'plan');
}

/** La valeur du champ de commande — simple ou à choix multiple — en fait-elle partie ? */
function commandeCorrespond(v: unknown, valeurs: readonly (string | boolean)[]): boolean {
  if (Array.isArray(v)) return v.some((x) => valeurs.includes(x as string));
  if (typeof v === 'string' || typeof v === 'boolean') return valeurs.includes(v);
  return false;
}

/**
 * Le bloc de ce champ concerne-t-il l'élément ?
 *
 * Oui s'il n'appartient à aucun bloc conditionnel. Sinon, seulement si le
 * champ qui commande le bloc porte une des valeurs déclarées — un lave-linge
 * n'a pas de champs d'autolaveuse à remplir. Un champ de commande encore vide
 * rend le bloc inactif : c'est ce champ-là, obligatoire, qui sera demandé
 * d'abord.
 *
 * Un bloc désigne un intitulé de premier niveau (`bloc`) ou une section : le
 * bouclage d'un réseau ECS n'est qu'une section. Un champ peut relever des
 * deux ; il faut alors que chacun soit actif. Le champ qui commande n'est
 * jamais masqué par son propre bloc — « Bouclage » ouvre la section
 * « Bouclage du réseau ECS » dont il fait partie.
 */
export function blocActif(def: EntityDef, f: FieldDef, item: Record<string, unknown>): boolean {
  const groupes = new Map<string, BlocConditionnel[]>();
  for (const b of def.blocsConditionnels ?? []) {
    if (b.champ === f.key) continue;
    if (b.bloc !== f.bloc && b.bloc !== f.section) continue;
    groupes.set(b.bloc, [...(groupes.get(b.bloc) ?? []), b]);
  }
  for (const regles of groupes.values()) {
    if (!regles.some((b) => commandeCorrespond(item[b.champ], b.valeurs))) return false;
  }
  return true;
}

/**
 * Champs obligatoires restés vides, à compléter avant d'enregistrer.
 *
 * Exigés quel que soit le niveau de remplissage — sans quoi choisir
 * « Minimale » permettrait de valider une fiche sans ses champs les plus
 * nécessaires — mais **seulement dans les blocs qui concernent l'élément**.
 * Sans cette restriction, la validation reprise d'origin/main exigeait les
 * champs de l'autolaveuse pour enregistrer un lave-linge, et ceux de la
 * baignoire pour une douche : la fiche ne pouvait tout simplement pas être
 * validée sans inventer des réponses. Voir `MAJ/done/fusion-origin-main.md`.
 */
export function champsManquants(def: EntityDef, item: Record<string, unknown>): FieldDef[] {
  return saisissables(def).filter(
    (f) => f.requirement === 'obligatoire' && blocActif(def, f, item) && estVide(item[f.key])
  );
}

/**
 * Champs masqués par le niveau de remplissage, hormis ceux révélés à la main.
 * Ceux d'un bloc inactif n'y figurent pas : ils ne concernent pas l'élément.
 */
export function champsMasques(
  def: EntityDef,
  niveau: NiveauRemplissage,
  reveles: ReadonlySet<string>,
  item: Record<string, unknown>
): FieldDef[] {
  return saisissables(def).filter(
    (f) => !requirementVisible(f.requirement, niveau) && !reveles.has(f.key) && blocActif(def, f, item)
  );
}
