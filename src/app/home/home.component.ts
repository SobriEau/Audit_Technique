import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../core/services/data.service';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';
import { RichEditorComponent } from '../shared/components/rich-editor/rich-editor.component';
import { PlanManagerComponent } from '../shared/components/plan-manager/plan-manager.component';
import { PhotoEditorComponent } from '../shared/components/photo-editor/photo-editor.component';
import { AssetRef, AuditSummary } from '../models/data.models';

/** Question posée à l'auditeur quand un changement d'adresse est ambigu. */
type Arbitrage =
  | { genre: 'existe'; adresse: string; cible: AuditSummary }
  | { genre: 'inedite'; adresse: string };

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
  info = '';
  date = '';
  auditeur = '';
  photos: AssetRef[] = [];

  audits: AuditSummary[] = [];

  /** Non nul tant que l'auditeur n'a pas tranché un changement d'adresse. */
  arbitrage: Arbitrage | null = null;

  constructor(private dataService: DataService, private router: Router) {}

  ngOnInit(): void {
    this.recharger();
  }

  private recharger(): void {
    const d = this.dataService.data;
    this.adresse = d.Adresse ?? '';
    this.info = d.Info ?? '';
    this.date = d.Date ?? '';
    this.auditeur = d.Auditeur ?? '';
    this.photos = d.Photos ?? [];
    this.audits = this.dataService.listAudits();
    this.arbitrage = null;
  }

  get auditCourantId(): string {
    return this.dataService.currentAuditId;
  }

  /** Libellé d'un audit dans la liste : l'adresse, ou un repère à défaut. */
  libelle(a: AuditSummary): string {
    return a.Adresse?.trim() || `Audit sans adresse (${a.Date ?? a.UpdatedAt.slice(0, 10)})`;
  }

  // ── Changement d'audit ───────────────────────────────────────────────────

  ouvrirAudit(id: string): void {
    if (!id || id === this.auditCourantId) return;
    this.dataService.openAudit(id);
    this.recharger();
  }

  nouvelAudit(): void {
    this.dataService.newAudit();
    this.recharger();
  }

  async supprimerAudit(): Promise<void> {
    const nom = this.adresse.trim() || 'cet audit';
    if (!confirm(`Supprimer définitivement « ${nom} », photos et plans compris ?`)) return;

    await this.dataService.deleteAudit(this.auditCourantId);
    this.recharger();
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
      this.audits = this.dataService.listAudits();
      return;
    }

    const existant = this.dataService.findAuditByAddress(saisie);
    if (existant) {
      this.arbitrage = { genre: 'existe', adresse: saisie, cible: existant };
      return;
    }

    if (this.dataService.currentIsEmpty) {
      this.dataService.renameCurrentAudit(saisie);
      this.audits = this.dataService.listAudits();
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
    d.Info = this.info || null;
    d.Date = this.date || null;
    d.Auditeur = this.auditeur || null;
    this.dataService.save();
    this.audits = this.dataService.listAudits();
  }

  /** La galerie générale est enregistrée dès qu'une photo est ajoutée ou retirée. */
  onPhotosChange(): void {
    this.dataService.setPhotos(this.photos);
  }

  nav(path: string): void {
    this.router.navigate([path]);
  }
}
