import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { DataService } from '../../../core/services/data.service';
import {
  AuthState,
  DeviceChallenge,
  GoogleProfile,
  GoogleAuthService,
} from '../../../core/services/google-auth.service';
import { DriveSyncService, RemoteAudit } from '../../../core/services/drive-sync.service';

/** Menu ouvert sous un bouton, quand deux destinations sont possibles. */
type Menu = 'save' | 'load' | 'account' | null;

/**
 * Enregistrement, chargement et compte Google, dans l'en-tête.
 *
 * Hors connexion, « Enregistrer » et « Charger » agissent directement sur
 * l'appareil : inutile de demander à choisir quand il n'y a qu'une possibilité.
 * Une fois connecté, chaque bouton propose l'appareil ou le Drive.
 */
@Component({
  selector: 'app-drive-actions',
  standalone: true,
  templateUrl: './drive-actions.component.html',
  styleUrl: './drive-actions.component.scss',
})
export class DriveActionsComponent implements OnInit, OnDestroy {
  /** N'a de sens que sur l'accueil général : ailleurs il remplacerait l'audit ouvert. */
  @Input() showCharger = false;

  etat: AuthState = 'disconnected';
  profil: GoogleProfile | null = null;
  code: DeviceChallenge | null = null;

  menu: Menu = null;

  /** Liste distante, chargée à l'ouverture du sélecteur. */
  pickerOuvert = false;
  distants: RemoteAudit[] = [];

  occupe = '';
  message: string | null = null;
  erreur: string | null = null;

  private abos: Subscription[] = [];

  constructor(
    private data: DataService,
    private auth: GoogleAuthService,
    private drive: DriveSyncService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.abos.push(
      this.auth.state$.subscribe((e) => {
        this.etat = e;
        this.cdr.markForCheck();
      }),
      this.auth.profile$.subscribe((p) => {
        this.profil = p;
        this.cdr.markForCheck();
      }),
      this.auth.challenge$.subscribe((c) => {
        this.code = c;
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.abos.forEach((a) => a.unsubscribe());
  }

  get connecte(): boolean {
    return this.etat === 'connected';
  }

  get configure(): boolean {
    return this.etat !== 'unconfigured';
  }

  get erreurAuth(): string | null {
    return this.auth.errorMessage;
  }

  basculer(m: Menu): void {
    this.menu = this.menu === m ? null : m;
    this.message = null;
    this.erreur = null;
  }

  fermerMenu(): void {
    this.menu = null;
  }

  // ── Enregistrer ──────────────────────────────────────────────────────────

  /** Sans connexion, une seule destination : on n'impose pas un choix inutile. */
  async enregistrer(): Promise<void> {
    if (!this.connecte) return this.versAppareil();
    this.basculer('save');
  }

  async versAppareil(): Promise<void> {
    this.fermerMenu();
    await this.executer('Préparation du fichier…', async () => {
      const stamp = new Date().toISOString().slice(0, 10);
      await this.data.exportJson(`sobrieau-${stamp}`);
    });
  }

  async versDrive(): Promise<void> {
    this.fermerMenu();
    await this.executer("Envoi vers le Drive…", async () => {
      const r = await this.drive.push();
      this.message = `Envoyé : ${r.name}`;
    });
  }

  // ── Charger ──────────────────────────────────────────────────────────────

  charger(saisie: HTMLInputElement): void {
    if (!this.connecte) return saisie.click();
    this.basculer('load');
  }

  depuisAppareil(saisie: HTMLInputElement): void {
    this.fermerMenu();
    saisie.click();
  }

  async fichierChoisi(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    await this.executer('Lecture du fichier…', async () => {
      const s = await this.data.importJson(file);
      this.message = `Audit chargé : ${s.Adresse || 'sans adresse'}`;
      // Les pages affichées tiennent une copie locale des données ; on recharge
      // en pointant directement sur l'accueil du projet importé.
      window.location.hash = '/home';
      window.location.reload();
    });
  }

  async depuisDrive(): Promise<void> {
    this.fermerMenu();
    this.pickerOuvert = true;
    await this.executer('Lecture du Drive…', async () => {
      this.distants = await this.drive.list();
    });
  }

  fermerPicker(): void {
    this.pickerOuvert = false;
  }

  async recuperer(r: RemoteAudit): Promise<void> {
    if (
      !confirm(
        `Récupérer « ${r.name} » ?\n\n` +
          "Il sera ajouté comme nouvel audit ; celui en cours n'est pas touché."
      )
    ) {
      return;
    }
    await this.executer('Récupération…', async () => {
      await this.drive.pull(r.fileId);
      this.pickerOuvert = false;
      window.location.hash = '/home';
      window.location.reload();
    });
  }

  async supprimerDistant(r: RemoteAudit): Promise<void> {
    if (!confirm(`Supprimer « ${r.name} » du Drive ?\n\nLa copie locale est conservée.`)) return;
    await this.executer('Suppression…', async () => {
      await this.drive.remove(r.fileId);
      this.distants = await this.drive.list();
    });
  }

  // ── Compte ───────────────────────────────────────────────────────────────

  async connecter(): Promise<void> {
    this.fermerMenu();
    await this.auth.connect();
    this.cdr.markForCheck();
  }

  annulerConnexion(): void {
    this.auth.cancel();
  }

  async deconnecter(): Promise<void> {
    this.fermerMenu();
    if (!confirm('Se déconnecter et révoquer l’accès de SobriEau à votre Drive ?')) return;
    await this.auth.signOut();
    this.distants = [];
    this.cdr.markForCheck();
  }

  quand(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR').slice(0, 5);
  }

  private async executer(libelle: string, action: () => Promise<void>): Promise<void> {
    this.occupe = libelle;
    this.erreur = null;
    this.cdr.markForCheck();
    try {
      await action();
    } catch (e) {
      this.erreur = e instanceof Error ? e.message : String(e);
    } finally {
      this.occupe = '';
      this.cdr.markForCheck();
    }
  }
}
