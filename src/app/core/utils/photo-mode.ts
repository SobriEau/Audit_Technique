import { safeStorage } from './safe-storage';

/**
 * Où sont rangées les photos ajoutées.
 *
 * - `indexeddb` : dans la base du navigateur. Fonctionne partout, y compris
 *   hors connexion, mais l'export recopie tout en base64 — ce qui borne le
 *   nombre de photos par la mémoire disponible.
 * - `fichiers` : la photo est **téléchargée à côté de la page**, et l'audit ne
 *   conserve qu'un chemin relatif. L'affichage se fait alors directement depuis
 *   le fichier voisin.
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

  const propre = (s: string) =>
    (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
      .slice(0, 40);

  const ext = (original.match(/\.[A-Za-z0-9]+$/)?.[0] || '.jpg').toLowerCase();
  return [horodatage, propre(contexte) || 'audit', id.slice(0, 8)].join('_') + ext;
}
