/**
 * Utilisations de l'eau déclarées sur l'accueil du projet, et sections
 * qu'elles font apparaître dans l'audit technique.
 *
 * Source : onglet « Généralités » du classeur, cellule B33 (« Cocher toutes
 * les utilisations de l'eau présentes dans le bâtiment ») et sa note, qui
 * énonce les règles d'affichage.
 *
 * **Curé à la main, comme `value-lists.ts`.** Le classeur nomme des *usages*,
 * le schéma des *entités* : la correspondance n'est ni bijective ni
 * déductible. Trois usages de lavage commandent la même section, un seul usage
 * (l'eau chaude sanitaire) en commande deux, et sept sections ne dépendent
 * d'aucun usage. Générer cette table depuis le classeur reviendrait à
 * réinventer ces arbitrages à chaque régénération.
 *
 * Ce que la note B33 prescrit, mot pour mot :
 *
 * > Par la suite, n'afficher que les onglets qui ont été cochés.
 * > Dès que lavage vaisselle, lavage textile ou lavage sol a été coché, il
 * > faut afficher l'onglet « Appareils de lavage ».
 * > Dès que « eau chaude sanitaire » est cochée, les onglets « Réseaux ECS »
 * > et « Production/stockage ECS » sont affichés.
 * > Les onglets non demandés sont affichés de manière systématique : compteur,
 * > sous-compteur, toiture, structure, ventilation, opportunités, autre.
 */

export interface UtilisationEau {
  /** Clé de stockage sous `AppData.UtilisationsEau`. Ne jamais la renommer. */
  key: string;
  /** Libellé de la case, repris du classeur. */
  label: string;
  /** Clés d'entités que cette utilisation fait apparaître. */
  sections: string[];
}

/**
 * Les dix cases du classeur, dans l'ordre de lecture de sa grille
 * (Généralités B34:G35).
 */
export const UTILISATIONS_EAU: UtilisationEau[] = [
  { key: 'wc', label: 'WC', sections: ['wc'] },
  { key: 'douche_baignoire', label: 'Douche-baignoire', sections: ['douches_baignoires'] },
  { key: 'espace_exterieur', label: 'Espace extérieur', sections: ['espace_vert_exterieur'] },
  { key: 'piscine', label: 'Piscine', sections: ['piscines'] },
  { key: 'incendie', label: 'Incendie', sections: ['incendie'] },
  { key: 'robinet', label: 'Robinet', sections: ['robinets'] },
  { key: 'lavage_vaisselle', label: 'Lavage vaisselle', sections: ['appareils_lavage'] },
  { key: 'lavage_textile', label: 'Lavage textile', sections: ['appareils_lavage'] },
  { key: 'lavage_sol', label: 'Lavage du sol', sections: ['appareils_lavage'] },
  {
    key: 'eau_chaude_sanitaire',
    label: 'Eau chaude sanitaire',
    sections: ['reseaux_eau_chaude_sanitaire', 'production_stockage_ecs'],
  },
];

/**
 * Sections affichées quoi qu'il arrive : elles ne dépendent d'aucun usage
 * déclaré, tout bâtiment étant concerné.
 */
export const SECTIONS_TOUJOURS_VISIBLES = [
  'releve_compteur_general',
  'sous_compteurs',
  'toitures',
  'structure',
  'ventilation_batiment',
  'opportunites',
  'autre',
];

/** Sections rendues visibles par les utilisations cochées. */
export function sectionsDemandees(cochees: Record<string, boolean> | undefined): Set<string> {
  const out = new Set(SECTIONS_TOUJOURS_VISIBLES);
  for (const u of UTILISATIONS_EAU) {
    if (cochees?.[u.key]) for (const s of u.sections) out.add(s);
  }
  return out;
}
