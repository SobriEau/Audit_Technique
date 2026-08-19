/**
 * Accès au stockage local qui ne peut pas faire tomber l'application.
 *
 * Sur certains postes — politique d'entreprise, blocage des données de site,
 * navigation privée saturée — **la simple lecture de `localStorage` lève une
 * exception**. Comme les services la lisaient dès leur construction, donc
 * pendant l'amorçage d'Angular, l'auditeur se retrouvait devant une page
 * blanche sans le moindre message, l'URL bloquée sur `#/`.
 *
 * Ici, tout échec est absorbé et l'application bascule sur une mémoire vive :
 * elle reste utilisable pour la saisie du jour, l'export de fin de visite
 * fonctionne, mais rien n'est conservé à la fermeture. C'est très inférieur au
 * fonctionnement normal, d'où l'avertissement affiché à l'auditeur — perdre un
 * audit sans prévenir serait pire que tout.
 */

/** Repli en mémoire, utilisé quand le navigateur refuse le stockage. */
const memoire = new Map<string, string>();

let disponible: boolean | null = null;

/** Le stockage persistant est-il réellement utilisable sur ce poste ? */
export function storageAvailable(): boolean {
  if (disponible !== null) return disponible;

  try {
    const sonde = '__sobrieau_test__';
    // L'écriture est testée aussi : certains navigateurs autorisent la lecture
    // mais refusent l'écriture, et l'échec ne se verrait qu'à l'enregistrement.
    window.localStorage.setItem(sonde, '1');
    window.localStorage.removeItem(sonde);
    disponible = true;
  } catch {
    disponible = false;
  }
  return disponible;
}

export const safeStorage = {
  getItem(cle: string): string | null {
    if (!storageAvailable()) return memoire.get(cle) ?? null;
    try {
      return window.localStorage.getItem(cle);
    } catch {
      return memoire.get(cle) ?? null;
    }
  },

  setItem(cle: string, valeur: string): void {
    memoire.set(cle, valeur);
    if (!storageAvailable()) return;
    try {
      window.localStorage.setItem(cle, valeur);
    } catch {
      // Quota dépassé ou accès révoqué en cours de session : la valeur reste
      // en mémoire, la saisie n'est pas interrompue.
      disponible = false;
    }
  },

  removeItem(cle: string): void {
    memoire.delete(cle);
    if (!storageAvailable()) return;
    try {
      window.localStorage.removeItem(cle);
    } catch {
      /* rien à faire : la valeur est déjà retirée de la mémoire */
    }
  },
};
