import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { LOGO_SOBRIEAU } from '../../logos';
import { DriveActionsComponent } from '../drive-actions/drive-actions.component';
import { storageAvailable } from '../../../core/utils/safe-storage';
import { DataService } from '../../../core/services/data.service';

/** Un maillon du fil d'Ariane, au-delà de « Accueil » et du projet (fournis d'office). */
export interface Crumb {
  label: string;
  link?: string[];
}

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

  /** Titre de la page. S'il est absent, la barre de navigation n'est pas rendue. */
  @Input() pageTitle?: string;

  /** Cible du bouton « Retour ». Par défaut, la page parente est l'accueil du projet. */
  @Input() backTo: string[] = ['/home'];

  /**
   * Fil d'Ariane au-delà de « Accueil » et du projet en cours, fournis
   * automatiquement par ce composant. Vide : la barre affiche le titre simple
   * (Accueil / titre / Retour) ; renseigné : elle affiche le fil complet
   * jusqu'à cinq niveaux (Accueil > Projet > Section > … > page courante).
   */
  @Input() crumbs: Crumb[] = [];

  /**
   * Le bouton « Charger » n'a de sens que sur l'accueil général : ailleurs, il
   * remplacerait l'audit ouvert sans qu'on l'ait demandé. Seul l'accueil
   * général le passe à `true`.
   */
  @Input() showCharger = false;

  /**
   * Certains postes refusent l'accès au stockage. L'application reste
   * utilisable, mais rien ne survit à la fermeture : il faut le dire avant que
   * l'auditeur ne remplisse un audit entier.
   */
  readonly stockageIndisponible = !storageAvailable();

  constructor(private router: Router, private data: DataService) {}

  /** Nom affiché pour le projet en cours dans le fil d'Ariane. */
  get projectLabel(): string {
    const d = this.data.data;
    return d.NomProjet?.trim() || d.Adresse?.trim() || 'Projet';
  }

  /** Accueil général : choix du projet. */
  goHome(): void {
    this.router.navigate(['/accueil']);
  }

  /** Accueil du projet ouvert. */
  goProject(): void {
    this.router.navigate(['/home']);
  }

  goCrumb(link: string[]): void {
    this.router.navigate(link);
  }

  goBack(): void {
    this.router.navigate(this.backTo);
  }
}
