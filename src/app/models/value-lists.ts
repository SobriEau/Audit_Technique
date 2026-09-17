/**
 * Référentiel des listes de valeurs de l'audit technique.
 *
 * Source : `audit_technique.xlsx` (V3, 2026-08). Le classeur ne porte aucune
 * validation de données ; les valeurs sont décrites en toutes lettres dans les
 * notes de cellules. Voir `docs/audit/referentiel-listes.md`.
 *
 * **Ce fichier est curé à la main, et il doit le rester.** Une liste n'y entre
 * que si elle se répète d'un onglet à l'autre, ou si elle est assez centrale
 * pour qu'on veuille la relire d'un seul endroit. Le classeur V3 compte une
 * centaine d'énumérations distinctes ; les mettre toutes en commun
 * fusionnerait des notions différentes qui partagent un libellé — « Type »
 * désigne un compteur sur un onglet, un bassin sur un autre, un appareil de
 * lavage sur un troisième. Les listes propres à un seul champ restent donc
 * inlinées dans `audit-schema.ts`, où elles sont générées avec leur cellule
 * d'origine.
 *
 * `gen-schema.js` porte la même table dans sa constante `L` et y renvoie dès
 * qu'un ensemble d'options y correspond exactement, aux accents et à la casse
 * près. **Modifier une liste ici suppose de la modifier là aussi**, sinon le
 * générateur cesse de la reconnaître et réinline la liste sans rien signaler.
 *
 * Deux graphies fautives du classeur sont corrigées à la génération
 * (`VALUE_FIXES` dans `gen-schema.js`) et apparaissent donc corrigées
 * ci-dessous : « à approfondir » et « possibilité ». À signaler au Cerema.
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

/**
 * La V3 réunit en une seule liste les classes A à D et la série R, que la V1
 * séparait en deux constantes dont l'une n'était qu'une question laissée
 * ouverte en marge du classeur. Compteur général et sous-compteurs la
 * partagent.
 */
export const CLASSE_METROLOGIQUE = [
  'Classe A',
  'Classe B',
  'Classe C',
  'Classe D',
  'R40',
  'R50',
  'R63',
  'R80',
  'R100',
  'R125',
  'R160',
  'R200',
  'R250',
  'R315',
  'R400',
  'R500',
  'R630',
  'R800',
  'Inconnue',
] as const;

// ── Robinets ───────────────────────────────────────────────────────────────

export const TYPE_ROBINET = [
  'Simple EF',
  'Simple ECS',
  'Mélangeur',
  'Mitigeur classique',
  'Mitigeur thermostatique',
] as const;

export const COMMANDE_ROBINET = ['manuelle', 'fémorale', 'à pédale', 'à détection'] as const;

export const TEMPORISATION = ['Aucune', 'Mécanique', 'Electronique'] as const;

/**
 * Usages d'un robinet. **Liste unifiée par arbitrage**, pas reprise telle
 * quelle : le classeur en donnait trois versions pour les trois utilisations
 * d'un même robinet — « Lavage matériel » manquait à la deuxième, et la
 * troisième disait « Evier cuisine » là où les autres disaient « Evier ».
 * Un auditeur ne pouvait donc pas saisir en usage secondaire ce qu'il venait
 * de saisir en principal. Les deux entrées « Evier » coexistent désormais.
 */
export const UTILISATION_ROBINET = [
  'Evier',
  'Evier cuisine',
  'Lave-main',
  'Fontaine',
  'Lavabo',
  'Ménage/lavage du sol',
  'Lavage poubelle',
  'Lavage matériel (pinceau, ...)',
  'Table à langer',
  'Poste de plonge',
  'Poste de rinçage',
  'Robinet extérieur',
  'Arrosage',
  'Lavage de véhicule',
  'Chaufferie/technique',
  'Autre',
] as const;

export const MATERIAU_TUYAU = [
  'Cuivre',
  'Multicouche',
  'PER',
  'PEHD',
  'PE',
  'PVC pression',
  'inconnu',
] as const;

// ── Douches et baignoires ──────────────────────────────────────────────────

export const TYPE_EQUIPEMENT_DOUCHE = ['Douche', 'Baignoire'] as const;

/** Jets de l'émetteur, partagés par la douche et la baignoire. */
export const JETS_EMETTEUR = [
  'aucune',
  'pluie laminaire',
  'aéré',
  'brumisé',
  'pulsé/massage',
  'concentré/puissant',
  'multi-jets',
] as const;

// ── WC et urinoirs ─────────────────────────────────────────────────────────

/**
 * Entièrement refondue en V3 : la V1 ne connaissait que cinq entrées, dont
 * « WC à eau suspendu » et « WC à eau sur pied » qui ont disparu au profit
 * d'une typologie par mode de fonctionnement.
 */
export const TYPE_WC = [
  'Urinoir masculin à eau',
  'Urinoir masculin sans eau',
  'Urinoir féminin sans eau',
  'Urinoir féminin à eau',
  "Stalle d'urinoir",
  'Toilette à eau standard',
  'Toilette avec broyeur',
  'Toilette avec rince main intégré',
  'Toilette japonaise',
  'Toilette à la turque',
  'Toilette à produit chimique',
  'Toilette sans eau unitaire',
  'Toilette sans eau à séparation',
  'Toilette à eau à séparation',
  'Latrine',
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

// ── Bassins ────────────────────────────────────────────────────────────────

export const EMPLACEMENT_BASSIN = [
  'Intérieure',
  'Extérieure',
  "Extérieure avec possibilité d'être couverte",
] as const;

// ── Nettoyage et arrosage ──────────────────────────────────────────────────

export const MODE_NETTOYAGE = [
  'auto laveuse',
  'nettoyeur haute pression',
  'tuyaux simple',
  'autre',
] as const;

export const MODE_ARROSAGE = [
  'Tuyau manuel',
  'Arrosoir',
  'Oyas',
  'Micro asperseur',
  'Arrosage goutte à goutte',
  'Arrosage tuyaux poreux',
  'Tuyères',
  'Arrosage non sélectif',
  'Autre',
] as const;

/**
 * Cadre d'usage d'un appareil de lavage. **Unifiée par arbitrage** : le
 * classeur l'écrivait au féminin pour le lave-linge et au masculin pour le
 * lave-vaisselle, pour la même question. L'autolaveuse pose une autre question
 * (interne / prestataire externe) et garde sa liste propre.
 */
export const USAGE_APPAREIL_LAVAGE = ['domestique', 'collectif', 'professionnel'] as const;

/** Exigence de propreté d'une zone, sur les appareils de lavage. */
export const EXIGENCE_PROPRETE = ['faible', 'modéré', 'forte', 'réglementaire'] as const;

// ── Toitures ───────────────────────────────────────────────────────────────

/** Partagée par les gouttières et les descentes. */
export const MATERIAU_GOUTTIERE = [
  'PVC',
  'Zinc',
  'aluminium',
  'béton',
  'acier galvanisé',
  'plomb',
  'pierre',
  'terre cuite',
  'fonte',
  'cuivre',
] as const;

// ── Structure ──────────────────────────────────────────────────────────────

/** Où passe un réseau : partagée par l'eau potable et les eaux usées. */
export const CHEMINEMENT_RESEAU = [
  'des faux-plafonds',
  'des gaines techniques',
  'des vides sanitaires',
  'des trémies',
  'en apparent',
  'la dalle',
  'autre',
] as const;

// ── Opportunités ───────────────────────────────────────────────────────────

/** Potentiel technique d'une piste de sobriété, sur les trois opportunités. */
export const POTENTIEL_TECHNIQUE = ['fort', 'moyen', 'faible', 'à approfondir'] as const;

// ── Transverses ────────────────────────────────────────────────────────────

/**
 * État constaté lors de la visite. C'est la liste la plus partagée du
 * classeur : dix-sept champs, sur presque tous les onglets.
 */
export const ETAT_GENERAL = ['Bon', 'Moyen', 'Mauvais'] as const;

/**
 * Trois réponses possibles quand l'auditeur peut légitimement ne pas savoir —
 * un calorifugeage caché derrière un faux plafond, par exemple. À ne pas
 * confondre avec un champ oui/non, que le schéma rend en `boolean`.
 */
export const OUI_NON_NSP = ['Oui', 'Non', 'Ne sait pas'] as const;
