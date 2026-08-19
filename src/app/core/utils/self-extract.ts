/**
 * Reconstitution du fichier autonome par lui-même.
 *
 * Une page ouverte en `file://` ne peut pas relire son propre fichier : `fetch`
 * et `XMLHttpRequest` y sont refusés (mesuré). La seule source disponible est
 * donc le DOM, qu'il faut re-sérialiser en défaisant ce que l'exécution y a
 * changé :
 *
 * - `<app-root>` a été remplacé par le rendu Angular. Sa version d'origine — le
 *   repli affiché quand l'amorçage échoue — est mise de côté par un script
 *   classique de [index.html](../../../index.html), qui s'exécute après
 *   l'analyse de la balise mais avant le module Angular, qui est différé.
 * - Tout nœud ajouté à `<head>` ou `<body>` après ce moment est du rendu, pas
 *   de la source, et se trouve écarté.
 *
 * Le build écrit par ailleurs le fichier sous la forme que le navigateur
 * produit en le re-sérialisant (voir `inline-build.js`), si bien que
 * l'aller-retour est **sans perte** : le fichier obtenu a l'empreinte du
 * livrable, ce que `tools/check-extract.js` vérifie.
 */

declare global {
  interface Window {
    __sobrieauAppRoot?: string;
    __sobrieauHead?: Element[];
    __sobrieauBody?: Element[];
  }
}

/** Pourquoi l'extraction n'est pas possible, le cas échéant. */
export interface Faisabilite {
  possible: boolean;
  raison?: string;
  /** Ressources que le fichier irait chercher ailleurs — donc pas autonome. */
  externes: string[];
}

/**
 * Une ressource restée externe casserait le fichier hors connexion sans erreur
 * visible. La refuser ici évite de distribuer une copie muette — et sert de
 * témoin si un jour une ressource échappe à l'inlinage.
 */
function ressourcesExternes(): string[] {
  const out: string[] = [];
  document.querySelectorAll('script[src]').forEach((n) => {
    const v = n.getAttribute('src') ?? '';
    if (!v.startsWith('data:')) out.push('script ' + v.slice(0, 60));
  });
  document.querySelectorAll('link[href]').forEach((n) => {
    const rel = (n.getAttribute('rel') ?? '').toLowerCase();
    const v = n.getAttribute('href') ?? '';
    if (rel === 'stylesheet' && !v.startsWith('data:')) out.push('feuille ' + v.slice(0, 60));
  });
  return out;
}

export function faisabilite(): Faisabilite {
  const externes = ressourcesExternes();
  if (!window.__sobrieauAppRoot) {
    return {
      possible: false,
      externes,
      raison:
        "La copie du gabarit d'origine est absente. Cette page n'est pas le " +
        'fichier autonome, ou son script de démarrage n’a pas été exécuté.',
    };
  }
  if (externes.length) {
    return {
      possible: false,
      externes,
      raison:
        'Cette version charge des fichiers séparés : une copie ne fonctionnerait ' +
        'pas hors connexion. Le fichier autonome se produit avec `npm run build`.',
    };
  }
  return { possible: true, externes };
}

/** Le HTML complet du fichier autonome, tel qu'il devrait être sur le disque. */
export function reconstituer(): string {
  const gabarit = window.__sobrieauAppRoot;
  if (!gabarit) throw new Error("Le gabarit d'origine n'a pas été retenu au démarrage.");

  // Les index se correspondent : le clone est pris à cet instant précis.
  const ajouts = (live: Element[], originaux?: Element[]): number[] => {
    if (!originaux) return [];
    const connus = new Set(originaux);
    const idx: number[] = [];
    live.forEach((n, i) => {
      if (!connus.has(n)) idx.push(i);
    });
    return idx;
  };
  const enTrop = {
    head: ajouts(Array.from(document.head.children), window.__sobrieauHead),
    body: ajouts(Array.from(document.body.children), window.__sobrieauBody),
  };

  const clone = document.documentElement.cloneNode(true) as HTMLElement;
  const purger = (parent: Element | null, indices: number[]): void => {
    if (!parent) return;
    const enfants = Array.from(parent.children);
    // À rebours : retirer par la fin laisse les indices précédents valides.
    for (const i of [...indices].reverse()) enfants[i]?.remove();
  };
  purger(clone.querySelector('head'), enTrop.head);
  purger(clone.querySelector('body'), enTrop.body);

  const racine = clone.querySelector('app-root');
  if (!racine) throw new Error('<app-root> est introuvable dans le document.');
  racine.outerHTML = gabarit;

  return '<!doctype html>\n' + clone.outerHTML;
}

/** Empreinte SHA-256, pour comparer la copie au livrable d'origine. */
export async function empreinte(texte: string): Promise<string | null> {
  if (!globalThis.crypto?.subtle) return null;
  const octets = new TextEncoder().encode(texte);
  const somme = await crypto.subtle.digest('SHA-256', octets);
  return Array.from(new Uint8Array(somme))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
