/**
 * Modèles de données SobriEau.
 * Conserve les mêmes clés que le localStorage existant pour la rétrocompatibilité.
 */

export interface Robinet {
  Numero?: string | null;
  Emplacement?: string | null;
  PrecisionEmplacement?: string | null;
  Type?: string | null;
  Usages?: string | null;
  Debit?: number | null;
  PresenceReducteur?: boolean | null;
  TempsECS?: number | null;
  NumeroReseauECS?: string | null;
  NbUtilisationSemaine?: number | null;
  NbEquipementIdentique?: number | null;
  Remarques?: string | null;
}

export interface QteData {
  Info?: string | null;
  robinets?: Robinet[];
  wc?: Record<string, unknown>;
  douches_baignoires?: Record<string, unknown>;
  reseaux_eau_chaude_sanitaire?: Record<string, unknown>;
  espace_vert_exterieur?: Record<string, unknown>;
  appareils_nettoyage_lavage?: Record<string, unknown>;
  ventilation_batiment?: Record<string, unknown>;
  potentiel_optimisation?: Record<string, unknown>;
  reducteurs_de_pression?: Record<string, unknown>;
  releve_compteur_general?: Record<string, unknown>;
  sous_compteurs?: Record<string, unknown>;
}

export interface AppData {
  Adresse?: string | null;
  Info?: string | null;
  Date?: string | null;
  Auditeur?: string | null;
  Qge?: Record<string, unknown>;
  Qte?: QteData;
  Qus?: Record<string, unknown>;
}

/** Liste ordonnée des sections QTE avec leur clé interne et leur libellé d'affichage. */
export const QTE_SECTIONS: { key: string; label: string; isCrud?: boolean }[] = [
  { key: 'releve_compteur_general',    label: 'Relevé compteur général' },
  { key: 'sous_compteurs',             label: 'Sous-compteurs' },
  { key: 'reducteurs_de_pression',     label: 'Réducteurs de pression' },
  { key: 'robinets',                   label: 'Robinets', isCrud: true },
  { key: 'douches_baignoires',         label: 'Douches / Baignoires' },
  { key: 'wc',                         label: 'WC' },
  { key: 'reseaux_eau_chaude_sanitaire', label: "Réseaux d'Eau Chaude Sanitaire" },
  { key: 'espace_vert_exterieur',      label: 'Espace vert / Extérieur' },
  { key: 'appareils_nettoyage_lavage', label: 'Appareils de nettoyage / lavage' },
  { key: 'ventilation_batiment',       label: 'Ventilation du bâtiment' },
  { key: 'potentiel_optimisation',     label: "Potentiel d'optimisation" },
];
