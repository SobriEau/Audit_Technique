import { safeStorage } from './safe-storage';

/**
 * Où sont rangées les photos ajoutées.
 *
 * - `indexeddb` : dans la base du navigateur. Fonctionne partout, y compris
 *   hors connexion, mais l'export recopie tout en base64 — ce qui borne le
 *   nombre de photos par la mémoire disponible.
 * - `fichiers` : la photo est **aussi téléchargée à côté de la page**, et
 *   l'audit conserve son chemin relatif — de quoi retrouver les images dans
 *   l'explorateur de fichiers, et les récupérer si le navigateur vide ses
 *   données. Le binaire reste en base dans les deux cas : c'est lui qui
 *   s'affiche (voir `PhotoEditorComponent.source`) et lui que l'export JSON
 *   embarque.
 *
 * Le second mode suppose que la page se trouve dans le dossier de
 *   téléchargement, et que le navigateur accepte d'y écrire — ce qui dépend du
 *   poste. Il est donc **proposé en option, à évaluer**, et non imposé.
 */
export type PhotoMode = 'indexeddb' | 'fichiers';

const CLE = 'sobrieau.photo-mode';

export function photoMode(): PhotoMode {
  return safeStorage.getItem(CLE) === 'fichiers' ? 'fichiers' : 'indexeddb';
}

export function setPhotoMode(mode: PhotoMode): void {
  safeStorage.setItem(CLE, mode);
}

/** Forme d'un nom destiné à un système de fichiers : sans accent, sans espace. */
export function propre(s: string, max = 40): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, max)
    .replace(/-+$/, '');
}

/**
 * Nom du dossier d'un audit — celui que porte le chemin des photos, et celui
 * que l'archive crée.
 *
 * Composé du nom affiché de l'audit, plus **huit caractères de son
 * identité** : deux audits peuvent très bien s'appeler « École Jean Moulin »,
 * et leurs photos se mélangeraient dans un même dossier. Un audit sans nom
 * retombe sur son identité seule, plutôt que sur un « audit » générique où
 * tous se retrouveraient.
 *
 * ⚠️ Le nom affiché peut changer après coup. Le chemin déjà enregistré dans une
 * photo n'est pas réécrit — ce serait toucher à des dizaines d'enregistrements
 * pour un libellé — mais **l'archive range toutes les photos d'un audit dans
 * son dossier actuel et réécrit leurs chemins en conséquence** : l'archive est
 * donc toujours cohérente avec elle-même, quel que soit l'historique.
 */
export function dossierAudit(nomAffiche: string, auditId: string): string {
  const court = propre(auditId, 8) || 'sans-id';
  const nom = propre(nomAffiche);
  return nom ? `${nom}-${court}` : `audit-${court}`;
}

/**
 * Nom de fichier composé, pensé pour qu'aucune collision ne survienne : le
 * navigateur renommerait sinon en « … (1).jpg » et le chemin enregistré
 * pointerait dans le vide.
 */
export function nomDeFichier(contexte: string, original: string, id: string): string {
  const horodatage = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\..+$/, '');

  const ext = (original.match(/\.[A-Za-z0-9]+$/)?.[0] || '.jpg').toLowerCase();
  return [horodatage, propre(contexte) || 'audit', id.slice(0, 8)].join('_') + ext;
}

/**
 * Chemin relatif enregistré dans une photo : le dossier de la page, puis le
 * dossier de l'audit, puis le fichier.
 *
 * ⚠️ **Un navigateur ne peut pas créer ce sous-dossier lui-même.** Mesuré sur
 * Chromium 141 en pilotant le protocole DevTools : l'attribut `download`
 * **aplatit** les séparateurs — `mon-audit/photo.jpg` est écrit
 * `mon-audit_photo.jpg`, et `./mon-audit/photo.jpg` devient
 * `_mon-audit_photo.jpg`. C'est une règle d'assainissement du navigateur, pas
 * un réglage.
 *
 * Le chemin enregistré est donc la **forme d'archive** : celle que l'export
 * produit, et sous laquelle les audits de plusieurs auditeurs se réunissent
 * sans que leurs photos se mélangent. Sur le poste de l'auditeur, le fichier
 * téléchargé est à plat à côté de la page — c'est le cas courant, et c'est
 * celui que l'affichage essaie d'abord (voir `sourcePhoto`).
 */
export function cheminPhoto(dossier: string, fichier: string): string {
  return `./${dossier}/${fichier}`;
}

/** Dernier segment d'un chemin relatif : le fichier tel qu'il est téléchargé. */
export function nomSeul(chemin: string): string {
  return chemin.split('?')[0].split('/').pop() ?? chemin;
}

// ── Où chercher une photo pour l'afficher ─────────────────────────────────

/** Les endroits où une vignette peut se trouver, du plus sûr au dernier recours. */
export type SourcePhoto = 'base' | 'voisin' | 'archive' | 'drive';

export interface SourcesPhoto {
  /** URL d'objet du binaire local, s'il est en base. */
  base?: string | null;
  /** Chemin relatif enregistré dans la photo — la forme d'archive. */
  chemin?: string | null;
  /** URL obtenue du Drive, en dernier recours. */
  drive?: string | null;
  /** Sources déjà mises en échec pour cette photo. */
  echoues?: Partial<Record<SourcePhoto, boolean>>;
}

/** Sépare un chemin de son paramètre anti-cache, posé par « Réessayer ». */
function separerQuery(chemin: string): [string, string] {
  const i = chemin.indexOf('?');
  return i === -1 ? [chemin, ''] : [chemin.slice(0, i), chemin.slice(i)];
}

/**
 * Où afficher cette photo, et par quelle source.
 *
 * **L'ordre est la règle, et il a été corrigé une fois.** Il se lit ainsi :
 *
 * 1. `base` — le binaire local. Il est écrit avant même que la vignette soit
 *    rendue, dans les deux modes de rangement : c'est la seule source sûre et
 *    immédiate. La préférer est ce qui a supprimé l'obligation de recharger la
 *    page (première visite terrain, 2026-10).
 * 2. `voisin` — le fichier **à plat**, à côté de la page. C'est le cas
 *    **normal** : le navigateur télécharge dans un dossier unique et aplatit
 *    les séparateurs, si bien que la photo est là, et nulle part ailleurs, sur
 *    le poste de l'auditeur.
 * 3. `archive` — le même fichier **dans le sous-dossier de l'audit**, c'est-à-
 *    dire le chemin enregistré tel quel. C'est le **repli**, et il n'existe que
 *    pour l'après : chacun exporte son archive, on les réunit, et les photos de
 *    plusieurs auditeurs se retrouvent alors chacune dans le dossier de son
 *    audit — sans quoi elles se mélangeraient dans un dossier commun.
 * 4. `drive` — le filet, qui suppose le réseau.
 *
 * Mettre le sous-dossier avant le fichier à plat, c'était échouer à chaque
 * affichage sur le poste de l'auditeur pour réussir sur un cas qui n'arrive
 * qu'après l'archivage.
 *
 * Un chemin déjà à plat — un audit d'avant les sous-dossiers — ne donne pas
 * deux candidats identiques : la source `archive` est sautée.
 */
export function sourcePhoto(etat: SourcesPhoto): { source: SourcePhoto; url: string } | null {
  const ko = etat.echoues ?? {};
  const [chemin, query] = separerQuery(etat.chemin ?? '');
  const voisin = chemin ? './' + nomSeul(chemin) + query : '';
  const archive = chemin ? chemin + query : '';

  const candidats: [SourcePhoto, string][] = [
    ['base', etat.base ?? ''],
    ['voisin', voisin],
    // Même URL que `voisin` : le chemin ne porte pas de sous-dossier.
    ['archive', archive === voisin ? '' : archive],
    ['drive', etat.drive ?? ''],
  ];

  for (const [source, url] of candidats) {
    if (!ko[source] && url) return { source, url };
  }
  return null;
}
