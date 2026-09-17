import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../core/services/data.service';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';
import { DriveActionsComponent } from '../shared/components/drive-actions/drive-actions.component';
import { LOGO_AGROPARISTECH, LOGO_CEREMA, LOGO_FINANCEURS, LOGO_PONTS_IPPARIS } from '../shared/logos';
import { AuditSummary } from '../models/data.models';

/**
 * Accueil général : ne fait que choisir un projet — reprendre un audit
 * existant, en créer un nouveau, ou en charger un depuis un fichier. Le
 * détail d'un audit (adresse, plans, photos…) vit sur l'accueil du projet
 * (`HomeComponent`, route `/home`), ouvert une fois le choix fait.
 *
 * Scindé de l'ancien accueil unique (retours KAPT, Victor, Sacha — réunion du
 * 260818) qui mélangeait les deux responsabilités.
 */
@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [PageHeaderComponent, DriveActionsComponent],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.scss',
})
export class AccueilComponent implements OnInit {
  readonly logoCerema = LOGO_CEREMA;
  readonly logoAgro = LOGO_AGROPARISTECH;
  readonly logoFinanceurs = LOGO_FINANCEURS;
  readonly logoPonts = LOGO_PONTS_IPPARIS;

  audits: AuditSummary[] = [];

  constructor(private dataService: DataService, private router: Router) {}

  ngOnInit(): void {
    this.audits = this.dataService.listAudits();
  }

  /** Libellé d'un audit dans la liste : son nom de projet, ou l'adresse à défaut. */
  libelle(a: AuditSummary): string {
    return (
      a.NomProjet?.trim() ||
      a.Adresse?.trim() ||
      `Audit sans nom (${a.Date ?? a.UpdatedAt.slice(0, 10)})`
    );
  }

  ouvrir(id: string): void {
    this.dataService.openAudit(id);
    this.router.navigate(['/home']);
  }

  nouveau(): void {
    this.dataService.newAudit();
    this.router.navigate(['/home']);
  }

  async supprimer(a: AuditSummary, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    if (!confirm(`Supprimer définitivement « ${this.libelle(a)} », photos et plans compris ?`)) {
      return;
    }
    await this.dataService.deleteAudit(a.Id);
    this.audits = this.dataService.listAudits();
  }
}
