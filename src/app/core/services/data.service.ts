import { Injectable, inject } from '@angular/core';
import {
  AppData,
  AssetRef,
  AuditEntity,
  AuditSummary,
  Batiment,
  CLE_BATIMENT,
  CLE_PIECE,
  Piece,
  PlanLocation,
  QteData,
  Robinet,
} from '../../models/data.models';
import { AUDIT_SCHEMA } from '../../models/audit-schema';
import { AssetStoreService } from './asset-store.service';
import { AuditRegistryService } from './audit-registry.service';
import { addressKey, htmlToText } from '../utils/address-key';
import { encoderCp1252 } from '../utils/cp1252';
import { csvAudit, nomAudit } from '../utils/csv-export';
import { uid } from '../utils/uid';
import { RapportFusion, fusionner, prochainNumero } from '../utils/fusion';
import { cheminPhoto, dossierAudit, nomDeFichier } from '../utils/photo-mode';

/** Réunion calculée, prête à être appliquée — ou abandonnée. */
export interface PreparationFusion {
  /** L'audit réuni, tel qu'il sera enregistré si l'auditeur confirme. */
  data: AppData;
  rapport: RapportFusion;
  /** Images transportées par le fichier reçu, par identifiant d'origine. */
  embarquees: Record<string, { name: string; data: string }>;
}

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
   * inaccessible par son URL de fiche. Convertit au passage en liste une
   * entité devenue répétable (le compteur général).
   *
   * @returns vrai si au moins un identifiant a été attribué ou une entité convertie.
   */
  private ensureEntityIds(): boolean {
    let changed = false;
    const qte = this._data.Qte as Record<string, unknown> | undefined;
    if (!qte) return false;

    for (const def of AUDIT_SCHEMA) {
      if (def.single) continue;
      let list = qte[def.key];

      // Entité devenue répétable : le compteur général était une fiche unique,
      // rangée en objet, jusqu'en 2026-09. Sa saisie devient le premier
      // élément de la liste plutôt que de disparaître de l'écran.
      if (list && typeof list === 'object' && !Array.isArray(list)) {
        const ancien = list as Record<string, unknown>;
        const saisi = Object.entries(ancien).some(
          ([k, v]) => k !== 'Photos' && v !== null && v !== undefined && v !== ''
        ) || (Array.isArray(ancien['Photos']) && ancien['Photos'].length > 0);
        list = saisi ? [{ ...ancien, Numero: ancien['Numero'] ?? '1' }] : [];
        qte[def.key] = list;
        changed = true;
      }

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

  /**
   * Crée un élément doté de son identité stable et l'ajoute à la liste.
   *
   * `pieceId` rattache l'élément à une pièce dès sa création : c'est le chemin
   * emprunté depuis la page d'une pièce, où l'auditeur déclare ce qu'il y voit
   * sans avoir à le redire sur la fiche.
   */
  createEntity<T extends AuditEntity = AuditEntity>(entityKey: string, pieceId?: string | null): T {
    const list = this.getEntities(entityKey);
    // Le plus grand numéro, plus un — et non le rang dans la liste, qui recule
    // à chaque suppression et redonnerait un numéro déjà porté. Deux éléments
    // portant « n° 3 » ne cassent rien (le numéro n'est qu'un libellé, voir
    // `AuditEntity`) mais sont indiscernables à l'écran.
    const item = { Id: uid(), Numero: String(prochainNumero(list)), Photos: [] } as unknown as T;
    if (pieceId) (item as unknown as Record<string, unknown>)[CLE_PIECE] = pieceId;
    this.setEntities(entityKey, [...list, item]);
    return item;
  }

  /** Éléments d'une entité rattachés à cette pièce, dans l'ordre de la liste. */
  getEntitiesOfPiece<T extends AuditEntity = AuditEntity>(entityKey: string, pieceId: string): T[] {
    return this.getEntities<T>(entityKey).filter((e) => e[CLE_PIECE] === pieceId);
  }

  /** Nombre d'éléments de chaque entité rattachés à cette pièce, par clé. */
  countsByPiece(pieceId: string): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const def of AUDIT_SCHEMA) {
      if (def.single) continue;
      const n = this.getEntitiesOfPiece(def.key, pieceId).length;
      if (n) counts[def.key] = n;
    }
    return counts;
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

  /**
   * Déplace un élément d'un rang dans sa liste.
   *
   * Demandé trois fois — « rendre les listes agiles », « ajouter la possibilité
   * de déplacer une ligne » : l'ordre de création n'est pas celui de la visite,
   * et une liste de trente robinets ne se relit pas.
   *
   * **Les numéros ne suivent pas.** `Numero` est un libellé que l'auditeur a
   * peut-être noté sur place, et les renvois entre fiches désignent l'`Id`
   * (CLAUDE.md §3) : renuméroter en déplaçant ferait glisser un libellé d'un
   * élément à l'autre pour un simple geste de rangement.
   *
   * @returns vrai si le déplacement a eu lieu.
   */
  moveEntity(entityKey: string, id: string, sens: -1 | 1): boolean {
    const liste = [...this.getEntities(entityKey)];
    const i = liste.findIndex((e) => e.Id === id);
    const j = i + sens;
    if (i === -1 || j < 0 || j >= liste.length) return false;
    [liste[i], liste[j]] = [liste[j], liste[i]];
    this.setEntities(entityKey, liste);
    return true;
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

    // Une pièce est posée sur un plan comme un élément : elle perd sa punaise
    // en même temps, sinon la page de la pièce afficherait un plan absent.
    const pieces = this.getPieces();
    let piecesTouchees = false;
    for (const piece of pieces) {
      if (piece.Localisation?.planId === planId) {
        piece.Localisation = null;
        piecesTouchees = true;
      }
    }
    if (piecesTouchees) this.setPieces(pieces);

    const locations = this._data.Qte?.Localisations;
    if (locations) {
      for (const [key, loc] of Object.entries(locations)) {
        if (loc.planId === planId) delete locations[key];
      }
    }
    this.save();
  }

  // ── Bâtiments de l'établissement ─────────────────────────────────────────

  getBatiments(): Batiment[] {
    return this._data.Batiments ?? [];
  }

  setBatiments(batiments: Batiment[]): void {
    this._data.Batiments = batiments;
    this.save();
  }

  findBatiment(id: string | null | undefined): Batiment | undefined {
    if (!id) return undefined;
    return this.getBatiments().find((b) => b.Id === id);
  }

  /** Nom affichable d'un bâtiment. Vide si l'identité ne désigne rien. */
  batimentLabel(id: string | null | undefined): string {
    const b = this.findBatiment(id);
    return b ? (b.Nom || '').trim() || 'Bâtiment sans nom' : '';
  }

  createBatiment(nom = ''): Batiment {
    const batiment: Batiment = {
      Id: uid(),
      Nom: nom,
      AnneeConstruction: null,
      AnneeDerniereRenovation: null,
      TravauxDerniereRenovation: null,
      Remarques: null,
    };
    this.setBatiments([...this.getBatiments(), batiment]);
    return batiment;
  }

  updateBatiment(batiment: Batiment): void {
    const liste = [...this.getBatiments()];
    const i = liste.findIndex((b) => b.Id === batiment.Id);
    if (i === -1) return;
    liste[i] = { ...batiment };
    this.setBatiments(liste);
  }

  /**
   * Supprime un bâtiment, mais **ni ses pièces ni ses points d'eau** : ils se
   * retrouvent simplement sans bâtiment. Même raison que pour une pièce —
   * supprimer un bâtiment est un geste d'organisation, et effacer au passage
   * des relevés de terrain n'aurait aucun rapport avec ce qui est demandé.
   *
   * @returns le nombre de pièces et d'éléments qui ont perdu leur rattachement.
   */
  deleteBatiment(id: string): { pieces: number; elements: number } {
    const detaches = this.purgeBatimentReferences(id);
    this.setBatiments(this.getBatiments().filter((b) => b.Id !== id));
    return detaches;
  }

  /** Retire de toutes les pièces et de tous les éléments le renvoi vers ce bâtiment. */
  purgeBatimentReferences(batimentId: string): { pieces: number; elements: number } {
    let pieces = 0;
    const liste = this.getPieces();
    for (const p of liste) {
      if (p.Batiment === batimentId) {
        p.Batiment = null;
        pieces++;
      }
    }
    if (pieces) this.setPieces(liste);

    let elements = 0;
    for (const def of AUDIT_SCHEMA) {
      const traiter = (item: Record<string, unknown>): boolean => {
        if (item[CLE_BATIMENT] !== batimentId) return false;
        item[CLE_BATIMENT] = null;
        elements++;
        return true;
      };

      if (def.single) {
        const fiche = this.getSingle<Record<string, unknown>>(def.key);
        if (traiter(fiche)) this.setSingle(def.key, fiche);
        continue;
      }

      const items = this.getEntities(def.key);
      let touched = false;
      for (const item of items) touched = traiter(item as unknown as Record<string, unknown>) || touched;
      if (touched) this.setEntities(def.key, items);
    }

    this.save();
    return { pieces, elements };
  }

  /**
   * Bâtiment d'un élément : **celui de sa pièce**, et à défaut celui qu'il
   * désigne lui-même.
   *
   * L'ordre a de l'importance : un élément dans une pièce n'a pas de bâtiment
   * propre, et la pièce est la seule vérité. Déduire plutôt que recopier évite
   * d'avoir à resynchroniser quoi que ce soit quand une pièce change de
   * bâtiment.
   */
  batimentDeElement(item: Record<string, unknown>): string | null {
    const piece = this.findPiece(item[CLE_PIECE] as string | null | undefined);
    if (piece) return piece.Batiment ?? null;
    return (item[CLE_BATIMENT] as string | null) ?? null;
  }

  /** Pièces rattachées à ce bâtiment, dans l'ordre de la liste. */
  getPiecesOfBatiment(batimentId: string): Piece[] {
    return this.getPieces().filter((p) => p.Batiment === batimentId);
  }

  // ── Pièces du bâtiment ───────────────────────────────────────────────────

  getPieces(): Piece[] {
    return this._data.Pieces ?? [];
  }

  setPieces(pieces: Piece[]): void {
    this._data.Pieces = pieces;
    this.save();
  }

  findPiece(id: string | null | undefined): Piece | undefined {
    if (!id) return undefined;
    return this.getPieces().find((p) => p.Id === id);
  }

  /** Nom affichable d'une pièce, niveau compris quand il est renseigné. */
  pieceLabel(id: string | null | undefined): string {
    const piece = this.findPiece(id);
    if (!piece) return '';
    const nom = (piece.Nom || '').trim() || 'Pièce sans nom';
    const niveau = (piece.Niveau || '').trim();
    return niveau ? `${nom} — ${niveau}` : nom;
  }

  /**
   * Crée une pièce dotée de son identité stable, et l'ajoute à la liste.
   *
   * Rattachée d'office au bâtiment quand il n'y en a qu'un : demander à quel
   * bâtiment appartient la pièce n'a de sens qu'à partir de deux.
   */
  createPiece(nom = '', niveau: string | null = null, batimentId?: string | null): Piece {
    const batiments = this.getBatiments();
    const batiment = batimentId ?? (batiments.length === 1 ? batiments[0].Id : null);
    const piece: Piece = {
      Id: uid(),
      Nom: nom,
      Niveau: niveau,
      Batiment: batiment,
      Localisation: null,
      Remarques: null,
    };
    this.setPieces([...this.getPieces(), piece]);
    return piece;
  }

  updatePiece(piece: Piece): void {
    const pieces = [...this.getPieces()];
    const i = pieces.findIndex((p) => p.Id === piece.Id);
    if (i === -1) return;
    pieces[i] = { ...piece };
    this.setPieces(pieces);
  }

  /**
   * Supprime une pièce, mais **jamais les points d'eau qu'elle désignait** :
   * ils se retrouvent simplement sans pièce, et restent atteignables par la
   * liste de leur type. Supprimer une pièce est un geste d'organisation ;
   * effacer au passage une fiche remplie sur le terrain serait sans rapport
   * avec ce que l'auditeur a demandé.
   *
   * @returns le nombre d'éléments qui ont perdu leur rattachement.
   */
  deletePiece(id: string): number {
    const detaches = this.purgePieceReferences(id);
    this.setPieces(this.getPieces().filter((p) => p.Id !== id));
    return detaches;
  }

  /** Retire de tous les éléments le renvoi vers une pièce disparue. */
  purgePieceReferences(pieceId: string): number {
    let detaches = 0;
    for (const def of AUDIT_SCHEMA) {
      const traiter = (item: Record<string, unknown>): boolean => {
        if (item[CLE_PIECE] !== pieceId) return false;
        item[CLE_PIECE] = null;
        detaches++;
        return true;
      };

      if (def.single) {
        const fiche = this.getSingle<Record<string, unknown>>(def.key);
        if (traiter(fiche)) this.setSingle(def.key, fiche);
        continue;
      }

      const list = this.getEntities(def.key);
      let touched = false;
      for (const item of list) touched = traiter(item as unknown as Record<string, unknown>) || touched;
      if (touched) this.setEntities(def.key, list);
    }
    this.save();
    return detaches;
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

  // ── Nom de dossier d'un audit ────────────────────────────────────────────

  /**
   * Dossier de l'audit ouvert : celui que porte le chemin des photos et que
   * l'archive crée. Voir `dossierAudit`.
   */
  dossierAuditCourant(): string {
    return dossierAudit(nomAudit(this._data), this.currentAuditId);
  }

  // ── Rattrapage du mode « fichiers voisins » ──────────────────────────────

  /**
   * Photos de l'audit avec le contexte de leur fiche, pour composer un nom de
   * fichier lisible. Les **plans** en sont exclus : ils viennent déjà de
   * fichiers choisis par l'auditeur, et n'ont jamais de chemin.
   */
  private photosAvecContexte(): { ref: AssetRef; contexte: string }[] {
    const out: { ref: AssetRef; contexte: string }[] = [];
    const vus = new Set<string>();
    const ajouter = (refs: AssetRef[] | undefined, contexte: string) => {
      for (const ref of refs ?? []) {
        if (!ref?.id || vus.has(ref.id)) continue;
        vus.add(ref.id);
        out.push({ ref, contexte });
      }
    };

    ajouter(this._data.Photos, 'galerie');
    for (const def of AUDIT_SCHEMA) {
      if (def.single) {
        ajouter(this.getSingle<{ Photos?: AssetRef[] }>(def.key).Photos, def.singular);
        continue;
      }
      for (const item of this.getEntities(def.key)) {
        const numero = item.Numero ? ` ${item.Numero}` : '';
        ajouter(item['Photos'] as AssetRef[] | undefined, `${def.singular}${numero}`);
      }
    }
    return out;
  }

  /** Photos qui n'ont pas encore de fichier voisin. */
  get nbPhotosSansFichier(): number {
    return this.photosAvecContexte().filter(({ ref }) => !ref.path).length;
  }

  /**
   * Télécharge à côté de la page les photos **déjà prises** qui n'ont pas de
   * fichier voisin, et leur donne leur chemin.
   *
   * Demandé au 16/10 : « si on change le champ "photos dans le navigateur" à
   * "photos à côté de la page", prévoir de télécharger les photos lorsqu'on
   * sauvegarde l'audit ». Sans cela, basculer de mode ne valait que pour les
   * photos suivantes, et les précédentes manquaient à l'arborescence.
   *
   * **Déclenché par un bouton, jamais automatiquement** : le navigateur
   * demande son accord pour un téléchargement multiple, et cent fichiers
   * partant sans prévenir seraient inacceptables. Les envois sont espacés —
   * Chrome refuse une rafale — et le chemin n'est inscrit qu'une fois le
   * fichier remis au navigateur.
   */
  async telechargerPhotosVoisines(
    avancement: (fait: number, total: number) => void = () => {}
  ): Promise<{ telechargees: number; absentes: number }> {
    const dossier = this.dossierAuditCourant();
    const aFaire = this.photosAvecContexte().filter(({ ref }) => !ref.path);
    let telechargees = 0;
    let absentes = 0;

    for (const [i, { ref, contexte }] of aFaire.entries()) {
      avancement(i + 1, aFaire.length);
      const stocke = await this.assets.get(ref.id);
      if (!stocke?.blob) {
        absentes++;
        continue;
      }
      const nom = nomDeFichier(dossier, contexte, ref.name || stocke.name, ref.id);
      this.telecharger(stocke.blob, nom);
      ref.path = cheminPhoto(dossier, nom);
      telechargees++;
      // Le navigateur refuse une rafale de téléchargements : on espace.
      await new Promise((r) => setTimeout(r, 350));
    }

    this.save();
    return { telechargees, absentes };
  }

  // ── Import / Export JSON ─────────────────────────────────────────────────

  /**
   * Rassemble les identifiants d'images référencés par l'audit.
   *
   * Parcourt **toutes les entités du schéma**, et pas seulement les robinets :
   * chaque élément listé comme chaque fiche unique peut porter ses propres
   * photos. Un parcours partiel les omettrait de l'export sans rien signaler.
   */
  private collectAssetIds(data: AppData): string[] {
    const ids = new Set<string>();
    const add = (refs?: AssetRef[]) =>
      refs?.forEach((r) => {
        if (r?.id) ids.add(r.id);
      });

    add(data.Plans);
    add(data.Photos);

    for (const value of Object.values((data.Qte ?? {}) as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        // Entité listée : robinets, WC, piscines…
        for (const item of value as Array<Record<string, unknown>>) {
          if (item && typeof item === 'object') add(item['Photos'] as AssetRef[] | undefined);
        }
      } else if (value && typeof value === 'object') {
        // Entité unique : compteur général, collecte d'eau de pluie.
        add((value as Record<string, unknown>)['Photos'] as AssetRef[] | undefined);
      }
    }

    // Table héritée de l'époque des sections en JSON brut.
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
  /**
   * Contenu exportable d'un audit, images comprises.
   * Partagé par le téléchargement, la synchronisation Drive et l'archive.
   *
   * **Les images viennent de la base, jamais du chemin relatif.** Une page
   * `file://` ne peut pas lire ses fichiers voisins (`fetch` y est refusé,
   * mesuré) : un audit dont les binaires auraient disparu produirait un JSON
   * aux vignettes vides. D'où le compte `manquantes`, qui le dit au lieu de le
   * taire.
   */
  async buildExportPayload(
    data: AppData = this._data
  ): Promise<{
    payload: AppData & { __assets: Record<string, { name: string; data: string }> };
    manquantes: string[];
  }> {
    const embedded: Record<string, { name: string; data: string }> = {};
    const manquantes: string[] = [];
    for (const id of this.collectAssetIds(data)) {
      const asset = await this.assets.toDataUrl(id);
      if (asset) embedded[id] = asset;
      else manquantes.push(id);
    }
    return { payload: { ...data, __assets: embedded }, manquantes };
  }

  /**
   * Exporte l'audit ouvert en JSON.
   *
   * @returns le nom du fichier et le nombre d'images qui n'ont pas pu y être
   * embarquées — à signaler à l'auditeur : le fichier reste importable, mais
   * ces images-là ne voyageront pas avec lui.
   */
  async exportJson(filename?: string): Promise<{ fichier: string; manquantes: number }> {
    const name = filename ?? `sobrieau_${new Date().toISOString().slice(0, 10)}`;
    const { payload, manquantes } = await this.buildExportPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const fichier = `${name}.json`;
    this.telecharger(blob, fichier);
    return { fichier, manquantes: manquantes.length };
  }

  /**
   * Exporte l'audit ouvert en CSV, une ligne par réponse, pour compiler et
   * analyser plusieurs bâtiments — voir `csv-export.ts`.
   *
   * Séparateur « ; » et encodage cp-1252 : ce qu'Excel attend en France. Les
   * images n'y figurent que par leurs références ; le fichier se prépare donc
   * sans relire IndexedDB, et ne remplace pas l'export JSON pour transmettre
   * un audit.
   *
   * @returns le nombre de lignes écrites, et les caractères que cp-1252 ne
   * connaît pas, remplacés par « ? » — à signaler à l'auditeur.
   */
  exportCsv(): { fichier: string; lignes: number; remplaces: string[] } {
    const { texte, lignes } = csvAudit(this._data);
    const { octets, remplaces } = encoderCp1252(texte);

    // Le nom du site dans le nom du fichier : ces exports sont faits pour être
    // rassemblés, et trente « sobrieau-2026-10-05.csv » ne se distinguent pas.
    const site = addressKey(nomAudit(this._data)).replace(/[^a-z0-9]+/g, '-').slice(0, 40).replace(/^-|-$/g, '');
    const fichier = ['sobrieau', site, new Date().toISOString().slice(0, 10)].filter(Boolean).join('-') + '.csv';

    this.telecharger(new Blob([octets], { type: 'text/csv;charset=windows-1252' }), fichier);
    return { fichier, lignes: lignes.length, remplaces };
  }

  /** Remet un fichier à l'auditeur. Partagé par les exports et par l'archive. */
  telecharger(blob: Blob, fichier: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fichier;
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
    return this.importPayload(JSON.parse(await file.text()));
  }

  /**
   * Intègre un audit exporté — depuis un fichier ou depuis le Drive — dans un
   * nouvel audit.
   */
  async importPayload(
    parsed: AppData & { __assets?: Record<string, { name: string; data: string }> }
  ): Promise<AuditSummary> {
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

  // ── Réunion de deux copies d'un même audit ────────────────────────────────

  /**
   * Prépare la réunion d'un fichier reçu avec l'audit ouvert, **sans rien
   * modifier**.
   *
   * Deux auditeurs se répartissent les pièces d'un grand bâtiment : chacun
   * remplit sa part hors connexion, puis l'un intègre le fichier de l'autre.
   * L'opération n'est pas réversible — elle touche à des relevés de terrain —
   * d'où ces deux temps : on calcule, on montre, et l'auditeur décide. Voir
   * `fusion.ts` pour les règles.
   */
  async prepareMerge(file: File): Promise<PreparationFusion> {
    const recu = JSON.parse(await file.text()) as AppData & {
      __assets?: Record<string, { name: string; data: string }>;
    };
    const embarquees = recu.__assets ?? {};

    // Les identifiants déjà pris sont ceux du magasin, pas seulement ceux de
    // l'audit ouvert : écraser l'image d'un autre audit serait aussi grave.
    const { data, rapport } = fusionner(this.snapshot(), recu, {
      assetsPris: new Set(await this.assets.allIds()),
    });
    return { data, rapport, embarquees };
  }

  /**
   * Applique une réunion préparée : les images d'abord, l'audit ensuite.
   *
   * Dans cet ordre parce qu'une référence sans image donne une vignette vide,
   * tandis qu'une image sans référence n'est qu'un octet de trop — et parce
   * qu'un échec en cours d'écriture laisse alors l'audit intact.
   */
  async applyMerge(prep: PreparationFusion): Promise<void> {
    for (const { source, cible } of prep.rapport.assets) {
      const image = prep.embarquees[source];
      if (!image) continue; // fichier sans `__assets` : la référence reste, l'image manque
      await this.assets.addFromDataUrl(image.name, image.data, cible);
    }
    this._data = prep.data;
    this.ensureEntityIds();
    this.save();
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
    // Les pièces sont posées sur les plans comme les éléments : sans cette
    // reprise, un audit importé affichait des pièces pointées sur un plan
    // introuvable — l'image est bien là, mais sous un autre identifiant.
    for (const piece of data.Pieces ?? []) fixLoc(piece.Localisation);
    for (const value of Object.values(qte)) {
      if (Array.isArray(value)) {
        for (const item of value as Array<Record<string, unknown>>) {
          if (item && typeof item === 'object') fixLoc(item['Localisation'] as PlanLocation | null);
        }
      } else if (value && typeof value === 'object') {
        // Une fiche unique peut elle aussi être localisée sur un plan.
        fixLoc((value as Record<string, unknown>)['Localisation'] as PlanLocation | null);
      }
    }
  }

  snapshot(): AppData {
    return JSON.parse(JSON.stringify(this._data)) as AppData;
  }
}
