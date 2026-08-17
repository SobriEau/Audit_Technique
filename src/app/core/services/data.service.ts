import { Injectable, inject } from '@angular/core';
import {
  AppData,
  AssetRef,
  AuditEntity,
  AuditSummary,
  PlanLocation,
  QteData,
  Robinet,
} from '../../models/data.models';
import { AUDIT_SCHEMA } from '../../models/audit-schema';
import { AssetStoreService } from './asset-store.service';
import { AuditRegistryService } from './audit-registry.service';
import { addressKey, htmlToText } from '../utils/address-key';
import { uid } from '../utils/uid';

/**
 * Données de l'audit ouvert.
 *
 * Un auditeur enchaîne plusieurs bâtiments : ce service porte celui en cours,
 * et délègue à AuditRegistryService la conservation des autres. Le repli
 * cookie de l'ancienne version a disparu — il ne pouvait porter qu'un audit,
 * et son plafond de 4 Ko le rendait de toute façon inopérant.
 */
@Injectable({ providedIn: 'root' })
export class DataService {
  private _data: AppData;

  private readonly assets = inject(AssetStoreService);
  private readonly registry = inject(AuditRegistryService);

  constructor() {
    const id = this.registry.currentId;
    this._data = this.registry.load(id);
    this.assets.setScope(id);
    if (this.ensureEntityIds()) this.save();
  }

  /**
   * Attribue un identifiant stable aux éléments qui n'en ont pas encore.
   *
   * Indispensable à la reprise des audits créés avant l'introduction de `Id` :
   * sans cela, un robinet existant n'aurait pas d'identité et deviendrait
   * inaccessible par son URL de fiche.
   *
   * @returns vrai si au moins un identifiant a été attribué.
   */
  private ensureEntityIds(): boolean {
    let changed = false;
    const qte = this._data.Qte as Record<string, unknown> | undefined;
    if (!qte) return false;

    for (const def of AUDIT_SCHEMA) {
      if (def.single) continue;
      const list = qte[def.key];
      if (!Array.isArray(list)) continue;
      for (const item of list as AuditEntity[]) {
        if (item && typeof item === 'object' && !item.Id) {
          item.Id = uid();
          changed = true;
        }
      }
    }
    return changed;
  }

  // ── CRUD générique, piloté par le schéma ─────────────────────────────────

  /** Liste des éléments d'une entité (sous-compteurs, WC, robinets…). */
  getEntities<T extends AuditEntity = AuditEntity>(entityKey: string): T[] {
    const qte = this._data.Qte as Record<string, unknown> | undefined;
    const list = qte?.[entityKey];
    return Array.isArray(list) ? (list as T[]) : [];
  }

  setEntities(entityKey: string, list: AuditEntity[]): void {
    if (!this._data.Qte) this._data.Qte = {};
    (this._data.Qte as Record<string, unknown>)[entityKey] = list;
    this.save();
  }

  /** Crée un élément doté de son identité stable et l'ajoute à la liste. */
  createEntity<T extends AuditEntity = AuditEntity>(entityKey: string): T {
    const list = this.getEntities(entityKey);
    const item = { Id: uid(), Numero: String(list.length + 1), Photos: [] } as unknown as T;
    this.setEntities(entityKey, [...list, item]);
    return item;
  }

  getEntity<T extends AuditEntity = AuditEntity>(entityKey: string, id: string): T | undefined {
    return this.getEntities<T>(entityKey).find((e) => e.Id === id);
  }

  updateEntity(entityKey: string, item: AuditEntity): void {
    const list = [...this.getEntities(entityKey)];
    const i = list.findIndex((e) => e.Id === item.Id);
    if (i === -1) return;
    list[i] = { ...item };
    this.setEntities(entityKey, list);
  }

  /** Supprime un élément et les photos qui n'appartiennent qu'à lui. */
  async deleteEntity(entityKey: string, id: string): Promise<void> {
    const item = this.getEntity(entityKey, id) as (AuditEntity & { Photos?: AssetRef[] }) | undefined;
    if (!item) return;

    for (const photo of item.Photos ?? []) {
      await this.assets.remove(photo.id);
    }
    this.setEntities(
      entityKey,
      this.getEntities(entityKey).filter((e) => e.Id !== id)
    );
  }

  // ── Entités uniques (compteur général, collecte d'eau de pluie) ──────────

  getSingle<T extends Record<string, unknown>>(entityKey: string): T {
    const qte = this._data.Qte as Record<string, unknown> | undefined;
    const v = qte?.[entityKey];
    return (v && typeof v === 'object' && !Array.isArray(v) ? v : {}) as T;
  }

  setSingle(entityKey: string, value: Record<string, unknown>): void {
    if (!this._data.Qte) this._data.Qte = {};
    (this._data.Qte as Record<string, unknown>)[entityKey] = value;
    this.save();
  }

  /** Accès direct aux données (objet mutable — appeler save() après modification). */
  get data(): AppData {
    return this._data;
  }

  // ── Registre des audits ──────────────────────────────────────────────────

  /** Fiches de tous les audits, du plus récent au plus ancien. */
  listAudits(): AuditSummary[] {
    return this.registry.listByRecency();
  }

  get currentAuditId(): string {
    return this._data.Id ?? '';
  }

  get currentAudit(): AuditSummary | undefined {
    return this.registry.find(this.currentAuditId);
  }

  /** L'audit courant ne contient encore aucune saisie. */
  get currentIsEmpty(): boolean {
    return this.registry.isEmpty(this._data);
  }

  /** Audit déjà enregistré à cette adresse, hors l'audit courant. */
  findAuditByAddress(adresse: string): AuditSummary | undefined {
    return this.registry.findByAddressKey(addressKey(adresse), this.currentAuditId);
  }

  /** Vrai si l'adresse saisie désigne, une fois normalisée, la même que l'actuelle. */
  isSameAddress(adresse: string): boolean {
    return addressKey(adresse) === addressKey(this._data.Adresse ?? '');
  }

  /** Ouvre un autre audit. Le courant est déjà enregistré au fil de la saisie. */
  openAudit(id: string): void {
    if (id === this.currentAuditId) return;
    this.registry.setCurrent(id);
    this._data = this.registry.load(id);
    this.assets.setScope(id);
    this.ensureEntityIds();
  }

  /** Crée un audit vierge et l'ouvre. */
  newAudit(adresse = ''): AuditSummary {
    const summary = this.registry.create(adresse);
    this._data = this.registry.load(summary.Id);
    this.assets.setScope(summary.Id);
    return summary;
  }

  /** Renomme l'audit courant sans toucher à ses données. */
  renameCurrentAudit(adresse: string): void {
    this._data.Adresse = adresse;
    this.save();
  }

  /** Supprime un audit et les images qui n'appartiennent qu'à lui. */
  async deleteAudit(id: string): Promise<void> {
    await this.assets.purgeAudit(id);
    this.registry.remove(id);

    if (id === this.currentAuditId) {
      const next = this.registry.listByRecency()[0];
      if (next) this.openAudit(next.Id);
      else this.newAudit();
    }
  }

  // ── Sauvegarde ───────────────────────────────────────────────────────────

  save(): void {
    this.registry.persist(this._data);
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

  /** Crée un robinet doté de son identité stable, et l'ajoute à la liste. */
  createRobinet(): Robinet {
    const robinet: Robinet = {
      Id: uid(),
      Numero: null,
      Emplacement: null,
      Type: null,
      Debit: null,
      Remarques: null,
      Photos: [],
    };
    this.setRobinets([...this.getRobinets(), robinet]);
    return robinet;
  }

  getRobinetById(id: string): Robinet | undefined {
    return this.getRobinets().find((r) => r.Id === id);
  }

  /** Remplace un robinet à partir de son identité. Sans effet s'il a disparu. */
  updateRobinet(robinet: Robinet): void {
    const robinets = [...this.getRobinets()];
    const i = robinets.findIndex((r) => r.Id === robinet.Id);
    if (i === -1) return;
    robinets[i] = { ...robinet };
    this.setRobinets(robinets);
  }

  /**
   * Supprime un robinet et les photos qui lui appartiennent.
   *
   * Le nettoyage des images est fait ici plutôt que dans le composant : les
   * photos vivent en IndexedDB, hors du JSON de l'audit, et resteraient sinon
   * stockées sans plus être référencées par personne.
   */
  async deleteRobinet(id: string): Promise<void> {
    const robinet = this.getRobinetById(id);
    if (!robinet) return;

    for (const photo of robinet.Photos ?? []) {
      await this.assets.remove(photo.id);
    }
    this.setRobinets(this.getRobinets().filter((r) => r.Id !== id));
  }

  // ── Plans de l'audit ─────────────────────────────────────────────────────

  getPlans(): AssetRef[] {
    return this._data.Plans ?? [];
  }

  setPlans(plans: AssetRef[]): void {
    this._data.Plans = plans;
    this.save();
  }

  /** Retrouve un plan par son identifiant, pour l'affichage d'une localisation. */
  findPlan(planId: string): AssetRef | undefined {
    return this.getPlans().find((p) => p.id === planId);
  }

  /**
   * Supprime toute localisation pointant vers un plan retiré, afin qu'aucun
   * élément ne conserve une référence morte affichant un plan introuvable.
   */
  purgePlanReferences(planId: string): void {
    // Toutes les entités du schéma, pas seulement les robinets.
    for (const def of AUDIT_SCHEMA) {
      if (def.single) continue;
      const list = this.getEntities<AuditEntity & { Localisation?: PlanLocation | null }>(def.key);
      let touched = false;
      for (const item of list) {
        if (item.Localisation?.planId === planId) {
          item.Localisation = null;
          touched = true;
        }
      }
      if (touched) this.setEntities(def.key, list);
    }

    const locations = this._data.Qte?.Localisations;
    if (locations) {
      for (const [key, loc] of Object.entries(locations)) {
        if (loc.planId === planId) delete locations[key];
      }
    }
    this.save();
  }

  // ── Galerie générale ─────────────────────────────────────────────────────

  getPhotos(): AssetRef[] {
    return this._data.Photos ?? [];
  }

  setPhotos(photos: AssetRef[]): void {
    this._data.Photos = photos;
    this.save();
  }

  // ── Localisation et photos des sections QTE non structurées ──────────────

  getSectionLocation(sectionKey: string): PlanLocation | null {
    return this._data.Qte?.Localisations?.[sectionKey] ?? null;
  }

  setSectionLocation(sectionKey: string, location: PlanLocation | null): void {
    if (!this._data.Qte) this._data.Qte = {};
    if (!this._data.Qte.Localisations) this._data.Qte.Localisations = {};

    if (location) {
      this._data.Qte.Localisations[sectionKey] = location;
    } else {
      delete this._data.Qte.Localisations[sectionKey];
    }
    this.save();
  }

  getSectionPhotos(sectionKey: string): AssetRef[] {
    return this._data.Qte?.PhotosSections?.[sectionKey] ?? [];
  }

  setSectionPhotos(sectionKey: string, photos: AssetRef[]): void {
    if (!this._data.Qte) this._data.Qte = {};
    if (!this._data.Qte.PhotosSections) this._data.Qte.PhotosSections = {};
    this._data.Qte.PhotosSections[sectionKey] = photos;
    this.save();
  }

  // ── Import / Export JSON ─────────────────────────────────────────────────

  /** Rassemble les identifiants d'images référencés par l'audit. */
  private collectAssetIds(data: AppData): string[] {
    const ids = new Set<string>();
    const add = (refs?: AssetRef[]) =>
      refs?.forEach((r) => {
        if (r?.id) ids.add(r.id);
      });

    add(data.Plans);
    add(data.Photos);
    data.Qte?.robinets?.forEach((r) => add(r.Photos));
    Object.values(data.Qte?.PhotosSections ?? {}).forEach(add);

    return [...ids];
  }

  /**
   * Exporte l'audit en un JSON unique et autoportant.
   *
   * Les images vivent en IndexedDB sous forme de Blob ; elles sont réencodées
   * en base64 dans le fichier exporté. Le surcoût de 33 % est acceptable ici :
   * le fichier est téléchargé, il n'est pas soumis au quota du navigateur, et
   * la portabilité prime pour transmettre un audit.
   */
  async exportJson(filename?: string): Promise<void> {
    const name = filename ?? `sobrieau_${new Date().toISOString().slice(0, 10)}`;

    const embedded: Record<string, { name: string; data: string }> = {};
    for (const id of this.collectAssetIds(this._data)) {
      const asset = await this.assets.toDataUrl(id);
      if (asset) embedded[id] = asset;
    }

    const payload = { ...this._data, __assets: embedded };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
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

  /**
   * Importe un audit exporté, **dans un nouvel audit** plutôt qu'en écrasant
   * celui en cours. L'import était jusqu'ici destructif : il remplaçait tout,
   * images comprises. Avec un registre, rien n'oblige plus à perdre le travail
   * déjà saisi pour en consulter un autre.
   *
   * Les exports antérieurs, dépourvus de `__assets`, restent lisibles : ils
   * n'ont simplement aucune image à restaurer.
   *
   * @returns la fiche de l'audit créé.
   */
  async importJson(file: File): Promise<AuditSummary> {
    const text = await file.text();
    const parsed = JSON.parse(text) as AppData & {
      __assets?: Record<string, { name: string; data: string }>;
    };

    const embedded = parsed.__assets ?? {};
    delete parsed.__assets;

    // Nouvel audit d'accueil : c'est lui qui portera les images importées.
    const summary = this.newAudit(htmlToText(parsed.Adresse));

    // Les identifiants d'images sont réattribués : deux audits importés depuis
    // la même source partageraient sinon les mêmes images, et supprimer l'un
    // effacerait celles de l'autre.
    const remap = new Map<string, string>();
    for (const [ancienId, asset] of Object.entries(embedded)) {
      const ref = await this.assets.addFromDataUrl(asset.name, asset.data);
      remap.set(ancienId, ref.id);
    }

    parsed.Id = summary.Id;
    this.remapAssetIds(parsed, remap);

    this._data = parsed;
    // Un export antérieur à l'introduction des identifiants n'en contient pas.
    this.ensureEntityIds();
    this.save();
    return this.registry.find(summary.Id) ?? summary;
  }

  /** Réécrit les références d'images d'un audit importé vers leurs nouveaux identifiants. */
  private remapAssetIds(data: AppData, remap: Map<string, string>): void {
    const fix = (refs?: AssetRef[]) => {
      for (const r of refs ?? []) {
        const neuf = remap.get(r.id);
        if (neuf) r.id = neuf;
      }
    };

    fix(data.Plans);
    fix(data.Photos);

    const qte = (data.Qte ?? {}) as Record<string, unknown>;
    for (const value of Object.values(qte)) {
      if (Array.isArray(value)) {
        for (const item of value as Array<Record<string, unknown>>) {
          if (item && typeof item === 'object') fix(item['Photos'] as AssetRef[] | undefined);
        }
      } else if (value && typeof value === 'object') {
        fix((value as Record<string, unknown>)['Photos'] as AssetRef[] | undefined);
      }
    }

    // Localisations : le plan référencé a lui aussi changé d'identifiant.
    const fixLoc = (loc?: PlanLocation | null) => {
      if (!loc) return;
      const neuf = remap.get(loc.planId);
      if (neuf) loc.planId = neuf;
    };
    for (const value of Object.values(qte)) {
      if (Array.isArray(value)) {
        for (const item of value as Array<Record<string, unknown>>) {
          if (item && typeof item === 'object') fixLoc(item['Localisation'] as PlanLocation | null);
        }
      }
    }
  }

  snapshot(): AppData {
    return JSON.parse(JSON.stringify(this._data)) as AppData;
  }
}
