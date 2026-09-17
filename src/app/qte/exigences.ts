import { EntityDef, FieldDef, FieldRequirement } from '../models/field.models';
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
 * Un champ sans valeur : chaîne vide (après espaces) ou `null`/`undefined`.
 * `0` et `false` comptent comme répondus — « Non » est une réponse.
 */
export function estVide(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  return false;
}

/** Champs de saisie, hors photos et plan qui ont leur propre bloc. */
function saisissables(def: EntityDef): FieldDef[] {
  return def.fields.filter((f) => f.kind !== 'photos' && f.kind !== 'plan');
}

/**
 * Le bloc de ce champ concerne-t-il l'élément ?
 *
 * Oui s'il n'appartient à aucun bloc conditionnel. Sinon, seulement si le
 * champ qui commande le bloc porte une des valeurs déclarées — un lave-linge
 * n'a pas de champs d'autolaveuse à remplir. Un champ de commande encore vide
 * rend le bloc inactif : c'est ce champ-là, obligatoire, qui sera demandé
 * d'abord.
 */
export function blocActif(def: EntityDef, f: FieldDef, item: Record<string, unknown>): boolean {
  if (!f.bloc) return true;
  const regles = (def.blocsConditionnels ?? []).filter((b) => b.bloc === f.bloc);
  if (!regles.length) return true;
  return regles.some((b) => b.valeurs.includes(item[b.champ] as string | boolean));
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
 * validée sans inventer des réponses. Voir `fusion-origin-main.md`.
 */
export function champsManquants(def: EntityDef, item: Record<string, unknown>): FieldDef[] {
  return saisissables(def).filter(
    (f) => f.requirement === 'obligatoire' && blocActif(def, f, item) && estVide(item[f.key])
  );
}

/** Champs masqués par le niveau de remplissage, hormis ceux révélés à la main. */
export function champsMasques(
  def: EntityDef,
  niveau: NiveauRemplissage,
  reveles: ReadonlySet<string>
): FieldDef[] {
  return saisissables(def).filter(
    (f) => !requirementVisible(f.requirement, niveau) && !reveles.has(f.key)
  );
}
