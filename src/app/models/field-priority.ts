/**
 * Priorité de remplissage d'un champ, affichée en pastille à côté de son
 * libellé (`audit-field`). Curée à la main, comme `value-lists.ts` : ce n'est
 * pas une donnée du classeur, et `audit-schema.ts` ne doit pas en gagner une
 * en dur (il est généré, voir tools/README.md).
 *
 * Table indexée par la seule clé du champ (`FieldDef.key`), pas par entité :
 * la plupart des champs à prioriser (Emplacement, Débit…) sont partagés par
 * plusieurs onglets sous la même clé. Un champ absent de cette table n'affiche
 * aucune pastille — c'est le cas par défaut, pas une priorité « basse ».
 *
 * Palette volontairement en dégradé d'orange, jamais rouge/vert : un badge de
 * priorité ne doit pas se confondre avec un état d'erreur ou de validation
 * (retour Sacha, réunion KAPT du 260818).
 */
export type Priority = 'basse' | 'moyenne' | 'haute';

export const FIELD_PRIORITY: Record<string, Priority> = {
  Emplacement: 'haute',
};
