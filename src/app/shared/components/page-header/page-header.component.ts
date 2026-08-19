import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { LOGO_AGROPARISTECH, LOGO_CEREMA, LOGO_SOBRIEAU } from '../../logos';
import { DriveActionsComponent } from '../drive-actions/drive-actions.component';
import { storageAvailable } from '../../../core/utils/safe-storage';

/**
 * Composant partagé : en-tête SobriEau.
 *
 * Rend deux bandeaux :
 *  1. la barre de marque — logotype, partenaires, et les actions
 *     d'enregistrement, de chargement et de compte — toujours présente ;
 *  2. la barre de navigation de page (Accueil / titre de page / Retour),
 *     rendue uniquement si [pageTitle] est fourni.
 *
 * L'accueil n'affiche donc que la barre de marque : il lui suffit d'omettre
 * [pageTitle], puisqu'il n'a pas de page parente vers laquelle revenir.
 *
 * Usage :
 *   <app-page-header />                                        (accueil)
 *   <app-page-header pageTitle="Robinets" [backTo]="['/qte']" />  (autres)
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [DriveActionsComponent],
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

  /**
   * Certains postes refusent l'accès au stockage. L'application reste
   * utilisable, mais rien ne survit à la fermeture : il faut le dire avant que
   * l'auditeur ne remplisse un audit entier.
   */
  readonly stockageIndisponible = !storageAvailable();

  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/home']);
  }

  goBack(): void {
    this.router.navigate(this.backTo);
  }

}
