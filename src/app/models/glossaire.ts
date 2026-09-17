/**
 * Glossaire de l'audit — GÉNÉRÉ depuis `audit_technique.xlsx`.
 *
 * Repris mot pour mot du bas de l'onglet « Tableau de bord ». Six entrées ne
 * sont pas des sigles mais des notions (« Plénum », « Eau de ruissellement »)
 * — d'où le titre « Glossaire » plutôt que « Sigles ».
 *
 * Régénérer avec `node tools/gen-pages.js`. Ne pas éditer à la main.
 */
export interface EntreeGlossaire {
  terme: string;
  definition: string;
}

export const GLOSSAIRE: EntreeGlossaire[] = [
  { terme: "ABF", definition: "Architectes des Bâtiments de France" },
  { terme: "CTA", definition: "Centrale de Traitement d'Air" },
  { terme: "CVC", definition: "Chauffage Ventilation Climatisation" },
  { terme: "DN", definition: "Diamètre Nominal" },
  { terme: "DOE", definition: "Dossier des Ouvrages Exécutés" },
  { terme: "Eau de pluie", definition: "Eau de pluie qui tombe sur le toit et n'est pas souillée" },
  { terme: "Eau de ruissellement", definition: "Eau de pluie qui tombe sur une surface extérieure et qui ruisselle vers un exutoire ou une zone d'infiltration" },
  { terme: "Eau de surface", definition: "Eau des cours d'eau et lacs" },
  { terme: "eau NC", definition: "eau non conventionnelle" },
  { terme: "Eau souterraine", definition: "Eau brute que l'on a puisé via un forage local privé" },
  { terme: "ECS", definition: "Eau Chaude Sanitaire" },
  { terme: "EFS", definition: "Eau Froide Sanitaire" },
  { terme: "EPDM", definition: "Ethylène-Propylène-Diène Monomère" },
  { terme: "EU", definition: "Eaux Usées" },
  { terme: "GTB", definition: "Gestion Technique du Bâtiment" },
  { terme: "GTC", definition: "Gestion Technique Centralisée" },
  { terme: "IRDEFA", definition: "Installation de Refroidissement par Dispersion d'Eau dans un Flux d'Air" },
  { terme: "PAC", definition: "Pompe A Chaleur" },
  { terme: "PE", definition: "Polyéthylène" },
  { terme: "PEHD", definition: "Polyéthylène Haute Densité" },
  { terme: "PER", definition: "Polyéthylène Réticulé" },
  { terme: "Plénum", definition: "Espace vide situé entre un faux plafond et la dalle d'un plancher ou entre un faux plancher et le sol" },
  { terme: "PMR", definition: "Personne à Mobilité Réduite" },
  { terme: "PVC", definition: "Polychlorure de Vinyle" },
  { terme: "RFID", definition: "Radio Frequency Identification" },
  { terme: "RIA", definition: "Robinet d'Incendie Armé" },
  { terme: "Sprinkler", definition: "Système d'extinction automatique à eau fixé au plafond (gicleur)" },
  { terme: "VMC", definition: "Ventilation Mécanique Contrôlée" },
  { terme: "VRD", definition: "Voiries et Réseaux Divers" },
  { terme: "WC", definition: "Water Closet = Toilettes" },
];
