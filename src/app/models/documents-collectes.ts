import { FieldRequirement } from './field.models';

/**
 * Documents à réunir avant ou pendant la visite — GÉNÉRÉ depuis
 * `audit_technique.xlsx`, onglet « Documents collectés ».
 *
 * Le classeur n'attend **aucun téléversement** : seulement une case cochée
 * quand le document a pu être récupéré. La V2 demandait encore « prise de
 * photo et ajout au dossier » ; la V3 a retiré cette note.
 *
 * L'`id` est stable et **ne dérive pas du libellé** : reformuler un intitulé
 * dans le classeur ne doit pas décocher la case d'un audit déjà rempli.
 *
 * Régénérer avec `node tools/gen-pages.js`. Ne pas éditer à la main.
 */
export interface DocumentACollecter {
  /** Identité stable, indépendante du libellé. */
  id: string;
  libelle: string;
  /** Ligne libre « Autre, préciser : » plutôt qu'une case à cocher. */
  libre: boolean;
  requirement?: FieldRequirement;
}

export const DOCUMENTS_A_COLLECTER: DocumentACollecter[] = [
  { id: "doc-08", libelle: "Plan du bâtiment le plus à jour à votre disposition (ex : plan de recollement présent dans le Dossier des Ouvrages Exécutés - DOE; plan d’évacuation incendie…)", libre: false, requirement: "obligatoire" },
  { id: "doc-10", libelle: "Plan Chauffage-Ventilation-Climatisation (CVC)", libre: false, requirement: "recommande" },
  { id: "doc-12", libelle: "Plan plomberie intérieur (EFS, ECS, EU)", libre: false, requirement: "recommande" },
  { id: "doc-14", libelle: "Plan VRD avec eaux usées et eaux pluviales", libre: false, requirement: "recommande" },
  { id: "doc-16", libelle: "Dossier Technique Amiante", libre: false, requirement: "recommande" },
  { id: "doc-18", libelle: "Plan des toitures", libre: false, requirement: "facultatif" },
  { id: "doc-20", libelle: "Factures d’eau des 3 dernières années", libre: false, requirement: "obligatoire" },
  { id: "doc-22", libelle: "Export de la télérelève sur les 3 dernières années", libre: false },
  { id: "doc-24", libelle: "Données issues des sous-compteurs d’eau sur les 3 dernières années si existant", libre: false, requirement: "facultatif" },
  { id: "doc-26", libelle: "Factures d’énergie (électricité, fioul, biomasse, gaz, solaire, réseau de chaleur…) des 3 dernières années", libre: false, requirement: "obligatoire" },
  { id: "doc-28", libelle: "Planning d’occupation du bâtiment : horaires d’ouverture / fermeture du bâtiment ; planning du personnel si pertinent", libre: false, requirement: "obligatoire" },
  { id: "doc-30", libelle: "Tableau de données annuelles de fréquentation (visiteurs, spectateurs, etc.)", libre: false, requirement: "obligatoire" },
  { id: "doc-32", libelle: "Etude de sol réalisée sur la parcelle", libre: false, requirement: "facultatif" },
  { id: "doc-34", libelle: "Contraintes ABF sur le secteur", libre: false, requirement: "facultatif" },
  { id: "autre-1", libelle: "Autre, préciser :", libre: true },
  { id: "autre-2", libelle: "Autre, préciser :", libre: true },
  { id: "autre-3", libelle: "Autre, préciser :", libre: true },
  { id: "autre-4", libelle: "Autre, préciser :", libre: true },
  { id: "autre-5", libelle: "Autre, préciser :", libre: true },
  { id: "autre-6", libelle: "Autre, préciser :", libre: true },
];
