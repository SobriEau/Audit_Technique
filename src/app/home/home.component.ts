import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../core/services/data.service';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';
import { RichEditorComponent } from '../shared/components/rich-editor/rich-editor.component';
import { DictationFieldComponent } from '../shared/components/dictation-field/dictation-field.component';
import { PlanManagerComponent } from '../shared/components/plan-manager/plan-manager.component';
import { PhotoEditorComponent } from '../shared/components/photo-editor/photo-editor.component';
import { AssetRef, AuditSummary, NiveauRemplissage } from '../models/data.models';
import { PhotoMode, photoMode, setPhotoMode } from '../core/utils/photo-mode';
import { UTILISATIONS_EAU, UtilisationEau } from '../models/utilisations-eau';
import { AUDIT_SCHEMA } from '../models/audit-schema';
import { EntityDef } from '../models/field.models';

/** Question posée à l'auditeur quand un changement d'adresse est ambigu. */
type Arbitrage =
  | { genre: 'existe'; adresse: string; cible: AuditSummary }
  | { genre: 'inedite'; adresse: string };

/**
 * Accueil du projet ouvert : identité de l'audit (adresse, nom, auditeur…),
 * plans et photos. Le choix du projet lui-même (reprendre / créer / charger)
 * vit désormais sur l'accueil général (`AccueilComponent`, route `/accueil`) —
 * les deux étaient mélangés ici avant la scission (retours KAPT, Victor,
 * Sacha — réunion du 260818).
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    FormsModule,
    PageHeaderComponent,
    RichEditorComponent,
    DictationFieldComponent,
    PlanManagerComponent,
    PhotoEditorComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  adresse = '';
  nomProjet = '';
  nomSite = '';
  info = '';
  date = '';
  auditeur = '';
  accompagnant = '';
  effectif = '';
  photos: AssetRef[] = [];

  /** Sert uniquement à proposer les adresses déjà connues (datalist) ci-dessous. */
  audits: AuditSummary[] = [];

  /** Les dix utilisations de l'eau que le classeur fait déclarer. */
  readonly utilisations: UtilisationEau[] = UTILISATIONS_EAU;

  /** Utilisations cochées. Une clé absente vaut « non cochée ». */
  usages: Record<string, boolean> = {};

  /**
   * Entités hors classeur (le surpresseur) : aucun usage de l'eau ne les
   * commande, elles s'affichent d'une case à part. Leur onglet a disparu en V3
   * mais origin/main les a conservées, masquées par défaut — décision reprise
   * à la fusion (voir `fusion-origin-main.md`).
   */
  readonly horsClasseur: EntityDef[] = AUDIT_SCHEMA.filter((e) => e.horsClasseur);

  /** Présence déclarée des entités hors classeur. Une clé absente vaut « masqué ». */
  presence: Record<string, boolean> = {};

  /** Niveau de remplissage des fiches de l'audit technique. */
  niveau: NiveauRemplissage = 'complet';

  /** Non nul tant que l'auditeur n'a pas tranché un changement d'adresse. */
  arbitrage: Arbitrage | null = null;

  /** Où ranger les photos ajoutées. Voir `photo-mode.ts`. */
  mode: PhotoMode = photoMode();

  constructor(private dataService: DataService, private router: Router) {}

  ngOnInit(): void {
    this.recharger();
  }

  private recharger(): void {
    const d = this.dataService.data;
    this.adresse = d.Adresse ?? '';
    this.nomProjet = d.NomProjet ?? '';
    this.nomSite = d.NomSite ?? '';
    this.info = d.Info ?? '';
    this.date = d.Date ?? '';
    this.auditeur = d.Auditeur ?? '';
    this.accompagnant = d.Accompagnant ?? '';
    this.effectif = d.Effectif ?? '';
    this.photos = d.Photos ?? [];
    this.usages = { ...(d.UtilisationsEau ?? {}) };
    this.presence = { ...(d.EquipementsPresents ?? {}) };
    this.niveau = d.NiveauRemplissage ?? 'complet';
    this.audits = this.dataService.listAudits();
    this.arbitrage = null;
  }

  estCoche(key: string): boolean {
    return this.usages[key] === true;
  }

  /**
   * Une entité hors classeur est affichée si l'auditeur l'a demandé, ou si elle
   * contient déjà des éléments — un audit commencé sous l'ancien classeur ne
   * doit pas voir disparaître ce qu'il a saisi.
   */
  estAffiche(key: string): boolean {
    return this.presence[key] === true || this.dataService.getEntities(key).length > 0;
  }

  changerPresence(key: string, affiche: boolean): void {
    this.presence = { ...this.presence, [key]: affiche };
    this.dataService.data.EquipementsPresents = this.presence;
    this.dataService.save();
  }

  /**
   * Cocher une utilisation fait apparaître la ou les sections correspondantes
   * du tableau de bord. La décocher ne masque qu'une section vide : une
   * saisie déjà faite reste toujours atteignable (voir `QteIndexComponent`).
   */
  changerUsage(key: string, coche: boolean): void {
    this.usages = { ...this.usages, [key]: coche };
    this.dataService.data.UtilisationsEau = this.usages;
    this.dataService.save();
  }

  /** Niveau de remplissage choisi pour les fiches de l'audit technique. */
  changerNiveau(niveau: NiveauRemplissage): void {
    this.niveau = niveau;
    this.dataService.data.NiveauRemplissage = niveau;
    this.dataService.save();
  }

  /** Titre affiché dans l'en-tête : le nom du projet plutôt qu'un intitulé générique. */
  get titre(): string {
    return this.nomProjet.trim() || this.adresse.trim() || 'Nouveau projet';
  }

  // ── Adresse ──────────────────────────────────────────────────────────────

  /**
   * Le rapprochement se fait à la sortie du champ, jamais à la frappe : saisir
   * une adresse caractère par caractère créerait autant d'audits fantômes.
   *
   * Trois cas, et un seul pose une question :
   *   - clé normalisée inchangée (casse, accents, ponctuation) : simple renommage ;
   *   - audit vide : renommage, il n'y a rien à perdre ;
   *   - sinon : on demande, parce que « je corrige une faute de frappe » et
   *     « je passe à un autre bâtiment » produisent le même événement.
   */
  onAdresseBlur(): void {
    const saisie = this.adresse.trim();
    this.arbitrage = null;

    if (this.dataService.isSameAddress(saisie)) {
      this.dataService.renameCurrentAudit(saisie);
      return;
    }

    const existant = this.dataService.findAuditByAddress(saisie);
    if (existant) {
      this.arbitrage = { genre: 'existe', adresse: saisie, cible: existant };
      return;
    }

    if (this.dataService.currentIsEmpty) {
      this.dataService.renameCurrentAudit(saisie);
      return;
    }

    this.arbitrage = { genre: 'inedite', adresse: saisie };
  }

  /** Ouvre l'audit déjà enregistré à cette adresse. */
  arbitrerOuvrir(): void {
    if (this.arbitrage?.genre !== 'existe') return;
    this.dataService.openAudit(this.arbitrage.cible.Id);
    this.recharger();
  }

  /** Conserve les données en cours et change simplement leur adresse. */
  arbitrerRenommer(): void {
    if (!this.arbitrage) return;
    this.dataService.renameCurrentAudit(this.arbitrage.adresse);
    this.recharger();
  }

  /** Archive l'audit en cours et en commence un neuf à cette adresse. */
  arbitrerNouveau(): void {
    if (!this.arbitrage) return;
    this.dataService.newAudit(this.arbitrage.adresse);
    this.recharger();
  }

  /** Abandonne le changement : on remet l'adresse enregistrée. */
  arbitrerAnnuler(): void {
    this.adresse = this.dataService.data.Adresse ?? '';
    this.arbitrage = null;
  }

  // ── Saisie courante ──────────────────────────────────────────────────────

  autoSave(): void {
    const d = this.dataService.data;
    d.NomProjet = this.nomProjet || null;
    d.NomSite = this.nomSite || null;
    d.Info = this.info || null;
    d.Date = this.date || null;
    d.Auditeur = this.auditeur || null;
    d.Accompagnant = this.accompagnant || null;
    d.Effectif = this.effectif || null;
    this.dataService.save();
  }

  changerMode(m: string): void {
    this.mode = m === 'fichiers' ? 'fichiers' : 'indexeddb';
    setPhotoMode(this.mode);
  }

  /** La galerie générale est enregistrée dès qu'une photo est ajoutée ou retirée. */
  onPhotosChange(): void {
    this.dataService.setPhotos(this.photos);
  }

  nav(path: string): void {
    this.router.navigate([path]);
  }
}
