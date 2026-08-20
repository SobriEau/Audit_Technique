/**
 * Référentiel des listes de valeurs de l'audit technique.
 *
 * Source : `audit_technique.xlsx`. Le classeur ne porte aucune validation de
 * données ; les valeurs sont décrites en toutes lettres dans les notes de
 * cellules. Voir `docs/audit/referentiel-listes.md`.
 *
 * ⚠️ **Ces constantes datent de la V1 du classeur et n'ont pas été mises à
 * jour pour la V2 (régénération du 2026-08).** La V2 a reformulé la plupart
 * des énumérations (options ajoutées, retirées ou renommées) : aucune ne
 * correspond plus exactement aux ~190 listes désormais présentes dans les
 * notes du classeur, donc `gen-schema.js` ne les référence plus — il inline
 * chaque liste directement dans `audit-schema.ts`, ce qui fonctionne, mais
 * perd la mise en commun que ce fichier est censé offrir. Aucune énumération
 * n'a été perdue pour autant : voir `docs/audit/referentiel-listes.md`, qui
 * les recense toutes avec leur cellule d'origine.
 *
 * Une reprise de ce fichier n'a pas été faite lors de cette régénération :
 * curer quelles listes méritent une constante partagée (par ex. la triple
 * énumération « Bon / Moyen / Mauvais » d'état général, répétée dans une
 * douzaine d'onglets) est un arbitrage humain, pas une déduction mécanique —
 * plusieurs listes qui partagent un libellé (« Type » sur les compteurs vs
 * les réducteurs de pression vs les appareils de lavage…) décrivent des
 * notions distinctes et ne doivent surtout pas être fusionnées.
 */

// ── Comptage ───────────────────────────────────────────────────────────────

export const TYPE_COMPTEUR = [
  'Compteur à jet unique',
  'Compteur à jet multiple',
  'Compteur à palettes',
  'Compteur volumétrique',
  'Compteur électromagnétique',
  'Compteur ultrasonique',
  'Compteur à pression différentielle',
  'Compteur à insertion',
  'Inconnu',
] as const;

export const CLASSE_METROLOGIQUE = [
  'Classe A',
  'Classe B',
  'Classe C',
  'Classe D',
  'Inconnue',
] as const;

/**
 * Note du classeur (Compteur général, K20) : « on risque de retrouver
 * uniquement les classes suivantes je pense : R40, R80, R100, R125 et R160 ».
 * Question non tranchée — les classes A à D restent en vigueur.
 */
export const CLASSE_METROLOGIQUE_ALTERNATIVE = [
  'R40',
  'R80',
  'R100',
  'R125',
  'R160',
] as const;

// ── Réducteurs de pression ─────────────────────────────────────────────────

export const TYPE_REDUCTEUR_PRESSION = [
  'Réducteur de pression à membrane',
  'Réducteur de pression à piston',
  'Réducteur de pression à cartouche',
  'Inconnu',
] as const;

// ── Robinets ───────────────────────────────────────────────────────────────

/**
 * ⚠️ DIVERGENCE. Trois versions coexistent :
 *  - note de la page Robinet1 (retenue ici) : 6 entrées ;
 *  - catalogue « Infos audit » : 9 entrées, dont « Simple EF classique à tête »,
 *    « Simple EF temporisé poussoir », « Simple EF temporisé électronique »,
 *    « Mitigeur temporisé », « Mitigeur double butée » ;
 *  - ancien code de l'application : 9 entrées encore différentes
 *    (« Monocommande », « Robinet à bille »…), sans source dans le classeur.
 */
export const TYPE_ROBINET = [
  'Simple EF',
  'Simple EF de puisage extérieur',
  'Mélangeur',
  'Mitigeur classique',
  'Mitigeur à butée',
  'Mitigeur thermostatique',
] as const;

export const COMMANDE_ROBINET = ['manuelle', 'au genou', 'à pédale', 'à détection'] as const;

export const TEMPORISATION = ['Aucune', 'Mécanique', 'Electronique'] as const;

export const MATERIAU_TUYAU = ['Cuivre', 'Multicouche', 'PER', 'PEHD', 'PE'] as const;

// ── Douches et baignoires ──────────────────────────────────────────────────

/** Note du classeur : « liste déroulante douche ou baignoire ». */
export const TYPE_EQUIPEMENT_DOUCHE = ['Douche', 'Baignoire'] as const;

export const TYPE_POMMEAU = [
  'Pommeau de douche classique',
  'Pommeau de douche hydroéconome',
  'Pommeau de douche anti-légionnelle',
] as const;

// ── WC ─────────────────────────────────────────────────────────────────────

/**
 * ⚠️ DIVERGENCE. Le catalogue « Infos audit » liste en plus « Toilette sans
 * eau », « Toilette chasse d'eau simple », « Toilette chasse d'eau double
 * débit » et « Urinoir chasse d'eau temporisé ».
 */
export const TYPE_WC = [
  'WC à eau suspendu',
  'WC à eau sur pied',
  'Urinoir masculin à eau',
  'Urinoir masculin sans eau',
  'Urinoir féminin sans eau',
] as const;

export const COMMANDE_CHASSE = [
  'manuelle double chasse',
  'manuelle simple chasse',
  'manuelle poussoir temporisé',
  'à pédale',
  'à détection',
  'à pas de temps',
  'écoulement en continu',
  'non concerné',
] as const;

export const TEMPORISATION_ECOULEMENT = [
  'Non concerné',
  'Volume',
  'Mécanique',
  'Electronique',
] as const;

// ── Bassins (piscine, collecte d'eau de pluie) ─────────────────────────────

export const EMPLACEMENT_BASSIN = [
  'Intérieure',
  'Extérieure',
  "Extérieure avec possibilité d'être couverte",
] as const;

// ── Espaces extérieurs et nettoyage ────────────────────────────────────────

export const MODE_NETTOYAGE = [
  'auto laveuse',
  'nettoyeur haute pression',
  'tuyaux simple',
  'autre',
] as const;

export const MODE_ARROSAGE = [
  'Arrosage goutte à goutte',
  'Arrosage tuyaux poreux',
  'Arrosage non sélectif',
  'Autre',
] as const;

export const FONCTIONS_EAU_EXTERIEUR = [
  'arrosage',
  'arrosage et nettoyage',
  'arrosage et autre',
  'nettoyage',
  'nettoyage et autre',
  'autre',
  'arrosage, nettoyage et autre',
] as const;
