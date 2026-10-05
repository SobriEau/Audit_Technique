import { FieldDef } from './field.models';

/**
 * Contexte du bâtiment, décrit par le classeur en tête du tableau de bord
 * (lignes 7 à 23). Ces champs ne sont pas dans `audit-schema.ts` : ils
 * n'appartiennent à aucune fiche d'équipement, et ce fichier est généré.
 *
 * Ils passent malgré tout par `app-audit-field`, qui sait déjà rendre une
 * pastille d'exigence, une aide et une unité — les redécrire en HTML
 * ferait diverger leur apparence de celle des fiches.
 *
 * Rangés ici, hors du composant, parce que l'export CSV en reprend les
 * libellés et les unités (`csv-export.ts`).
 */
export const CHAMPS_CONTEXTE: FieldDef[] = [
  {
    key: 'AnneeConstruction',
    label: 'Date de construction du bâtiment',
    kind: 'text',
    row: 7,
    help: 'Année sur quatre chiffres (AAAA).',
    requirement: 'recommande',
    source: 'Tableau de bord!B7',
  },
  {
    key: 'AnneeDerniereRenovation',
    label: 'Date de la dernière rénovation',
    kind: 'text',
    row: 8,
    help: 'Année sur quatre chiffres (AAAA).',
    requirement: 'facultatif',
    source: 'Tableau de bord!B8',
  },
  {
    key: 'TravauxDerniereRenovation',
    label: 'Travaux réalisés lors de la dernière rénovation',
    kind: 'textarea',
    row: 9,
    wide: true,
    requirement: 'facultatif',
    source: 'Tableau de bord!B9',
  },
  {
    key: 'DysfonctionnementsBatiment',
    label: 'Principaux dysfonctionnements observés sur le bâtiment',
    kind: 'textarea',
    row: 14,
    wide: true,
    help: 'Interventions régulières, pannes qui reviennent.',
    requirement: 'facultatif',
    source: 'Tableau de bord!B14',
  },
  {
    key: 'PlaintesUtilisateurs',
    label: 'Plaintes récurrentes des utilisateurs du bâtiment',
    kind: 'textarea',
    row: 18,
    wide: true,
    requirement: 'facultatif',
    source: 'Tableau de bord!B18',
  },
  {
    key: 'PressionProcheCompteur',
    label: 'Mesure de pression au point le plus proche du compteur',
    kind: 'number',
    unit: 'bar',
    row: 22,
    requirement: 'recommande',
    source: 'Tableau de bord!B22',
  },
  {
    key: 'PressionEloigneeCompteur',
    label: 'Mesure de pression au point le plus éloigné du compteur',
    kind: 'number',
    unit: 'bar',
    row: 23,
    requirement: 'recommande',
    source: 'Tableau de bord!B23',
  },
];
