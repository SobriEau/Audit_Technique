import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { LOGO_AGROPARISTECH, LOGO_CEREMA, LOGO_SOBRIEAU } from '../../logos';

/**
 * Composant partagé : en-tête SobriEau.
 *
 * Rend deux bandeaux :
 *  1. la barre de marque (titre applicatif + import/export JSON), toujours
 *     présente ;
 *  2. la barre de navigation de page (Accueil / titre de page / Retour),
 *     rendue uniquement si [pageTitle] est fourni.
 *
 * L'accueil n'affiche donc que la barre de marque : il lui suffit d'omettre
 * [pageTitle], puisqu'il n'a pas de page parente vers laquelle revenir.
 *
 * Usage :
 *   <app-page-header [showImport]="true" />                     (accueil)
 *   <app-page-header pageTitle="Robinets" [backTo]="['/qte']" />  (autres)
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  readonly logoSobrieau = LOGO_SOBRIEAU;
  readonly logoCerema = LOGO_CEREMA;
  readonly logoAgro = LOGO_AGROPARISTECH;

  /** Titre de la page. S'il est absent, la barre de navigation n'est pas rendue. */
  @Input() pageTitle?: string;

  /** Cible du bouton « Retour ». Par défaut, la page parente est l'accueil. */
  @Input() backTo: string[] = ['/home'];

  @Input() showImport = false;
  @Input() showExport = true;

  constructor(private dataService: DataService, private router: Router) {}

  goHome(): void {
    this.router.navigate(['/home']);
  }

  goBack(): void {
    this.router.navigate(this.backTo);
  }

  /** Vrai pendant l'encodage des images, qui peut durer sur un gros audit. */
  busy = false;

  async onExport(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      await this.dataService.exportJson(`sobrieau-${stamp}`);
    } catch (err: unknown) {
      alert(
        "Erreur lors de l'export : " + (err instanceof Error ? err.message : String(err))
      );
    } finally {
      this.busy = false;
    }
  }

  async handleFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (
      !confirm(
        "L'import remplace l'audit en cours, photos et plans compris.\nContinuer ?"
      )
    ) {
      return;
    }

    this.busy = true;
    try {
      await this.dataService.importJson(file);
      alert('Données importées avec succès.');
      // Rechargement : les pages déjà affichées tiennent une copie locale.
      window.location.reload();
    } catch (err: unknown) {
      alert(
        "Erreur lors de l'import : " + (err instanceof Error ? err.message : String(err))
      );
    } finally {
      this.busy = false;
    }
  }
}
