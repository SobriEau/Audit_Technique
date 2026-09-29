/**
 * Totaux affichés en tête des listes — « une case en haut du tableau qui
 * indique le nombre total… » (Victor Ledoux, retour de test, 2026-09).
 *
 * Les onglets « Liste » du classeur en prévoient deux (surface des espaces
 * extérieurs, surface de toiture) ; les autres ont été demandés au retour de
 * test. Chaque règle est écrite ici telle qu'elle a été formulée, et le
 * détail du calcul est affiché : c'est une règle métier, que l'auditeur doit
 * pouvoir vérifier d'un coup d'œil.
 *
 * Fonctions pures, sans Angular.
 */

type Element = Record<string, unknown>;

export interface Total {
  libelle: string;
  valeur: number;
  unite?: string;
  /** Comment la valeur est obtenue, en clair. */
  detail?: string;
}

const nombre = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const somme = (items: Element[], cle: string): number =>
  Math.round(items.reduce((a, it) => a + nombre(it[cle]), 0) * 100) / 100;

/** Une valeur de choix, simple ou multiple, contient-elle cette option ? */
const contient = (v: unknown, option: string): boolean =>
  Array.isArray(v) ? v.includes(option) : v === option;

const renseigne = (v: unknown): boolean =>
  v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);

/**
 * « La somme du nombre de lignes du tableau + du nombre d'équipements
 * identiques ». Le détail affiche les deux termes : si « équipements
 * identiques » comptait l'élément lui-même, l'écart se verrait aussitôt.
 */
function lignesPlusIdentiques(items: Element[], libelle: string): Total {
  const identiques = somme(items, 'NombreDEquipementsIdentiques');
  return {
    libelle,
    valeur: items.length + identiques,
    detail: `${items.length} fiche(s) + ${identiques} équipement(s) identique(s)`,
  };
}

const REGLES: Record<string, (items: Element[]) => Total[]> = {
  robinets: (items) => [lignesPlusIdentiques(items, 'Nombre total de robinets')],

  wc: (items) => [lignesPlusIdentiques(items, 'Nombre total de toilettes')],

  douches_baignoires: (items) => [
    lignesPlusIdentiques(items.filter((i) => i['TypeDEquipement'] === 'Douche'), 'Nombre total de douches'),
    lignesPlusIdentiques(items.filter((i) => i['TypeDEquipement'] === 'Baignoire'), 'Nombre total de baignoires'),
  ],

  // « La somme du nombre de lignes du tableau où il y a un générateur. Idem
  // pour le stockage. »
  production_stockage_ecs: (items) => [
    {
      libelle: 'Générateurs',
      valeur: items.filter((i) => renseigne(i['SystemesDeProduction'])).length,
      detail: 'fiches dont le système de production est renseigné',
    },
    {
      libelle: 'Stockages',
      valeur: items.filter((i) => nombre(i['NombreDeBallonDeStockage']) > 0).length,
      detail: `fiches avec au moins un ballon — ${somme(items, 'NombreDeBallonDeStockage')} ballon(s) au total`,
    },
  ],

  // « Le nombre de lignes correspondant à chacun de ces trois types. »
  appareils_lavage: (items) =>
    [
      ['lave linge', 'Lave-linge'],
      ['lave vaisselle', 'Lave-vaisselle'],
      ['autolaveuse', 'Autolaveuses'],
    ].map(([option, libelle]) => ({
      libelle,
      valeur: items.filter((i) => contient(i['Type'], option)).length,
    })),

  espace_vert_exterieur: (items) => [
    { libelle: 'Surface des espaces extérieurs', valeur: somme(items, 'SurfaceDeCetEspace'), unite: 'm²' },
    { libelle: 'Surfaces imperméables', valeur: somme(items, 'DontSurfaceImpermeable'), unite: 'm²' },
  ],

  toitures: (items) => [
    { libelle: 'Surface totale de toiture', valeur: somme(items, 'SurfaceDeToiture'), unite: 'm²' },
    { libelle: 'Nombre de pans de toiture', valeur: somme(items, 'NombreDePansDeToiture') },
  ],
};

/** Totaux à afficher en tête de la liste de cette entité (aucun si elle n'en a pas). */
export function totaux(entite: string, items: readonly object[]): Total[] {
  const regle = REGLES[entite];
  return regle ? regle(items as Element[]) : [];
}

/** Clés de champs lues par les règles, pour que le contrôle vérifie qu'elles existent. */
export const CLES_TOTAUX: Record<string, string[]> = {
  robinets: ['NombreDEquipementsIdentiques'],
  wc: ['NombreDEquipementsIdentiques'],
  douches_baignoires: ['NombreDEquipementsIdentiques', 'TypeDEquipement'],
  production_stockage_ecs: ['SystemesDeProduction', 'NombreDeBallonDeStockage'],
  appareils_lavage: ['Type'],
  espace_vert_exterieur: ['SurfaceDeCetEspace', 'DontSurfaceImpermeable'],
  toitures: ['SurfaceDeToiture', 'NombreDePansDeToiture'],
};
