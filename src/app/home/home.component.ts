import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../core/services/data.service';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';
import { RichEditorComponent } from '../shared/components/rich-editor/rich-editor.component';
import { PlanManagerComponent } from '../shared/components/plan-manager/plan-manager.component';
import { PhotoEditorComponent } from '../shared/components/photo-editor/photo-editor.component';
import { AssetRef, AuditSummary, NiveauRemplissage } from '../models/data.models';
import { PhotoMode, photoMode, setPhotoMode } from '../core/utils/photo-mode';
import { AUDIT_SCHEMA } from '../models/audit-schema';
import { EntityDef } from '../models/field.models';

/** Question posée à l'auditeur quand un changement d'adresse est ambigu. */
type Arbitrage =
  | { genre: 'existe'; adresse: string; cible: AuditSummary }
  | { genre: 'inedite'; adresse: string };

/**
 * Présents dans presque tous les bâtiments : ces sections restent toujours
 * affichées sur le tableau de bord, sans case à cocher. Toutes les autres
 * sont des équipements dont la présence varie et se déclarent ci-dessous.
 */
const TOUJOURS_PRESENT = ['releve_compteur_general', 'robinets', 'wc'];

/**
 * Équipements absents de la V3 du classeur (2026-08-21) sans équivalent
 * intégré ailleurs : masqués par défaut sur le tableau de bord, mais
 * réactivables d'une simple case, comme n'importe quel équipement — voir
 * `estPresent()`. Une section qui contient déjà des éléments reste affichée
 * malgré tout (`QteIndexComponent.isVisible` porte cette règle), donc un
 * audit démarré sous l'ancien classeur n'est pas concerné par ce masquage.
 *
 * Le réducteur de pression n'y figure pas : son contenu est désormais un bloc
 * conditionnel intégré à la fiche Compteur général, la fiche à part a été
 * retirée du schéma plutôt que masquée (décision Sacha, 2026-09).
 */
const MASQUE_PAR_DEFAUT = ['surpresseurs'];

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
  photos: AssetRef[] = [];

  /** Sert uniquement à proposer les adresses déjà connues (datalist) ci-dessous. */
  audits: AuditSummary[] = [];

  /** Équipements dont la présence peut varier d'un bâtiment à l'autre. */
  readonly equipements: EntityDef[] = AUDIT_SCHEMA.filter(
    (e) => !e.single && !TOUJOURS_PRESENT.includes(e.key)
  );

  /** Présence déclarée par équipement. Une clé absente vaut présent (sauf `MASQUE_PAR_DEFAUT`). */
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
    this.photos = d.Photos ?? [];
    this.presence = { ...(d.EquipementsPresents ?? {}) };
    this.niveau = d.NiveauRemplissage ?? 'complet';
    this.audits = this.dataService.listAudits();
    this.arbitrage = null;
  }

  /**
   * Une clé absente de `presence` vaut présent — sauf pour les équipements de
   * `MASQUE_PAR_DEFAUT`, absents de la V3 du classeur, masqués par défaut à
   * moins de contenir déjà des éléments (audit démarré sous l'ancien classeur).
   */
  estPresent(key: string): boolean {
    const declare = this.presence[key];
    if (declare !== undefined) return declare;
    if (MASQUE_PAR_DEFAUT.includes(key)) return this.dataService.getEntities(key).length > 0;
    return true;
  }

  changerPresence(key: string, present: boolean): void {
    this.presence = { ...this.presence, [key]: present };
    this.dataService.data.EquipementsPresents = this.presence;
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
