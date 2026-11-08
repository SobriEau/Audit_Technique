import { AuditEntity } from '../models/data.models';
import { FieldDef } from '../models/field.models';

/**
 * Valeur d'un champ telle qu'une cellule de tableau la montre.
 *
 * Partagée par la liste d'une entité (`entity-list`) et par la page d'une
 * pièce (`piece-detail`), qui affichent les mêmes tableaux : un renvoi vers
 * une autre fiche, un oui/non ou un choix multiple doivent s'y lire de la même
 * façon.
 *
 * @param resoudre retrouve l'élément désigné par un renvoi (`entity-ref`),
 * pour en afficher le numéro plutôt que son identité technique. Un renvoi dont
 * la cible a disparu est signalé, et non laissé vide : la valeur est toujours
 * dans le JSON, c'est la cible qui manque.
 */
export function valeurAffichee(
  item: AuditEntity,
  field: FieldDef,
  resoudre: (entite: string, id: string) => AuditEntity | undefined
): string {
  const v = (item as Record<string, unknown>)[field.key];
  if (v === null || v === undefined || v === '') return '';

  if (Array.isArray(v)) return v.filter((x) => typeof x === 'string').join(', ');
  if (field.kind === 'boolean') return v ? 'Oui' : 'Non';

  if (field.kind === 'entity-ref' && field.refTo) {
    const cible = resoudre(field.refTo, String(v));
    return cible ? `n° ${cible.Numero ?? '?'}` : '(élément supprimé)';
  }

  return String(v);
}
