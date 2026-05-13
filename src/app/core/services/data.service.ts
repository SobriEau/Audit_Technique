import { Injectable } from '@angular/core';
import { AppData, QteData, Robinet } from '../../models/data.models';

/**
 * DataService — version Angular (TypeScript) de Data.js.
 *
 * Persistance dans localStorage avec fallback cookie (rétrocompatibilité
 * avec les données de l'ancienne version HTML).
 */
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly STORAGE_KEY = 'sobrieau';
  private readonly EXPIRE_DAYS = 365;

  private _data: AppData;

  constructor() {
    this._data = this.loadFromStorage();
  }

  /** Accès direct aux données (objet mutable — appeler save() après modification). */
  get data(): AppData {
    return this._data;
  }

  // ── Chargement ────────────────────────────────────────────────────────────

  private loadFromStorage(): AppData {
    // 1. localStorage (prioritaire)
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppData;
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch { /* ignore */ }

    // 2. Cookie (fallback pour migrer depuis l'ancienne version)
    const match = document.cookie.match(
      new RegExp('(?:^|;\\s*)' + encodeURIComponent(this.STORAGE_KEY) + '=([^;]*)')
    );
    if (match) {
      try {
        const parsed = JSON.parse(decodeURIComponent(match[1])) as AppData;
        if (parsed && typeof parsed === 'object') {
          // Migration : copie vers localStorage
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed));
          return parsed;
        }
      } catch { /* ignore */ }
    }

    return {};
  }

  // ── Sauvegarde ───────────────────────────────────────────────────────────

  save(): void {
    const serialized = JSON.stringify(this._data);
    localStorage.setItem(this.STORAGE_KEY, serialized);

    // Sauvegarde cookie de secours
    const expires = new Date();
    expires.setDate(expires.getDate() + this.EXPIRE_DAYS);
    document.cookie =
      `${encodeURIComponent(this.STORAGE_KEY)}=${encodeURIComponent(serialized)}` +
      `;expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  }

  // ── Adresse ──────────────────────────────────────────────────────────────

  /** Modifie l'adresse et réinitialise tous les autres champs. */
  setAdresse(adresse: string): void {
    this._data = { Adresse: adresse };
    this.save();
  }

  // ── Helpers QTE ──────────────────────────────────────────────────────────

  getQte<K extends keyof QteData>(key: K): QteData[K] | undefined {
    return this._data.Qte?.[key];
  }

  setQte<K extends keyof QteData>(key: K, value: QteData[K]): void {
    if (!this._data.Qte) this._data.Qte = {};
    (this._data.Qte as Record<string, unknown>)[key as string] = value;
    this.save();
  }

  getRobinets(): Robinet[] {
    return (this._data.Qte?.robinets as Robinet[]) ?? [];
  }

  setRobinets(robinets: Robinet[]): void {
    this.setQte('robinets', robinets);
  }

  // ── Import / Export JSON ─────────────────────────────────────────────────

  exportJson(filename?: string): void {
    const name = filename ?? `${this.STORAGE_KEY}_${new Date().toISOString().slice(0, 10)}`;
    const blob = new Blob([JSON.stringify(this._data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  importJson(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string) as AppData;
          this._data = parsed;
          this.save();
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Lecture du fichier échouée'));
      reader.readAsText(file);
    });
  }

  snapshot(): AppData {
    return JSON.parse(JSON.stringify(this._data)) as AppData;
  }
}
