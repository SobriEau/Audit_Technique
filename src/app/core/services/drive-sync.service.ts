import { Injectable, inject } from '@angular/core';
import { DataService } from './data.service';
import { GoogleAuthService } from './google-auth.service';
import { DRIVE_CONFIG } from './drive-config';
import { AuditSummary } from '../../models/data.models';

const FILES = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';

/** Marque posée sur chaque fichier pour le relier à son audit. */
const TAG = 'sobrieauAuditId';

/** Audit présent sur le Drive. */
export interface RemoteAudit {
  fileId: string;
  name: string;
  auditId: string | null;
  modifiedTime: string;
}

/**
 * Dépôt et relecture des audits sur Google Drive.
 *
 * La portée est `drive.file` : l'application ne voit **que les fichiers qu'elle
 * a créés**. C'est suffisant pour centraliser les audits d'un auditeur, et
 * volontairement limité — elle ne peut pas parcourir le reste du Drive. En
 * contrepartie, un fichier déposé à la main sur le Drive lui restera invisible.
 *
 * Chaque fichier porte l'identifiant de son audit dans `appProperties`, ce qui
 * permet de retrouver et de mettre à jour le bon fichier sans conserver de
 * correspondance locale — un poste réinstallé retrouve donc ses dépôts.
 */
@Injectable({ providedIn: 'root' })
export class DriveSyncService {
  private readonly data = inject(DataService);
  private readonly auth = inject(GoogleAuthService);

  private folderId: string | null = null;

  // ── Requêtes authentifiées ───────────────────────────────────────────────

  private async call(url: string, init: RequestInit = {}): Promise<Response> {
    const token = await this.auth.accessToken();
    if (!token) throw new Error('Non connecté à Google Drive.');

    const r = await fetch(url, {
      ...init,
      headers: { ...(init.headers ?? {}), Authorization: 'Bearer ' + token },
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      throw new Error(`Drive a répondu ${r.status}. ${detail.slice(0, 160)}`);
    }
    return r;
  }

  // ── Dossier de rangement ─────────────────────────────────────────────────

  private async ensureFolder(): Promise<string> {
    if (this.folderId) return this.folderId;

    const q = encodeURIComponent(
      `mimeType='application/vnd.google-apps.folder' and name='${DRIVE_CONFIG.folderName}' and trashed=false`
    );
    const trouve = await (await this.call(`${FILES}?q=${q}&fields=files(id)`)).json();

    if (trouve.files?.length) {
      this.folderId = trouve.files[0].id as string;
      return this.folderId;
    }

    const cree = await (
      await this.call(FILES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: DRIVE_CONFIG.folderName,
          mimeType: 'application/vnd.google-apps.folder',
        }),
      })
    ).json();

    this.folderId = cree.id as string;
    return this.folderId;
  }

  /**
   * Sous-dossier propre à un audit, créé au besoin.
   *
   * Ranger les photos d'un bâtiment ensemble plutôt qu'en vrac : l'auditeur
   * retrouve ses fichiers depuis le Drive lui-même, sans passer par
   * l'application.
   */
  async ensureAuditFolder(auditId: string, libelle: string): Promise<string> {
    const parent = await this.ensureFolder();
    const nom = this.nomDeDossier(libelle);

    const q = encodeURIComponent(
      `mimeType='application/vnd.google-apps.folder' and trashed=false ` +
        `and '${parent}' in parents and appProperties has { key='${TAG}' and value='${auditId}' }`
    );
    const trouve = await (await this.call(`${FILES}?q=${q}&fields=files(id)`)).json();
    if (trouve.files?.length) return trouve.files[0].id as string;

    const cree = await (
      await this.call(FILES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nom,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parent],
          appProperties: { [TAG]: auditId },
        }),
      })
    ).json();
    return cree.id as string;
  }

  /** Dépose une image dans le dossier de l'audit et renvoie son identifiant. */
  async uploadPhoto(blob: Blob, nom: string, dossierId: string): Promise<string> {
    const limite = '-------sobrieau' + Date.now();
    const metadonnees = { name: nom, parents: [dossierId] };

    // Le corps multipart doit être binaire : une image passée en texte serait
    // corrompue. On assemble donc des Blob plutôt que des chaînes.
    // Les frontières multipart exigent des CRLF. Un littéral de gabarit
    // normalisant ses fins de ligne en LF, il faut les écrire échappés.
    const CRLF = '\r\n';
    const corps = new Blob([
      `--${limite}${CRLF}Content-Type: application/json; charset=UTF-8${CRLF}${CRLF}`,
      JSON.stringify(metadonnees),
      `${CRLF}--${limite}${CRLF}Content-Type: ${blob.type || 'image/jpeg'}${CRLF}${CRLF}`,
      blob,
      `${CRLF}--${limite}--`,
    ]);

    const r = await (
      await this.call(`${UPLOAD}?uploadType=multipart&fields=id`, {
        method: 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${limite}` },
        body: corps,
      })
    ).json();
    return r.id as string;
  }

  /** Contenu d'un fichier Drive, pour l'afficher quand le local a disparu. */
  async downloadBlob(fileId: string): Promise<Blob> {
    return (await this.call(`${FILES}/${fileId}?alt=media`)).blob();
  }

  private nomDeDossier(libelle: string): string {
    const base = (libelle || '').trim().replace(/[\/:*?"<>|]/g, ' ').slice(0, 70);
    return base || 'Audit sans adresse';
  }

  // ── Dépôt ────────────────────────────────────────────────────────────────

  /**
   * Envoie l'audit ouvert. Met à jour le fichier existant s'il y en a un,
   * plutôt que d'accumuler des doublons à chaque envoi.
   */
  async push(): Promise<RemoteAudit> {
    const audit = this.data.currentAudit;
    if (!audit) throw new Error('Aucun audit ouvert.');

    const payload = await this.data.buildExportPayload();
    const contenu = JSON.stringify(payload);
    const nom = this.nomDeFichier(audit);

    const existant = await this.findByAuditId(audit.Id);
    const limite = '-------sobrieau' + Date.now();

    // Un fichier existant conserve son emplacement : on ne renvoie pas `parents`,
    // que l'API refuse en mise à jour.
    const metadonnees: Record<string, unknown> = {
      name: nom,
      appProperties: { [TAG]: audit.Id },
    };
    if (!existant) {
      metadonnees['parents'] = [await this.ensureFolder()];
      metadonnees['mimeType'] = 'application/json';
    }

    const corps =
      `--${limite}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadonnees) +
      `\r\n--${limite}\r\nContent-Type: application/json\r\n\r\n${contenu}\r\n--${limite}--`;

    const url = existant
      ? `${UPLOAD}/${existant.fileId}?uploadType=multipart&fields=id,name,modifiedTime,appProperties`
      : `${UPLOAD}?uploadType=multipart&fields=id,name,modifiedTime,appProperties`;

    const r = await (
      await this.call(url, {
        method: existant ? 'PATCH' : 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${limite}` },
        body: corps,
      })
    ).json();

    return {
      fileId: r.id,
      name: r.name,
      auditId: audit.Id,
      modifiedTime: r.modifiedTime ?? new Date().toISOString(),
    };
  }

  // ── Relecture ────────────────────────────────────────────────────────────

  /** Audits présents sur le Drive, du plus récemment modifié au plus ancien. */
  async list(): Promise<RemoteAudit[]> {
    const q = encodeURIComponent(`trashed=false and mimeType='application/json'`);
    const r = await (
      await this.call(
        `${FILES}?q=${q}&orderBy=modifiedTime desc&pageSize=100` +
          `&fields=files(id,name,modifiedTime,appProperties)`
      )
    ).json();

    return (r.files ?? []).map((f: Record<string, never>) => ({
      fileId: f['id'],
      name: f['name'],
      auditId: (f['appProperties'] as Record<string, string> | undefined)?.[TAG] ?? null,
      modifiedTime: f['modifiedTime'],
    }));
  }

  /**
   * Récupère un audit du Drive.
   *
   * Il est intégré comme un **nouvel audit local** : écraser celui en cours
   * ferait perdre une saisie de terrain non encore envoyée, ce qui serait bien
   * pire que de créer un doublon que l'auditeur peut supprimer.
   */
  async pull(fileId: string): Promise<AuditSummary> {
    const r = await this.call(`${FILES}/${fileId}?alt=media`);
    return this.data.importPayload(await r.json());
  }

  /** Retire un audit du Drive. Le local n'est pas touché. */
  async remove(fileId: string): Promise<void> {
    await this.call(`${FILES}/${fileId}`, { method: 'DELETE' });
  }

  // ── Outils ───────────────────────────────────────────────────────────────

  private async findByAuditId(auditId: string): Promise<RemoteAudit | null> {
    const q = encodeURIComponent(
      `appProperties has { key='${TAG}' and value='${auditId}' } and trashed=false`
    );
    const r = await (await this.call(`${FILES}?q=${q}&fields=files(id,name,modifiedTime)`)).json();
    if (!r.files?.length) return null;

    const f = r.files[0];
    return { fileId: f.id, name: f.name, auditId, modifiedTime: f.modifiedTime };
  }

  /** Nom lisible sur le Drive : l'adresse, à défaut la date. */
  private nomDeFichier(audit: AuditSummary): string {
    const base = (audit.Adresse || '').trim().replace(/[\\/:*?"<>|]/g, ' ').slice(0, 80);
    const jour = (audit.Date || audit.UpdatedAt || '').slice(0, 10);
    return `sobrieau - ${base || 'audit sans adresse'}${jour ? ' - ' + jour : ''}.json`;
  }
}
