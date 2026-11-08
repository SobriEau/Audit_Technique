import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../core/services/data.service';
import { ArchiveService, RapportArchive } from '../core/services/archive.service';
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
  imports: [FormsModule, PageHeaderComponent, DriveActionsComponent],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.scss',
})
export class AccueilComponent implements OnInit {
  readonly logoCerema = LOGO_CEREMA;
  readonly logoAgro = LOGO_AGROPARISTECH;
  readonly logoFinanceurs = LOGO_FINANCEURS;
  readonly logoPonts = LOGO_PONTS_IPPARIS;

  audits: AuditSummary[] = [];

  /**
   * Embarquer les images dans chaque `audit.json` de l'archive.
   *
   * Coché, chaque dossier d'audit devient réutilisable seul : son JSON
   * s'importe ailleurs sans ses fichiers voisins. Décoché, l'archive est deux
   * fois plus légère, mais un JSON sorti de son dossier a perdu ses images.
   * Coché par défaut : une archive qu'on déplie pour en extraire un audit est
   * l'usage le plus probable, et un JSON muet serait une mauvaise surprise.
   */
  imagesDansJson = true;

  occupe = '';
  archive: RapportArchive | null = null;
  erreurArchive: string | null = null;

  constructor(
    private dataService: DataService,
    private archiveService: ArchiveService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Produit l'archive complète : l'application à la racine, un dossier par
   * audit. Voir `ArchiveService`.
   */
  async exporterArchive(): Promise<void> {
    this.erreurArchive = null;
    this.archive = null;
    try {
      this.archive = await this.archiveService.construire(this.imagesDansJson, (texte) => {
        this.occupe = texte;
        this.cdr.markForCheck();
      });
    } catch (e) {
      this.erreurArchive = e instanceof Error ? e.message : String(e);
    } finally {
      this.occupe = '';
      this.cdr.markForCheck();
    }
  }

  get totalImages(): number {
    return (this.archive?.audits ?? []).reduce((n, a) => n + a.images, 0);
  }

  get totalManquantes(): number {
    return (this.archive?.audits ?? []).reduce((n, a) => n + a.manquantes, 0);
  }

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
