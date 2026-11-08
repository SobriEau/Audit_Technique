import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { Piece, PlanLocation } from '../../../models/data.models';
import { DictationFieldComponent } from '../dictation-field/dictation-field.component';
import { PlanLocatorComponent } from '../plan-locator/plan-locator.component';

/**
 * Pièces du bâtiment : création, nommage, repérage sur les plans.
 *
 * C'est le temps de **préparation** de l'audit, avant la visite : on reprend
 * les pièces du plan, on les nomme comme elles y figurent, et on les y
 * pointe. Les points d'eau de chaque pièce se déclarent ensuite sur la page
 * de la pièce — une pièce vide reste parfaitement légitime, l'auditeur y
 * ajoutera ce qu'il trouve sur place.
 *
 * Le même composant sert l'accueil du projet (panneau de préparation) et la
 * page `#/pieces` (entrée par pièce pendant la visite) : la liste y est la
 * même, et deux copies auraient divergé.
 */
@Component({
  selector: 'app-piece-manager',
  standalone: true,
  imports: [FormsModule, DictationFieldComponent, PlanLocatorComponent],
  templateUrl: './piece-manager.component.html',
  styleUrl: './piece-manager.component.scss',
})
export class PieceManagerComponent implements OnInit {
  pieces: Piece[] = [];

  /** Nombre de points d'eau par pièce, recalculé après chaque modification. */
  compte: Record<string, number> = {};

  /** Pièce dont le volet de réglages (niveau, plan, remarques) est ouvert. */
  deplie: string | null = null;

  constructor(
    private data: DataService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.recharger();
  }

  private recharger(): void {
    this.pieces = [...this.data.getPieces()];
    this.compte = {};
    for (const p of this.pieces) {
      this.compte[p.Id] = Object.values(this.data.countsByPiece(p.Id)).reduce((a, b) => a + b, 0);
    }
    this.cdr.markForCheck();
  }

  get aDesPlans(): boolean {
    return this.data.getPlans().length > 0;
  }

  /**
   * Ajoute une pièce et ouvre aussitôt son volet : une pièce sans nom ne sert
   * à rien, et l'auditeur vient d'exprimer son intention de la nommer.
   */
  ajouter(): void {
    const piece = this.data.createPiece();
    this.deplie = piece.Id;
    this.recharger();
  }

  basculer(id: string): void {
    this.deplie = this.deplie === id ? null : id;
  }

  /** Enregistré à la volée : cette page n'a pas de bouton « Valider ». */
  enregistrer(): void {
    this.data.setPieces(this.pieces);
  }

  localiser(piece: Piece, location: PlanLocation | null): void {
    piece.Localisation = location;
    this.enregistrer();
  }

  /** Points d'eau de la pièce : c'est là que se fait la déclaration. */
  ouvrir(piece: Piece): void {
    this.router.navigate(['/pieces', piece.Id]);
  }

  /**
   * Supprime une pièce. Les points d'eau qu'elle désignait sont conservés et
   * simplement détachés — c'est dit avant, parce que rien ne le laisserait
   * devenir : on supprime une pièce pour réorganiser, pas pour effacer un
   * relevé.
   */
  supprimer(piece: Piece): void {
    const n = this.compte[piece.Id] ?? 0;
    const nom = (piece.Nom || '').trim() || 'cette pièce sans nom';
    const avertissement = n
      ? `\n\n${n} point(s) d'eau y sont rattachés : ils ne seront pas supprimés, ` +
        'mais se retrouveront sans pièce. Ils restent accessibles par la liste de leur type.'
      : '';
    if (!confirm(`Supprimer « ${nom} » ?${avertissement}`)) return;

    this.data.deletePiece(piece.Id);
    if (this.deplie === piece.Id) this.deplie = null;
    this.recharger();
  }

  /** Nom du plan où la pièce est pointée, pour l'afficher sans ouvrir le plan. */
  nomPlan(piece: Piece): string {
    const planId = piece.Localisation?.planId;
    return planId ? this.data.findPlan(planId)?.name ?? '' : '';
  }
}
