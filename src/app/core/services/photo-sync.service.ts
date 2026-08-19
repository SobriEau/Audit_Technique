import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AssetRef } from '../../models/data.models';
import { AssetStoreService } from './asset-store.service';
import { DataService } from './data.service';
import { DriveSyncService } from './drive-sync.service';
import { GoogleAuthService } from './google-auth.service';
import { AUDIT_SCHEMA } from '../../models/audit-schema';

/** Ce que l'auditeur doit pouvoir lire d'un coup d'œil. */
export interface SyncStatus {
  /** Photos de l'audit ouvert. */
  total: number;
  /** Celles qui sont aussi sur le Drive. */
  surDrive: number;
  /** Envoi en cours, le cas échéant. */
  enCours: string | null;
  /** Dernier échec, conservé pour être montré plutôt que tu. */
  erreur: string | null;
}

/**
 * Double conservation des photos : le poste et le Drive.
 *
 * Une photo ajoutée est d'abord écrite localement — c'est ce qui permet de
 * travailler hors connexion — puis déposée sur le Drive **si l'auditeur est
 * connecté**. Sinon elle reste en attente, et la synchronisation reprend
 * d'elle-même à la connexion suivante : c'est ce rattrapage qui évite qu'un
 * audit rempli en sous-sol ne reste indéfiniment sur un seul appareil.
 *
 * Le binaire local est conservé même après dépôt. Il sert de source
 * d'affichage rapide, et de filet si le compte Drive change ou si l'accès est
 * révoqué.
 */
@Injectable({ providedIn: 'root' })
export class PhotoSyncService {
  private readonly assets = inject(AssetStoreService);
  private readonly data = inject(DataService);
  private readonly drive = inject(DriveSyncService);
  private readonly auth = inject(GoogleAuthService);

  readonly status$ = new BehaviorSubject<SyncStatus>({
    total: 0,
    surDrive: 0,
    enCours: null,
    erreur: null,
  });

  /** Une seule campagne à la fois : deux en parallèle se marcheraient dessus. */
  private enMarche = false;

  constructor() {
    // Rattrapage automatique dès que l'auditeur se connecte.
    this.auth.state$.subscribe((e) => {
      if (e === 'connected') void this.synchroniser();
    });
  }

  get connecte(): boolean {
    return this.auth.state === 'connected';
  }

  // ── État ─────────────────────────────────────────────────────────────────

  /** Toutes les photos de l'audit ouvert, tous emplacements confondus. */
  private photosDeLAudit(): AssetRef[] {
    const d = this.data.data;
    const out: AssetRef[] = [...(d.Photos ?? [])];

    const qte = (d.Qte ?? {}) as Record<string, unknown>;
    for (const valeur of Object.values(qte)) {
      if (Array.isArray(valeur)) {
        for (const item of valeur as Array<Record<string, unknown>>) {
          if (item && typeof item === 'object') out.push(...((item['Photos'] as AssetRef[]) ?? []));
        }
      } else if (valeur && typeof valeur === 'object') {
        out.push(...(((valeur as Record<string, unknown>)['Photos'] as AssetRef[]) ?? []));
      }
    }
    return out;
  }

  /** Recalcule le compte affiché. À appeler après tout ajout ou suppression. */
  rafraichir(): void {
    const photos = this.photosDeLAudit();
    this.status$.next({
      ...this.status$.value,
      total: photos.length,
      surDrive: photos.filter((p) => !!p.driveId).length,
    });
  }

  // ── Dépôt ────────────────────────────────────────────────────────────────

  /**
   * Dépose une photo précise. Renvoie l'identifiant Drive, ou null si
   * l'auditeur n'est pas connecté — auquel cas elle sera reprise plus tard.
   */
  async deposer(ref: AssetRef, blob: Blob): Promise<string | null> {
    if (!this.connecte || ref.driveId) return ref.driveId ?? null;

    const audit = this.data.currentAudit;
    if (!audit) return null;

    const dossier = await this.drive.ensureAuditFolder(audit.Id, audit.Adresse);
    return this.drive.uploadPhoto(blob, ref.path?.replace('./', '') ?? ref.name, dossier);
  }

  /**
   * Reprend toutes les photos de l'audit qui ne sont pas encore sur le Drive.
   *
   * Une photo dont le binaire local a disparu ne peut pas être envoyée : on la
   * laisse en l'état plutôt que d'échouer bruyamment sur chaque passage.
   */
  async synchroniser(): Promise<void> {
    if (this.enMarche || !this.connecte) return;
    this.enMarche = true;

    try {
      const enAttente = this.photosDeLAudit().filter((p) => !p.driveId);
      if (!enAttente.length) {
        this.rafraichir();
        return;
      }

      const audit = this.data.currentAudit;
      if (!audit) return;
      const dossier = await this.drive.ensureAuditFolder(audit.Id, audit.Adresse);

      let fait = 0;
      for (const ref of enAttente) {
        this.status$.next({
          ...this.status$.value,
          enCours: `Envoi ${++fait} / ${enAttente.length}…`,
          erreur: null,
        });

        const stocke = await this.assets.get(ref.id);
        if (!stocke?.blob) continue; // binaire absent : rien à envoyer

        try {
          ref.driveId = await this.drive.uploadPhoto(
            stocke.blob,
            ref.path?.replace('./', '') ?? ref.name,
            dossier
          );
        } catch (e) {
          this.status$.next({
            ...this.status$.value,
            erreur: e instanceof Error ? e.message : String(e),
          });
          break; // réseau coupé : inutile d'insister sur les suivantes
        }
      }

      // Les références ont changé : il faut les réenregistrer.
      this.data.save();
    } finally {
      this.enMarche = false;
      this.status$.next({ ...this.status$.value, enCours: null });
      this.rafraichir();
    }
  }

  /** Récupère une photo depuis le Drive quand le fichier local est introuvable. */
  async depuisDrive(ref: AssetRef): Promise<string | null> {
    if (!ref.driveId || !this.connecte) return null;
    try {
      const blob = await this.drive.downloadBlob(ref.driveId);
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }

  /** Utilisé par le schéma pour parcourir toutes les entités. */
  static get entites() {
    return AUDIT_SCHEMA;
  }
}
