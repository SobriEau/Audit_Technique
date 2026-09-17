import { FieldRequirement } from './field.models';

/**
 * Pastille d'exigence affichée après l'intitulé d'un champ.
 *
 * La donnée est `FieldDef.requirement`, tirée du classeur V3 ; ce module n'en
 * porte que la présentation. Il remplaçait auparavant une table curée à la main
 * (`FIELD_PRIORITY`, une seule entrée : `Emplacement: 'haute'`) en attendant que
 * le classeur fournisse l'information — ce qu'il fait depuis la V3, pour chaque
 * question. Garder les deux affichait un même champ avec « Priorité : haute »
 * **et** « Obligatoire » ; voir `fusion-origin-main.md`.
 *
 * Palette volontairement en dégradé d'orange, du plus léger au plus appuyé —
 * facultatif, recommandé, obligatoire — jamais rouge ni vert : une exigence ne
 * doit pas se lire comme une erreur ou une validation (retour Sacha, réunion
 * KAPT du 260818). Le rouge reste réservé à l'encadré des champs obligatoires
 * manquants, qui est, lui, une erreur.
 */
export const REQUIREMENT_LABEL: Record<FieldRequirement, string> = {
  obligatoire: 'Obligatoire',
  recommande: 'Recommandé',
  facultatif: 'Facultatif',
};
