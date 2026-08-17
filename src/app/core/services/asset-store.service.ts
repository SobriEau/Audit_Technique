import { Injectable } from '@angular/core';
import { AssetRef } from '../../models/data.models';
import { uid } from '../utils/uid';

const DB_NAME = 'sobrieau-assets';
const DB_VERSION = 1;
const STORE = 'assets';

/** Image stockée (plan ou photo). Le binaire vit en IndexedDB, jamais en localStorage. */
export interface StoredAsset {
  id: string;
  name: string;
  type: string;
  blob: Blob;
}

export type { AssetRef };

/**
 * Stockage des images de l'audit (plans et photos) en IndexedDB.
 *
 * Pourquoi pas localStorage : celui-ci plafonne à ~5 Mo et DataService
 * recopie en plus tout son contenu dans un cookie, limité à ~4 Ko. Une seule
 * photo de téléphone dépasse les deux. IndexedDB stocke des Blob sans ces
 * limites et sans le surcoût de 33 % du base64.
 *
 * Le base64 n'est réintroduit qu'à l'export JSON, où la portabilité prime.
 */
@Injectable({ providedIn: 'root' })
export class AssetStoreService {
  private dbPromise?: Promise<IDBDatabase>;

  /** URL d'objet par identifiant, pour ne pas recréer un Blob URL à chaque rendu. */
  private urlCache = new Map<string, string>();

  private open(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE)) {
            db.createObjectStore(STORE, { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error('IndexedDB indisponible'));
      });
    }
    return this.dbPromise;
  }

  private async tx<T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    const db = await this.open();
    return new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const req = run(transaction.objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // ── Écriture ──────────────────────────────────────────────────────────────

  /** Enregistre un fichier choisi par l'utilisateur et renvoie sa référence. */
  async addFile(file: File): Promise<AssetRef> {
    const asset: StoredAsset = {
      id: uid(),
      name: file.name,
      type: file.type || 'image/jpeg',
      blob: file,
    };
    await this.tx('readwrite', (s) => s.put(asset));
    return { id: asset.id, name: asset.name };
  }

  /** Enregistre une image produite par l'application (page de PDF rasterisée). */
  async addBlob(blob: Blob, name: string): Promise<AssetRef> {
    const asset: StoredAsset = {
      id: uid(),
      name,
      type: blob.type || 'image/png',
      blob,
    };
    await this.tx('readwrite', (s) => s.put(asset));
    return { id: asset.id, name: asset.name };
  }

  /** Réinjecte une image venant d'un export JSON (data URL base64). */
  async addFromDataUrl(name: string, dataUrl: string, id?: string): Promise<AssetRef> {
    const blob = await (await fetch(dataUrl)).blob();
    const asset: StoredAsset = {
      id: id ?? uid(),
      name,
      type: blob.type || 'image/jpeg',
      blob,
    };
    await this.tx('readwrite', (s) => s.put(asset));
    return { id: asset.id, name: asset.name };
  }

  // ── Lecture ───────────────────────────────────────────────────────────────

  async get(id: string): Promise<StoredAsset | undefined> {
    return this.tx<StoredAsset | undefined>('readonly', (s) => s.get(id));
  }

  /** URL affichable dans une balise <img>. Null si l'image a disparu. */
  async objectUrl(id: string): Promise<string | null> {
    const cached = this.urlCache.get(id);
    if (cached) return cached;

    const asset = await this.get(id);
    if (!asset) return null;

    const url = URL.createObjectURL(asset.blob);
    this.urlCache.set(id, url);
    return url;
  }

  /** Encode une image en data URL, pour l'export JSON. */
  async toDataUrl(id: string): Promise<{ name: string; data: string } | null> {
    const asset = await this.get(id);
    if (!asset) return null;
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(asset.blob);
    });
    return { name: asset.name, data };
  }

  // ── Suppression ───────────────────────────────────────────────────────────

  async remove(id: string): Promise<void> {
    const url = this.urlCache.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      this.urlCache.delete(id);
    }
    await this.tx('readwrite', (s) => s.delete(id));
  }

  /** Vide le magasin (utilisé par l'import, qui remplace tout l'audit). */
  async clear(): Promise<void> {
    for (const url of this.urlCache.values()) URL.revokeObjectURL(url);
    this.urlCache.clear();
    await this.tx('readwrite', (s) => s.clear());
  }

  /** Identifiants présents en base, pour repérer les images orphelines. */
  async allIds(): Promise<string[]> {
    const keys = await this.tx<IDBValidKey[]>('readonly', (s) => s.getAllKeys());
    return keys.map(String);
  }
}
