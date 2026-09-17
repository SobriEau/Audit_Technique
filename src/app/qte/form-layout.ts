import { FieldDef } from '../models/field.models';

/**
 * Mise en page d'un formulaire d'audit, telle que le classeur la prescrit.
 *
 * Deux niveaux se superposent, et il ne faut pas les confondre :
 *
 *  - **la ligne** (`FieldDef.row`) reproduit la ligne du tableau Excel. Les
 *    champs qui la partagent sont rendus côte à côte — « Commande /
 *    Temporisation / Cool-start » sur une ligne, « Débit / Présence d'un
 *    réducteur » sur la suivante. Ce n'est pas un remplissage automatique :
 *    une grille `auto-fit` alignerait les champs mécaniquement et perdrait
 *    cet appariement.
 *  - **la section** (`FieldDef.section`) découpe la fiche en blocs. Une fiche
 *    peut compter 77 champs ; d'un seul tenant, elle est illisible.
 *
 * Partagé par la fiche (`entity-form`) et par le préambule de la page
 * « Piscines » (`entity-list`), qui rend la zone commune aux bassins.
 */
export interface FormSection {
  /** Intitulé du classeur, ou `null` pour le bloc de tête qui n'en a pas. */
  title: string | null;
  rows: FieldDef[][];
  /** Le plan de localisation s'insère à la fin de ce bloc. */
  withLocator: boolean;
}

/**
 * Regroupe les champs par ligne du classeur, en conservant leur ordre.
 *
 * Un champ marqué `wide`, ou dépourvu de `row`, occupe sa propre ligne. Les
 * autres se répartissent la largeur de la ligne qu'ils partagent.
 */
export function groupByRow(fields: FieldDef[]): FieldDef[][] {
  const rows: FieldDef[][] = [];
  let currentRow: number | null = null;

  for (const f of fields) {
    if (f.wide || f.row === undefined) {
      rows.push([f]);
      currentRow = null;
      continue;
    }
    if (f.row !== currentRow) {
      rows.push([f]);
      currentRow = f.row;
    } else {
      rows[rows.length - 1].push(f);
    }
  }
  return rows;
}

/**
 * Découpe les lignes en blocs, selon les sections du classeur.
 *
 * Le découpage vient **par-dessus** le groupement par ligne, il ne le remplace
 * pas : les champs qui partagent une ligne restent côte à côte à l'intérieur
 * de leur bloc.
 */
export function buildSections(fields: FieldDef[]): FormSection[] {
  const blocs: FormSection[] = [];

  for (const row of groupByRow(fields)) {
    const titre = row[0]?.section ?? null;
    const dernier = blocs[blocs.length - 1];
    if (dernier && dernier.title === titre) dernier.rows.push(row);
    else blocs.push({ title: titre, rows: [row], withLocator: false });
  }

  return blocs;
}

/** Champs à rendre dans le formulaire : photos et plan ont leur propre bloc. */
export function formFields(fields: FieldDef[]): FieldDef[] {
  return fields.filter((f) => f.kind !== 'photos' && f.kind !== 'plan');
}
