import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PieceManagerComponent } from '../../shared/components/piece-manager/piece-manager.component';

/**
 * Entrée par pièce de l'audit technique.
 *
 * Le classeur est organisé par **type d'équipement** : un onglet « Robinets »,
 * un onglet « WC ». Sur le terrain, l'auditeur avance par **pièce** — il entre
 * dans un local et relève tout ce qu'il y voit (première visite terrain,
 * 2026-10). Cette page offre ce second chemin ; les listes par type demeurent,
 * et c'est volontaire : un réseau ECS, une toiture ou une structure ne sont
 * pas dans une pièce.
 */
@Component({
  selector: 'app-pieces-index',
  standalone: true,
  imports: [PageHeaderComponent, PieceManagerComponent],
  templateUrl: './pieces-index.component.html',
  styleUrl: './pieces-index.component.scss',
})
export class PiecesIndexComponent {
  constructor(private router: Router) {}

  nav(route: string): void {
    this.router.navigate([route]);
  }
}
