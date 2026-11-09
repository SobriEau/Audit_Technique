import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PlanLocatorComponent } from '../../shared/components/plan-locator/plan-locator.component';
import { AUDIT_SCHEMA } from '../../models/audit-schema';
import { EntityDef, FieldDef } from '../../models/field.models';
import { AuditEntity, Piece, PlanLocation } from '../../models/data.models';
import { sectionVisible } from '../../qte/sections-visibles';
import { valeurAffichee } from '../../qte/affichage';

/**
 * Points d'eau rattachés à une pièce.
 *
 * Deux usages pour un seul écran :
 *  - à la **préparation**, on y déclare les points d'eau que la pièce contient
 *    — les fiches sont créées vides, prêtes à être remplies ;
 *  - pendant la **visite**, on y retrouve ces fiches et on les ouvre une à une.
 *
 * C'est le même geste, et c'était la demande : « au lieu de rentrer élément
 * par élément, ils vont dans la pièce, choisissent l'élément et voient la
 * liste des points d'eau associés à cette pièce » (première visite terrain,
 * 2026-10).
 *
 * Les éléments ne sont pas rangés dans la pièce : ils restent dans la liste de
 * leur type et portent le renvoi `Piece`. Le JSON est donc inchangé, et un
 * audit reste lisible par une version qui ignore les pièces.
 */
@Component({
  selector: 'app-piece-detail',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, PlanLocatorComponent],
  templateUrl: './piece-detail.component.html',
  styleUrl: './piece-detail.component.scss',
})
export class PieceDetailComponent implements OnInit {
  /**
   * Entités qu'une pièce ne présente pas en tableau.
   *
   * « En tableau quand c'est ce qui est fait actuellement, comme quand on
   * rentrait directement les robinets, **mais pas pour le compteur général** »
   * (première visite terrain, 2026-10). Un bâtiment n'a qu'un compteur
   * général : un tableau d'une ligne et trois colonnes pour y accéder serait
   * une étape de plus sans rien montrer. Sa fiche s'ouvre directement.
   */
  private static readonly SANS_TABLEAU = new Set(['releve_compteur_general']);

  piece: Piece | null = null;

  /** Entités ayant au moins un élément dans cette pièce, dans l'ordre du classeur. */
  blocs: { def: EntityDef; colonnes: FieldDef[]; items: AuditEntity[]; tableau: boolean }[] = [];

  /** Entités qu'on peut ajouter à cette pièce, pour le sélecteur du bas. */
  ajoutables: EntityDef[] = [];

  /** Entité choisie dans le sélecteur d'ajout. */
  aAjouter = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private data: DataService
  ) {}

  /**
   * Abonnement aux paramètres, et non `snapshot` : Angular réutilise
   * l'instance du composant quand on passe d'une pièce à l'autre. Avec
   * `snapshot`, la page continuerait d'afficher — et de garnir — la pièce
   * précédente (même piège que sur les fiches, voir `entity-form`).
   */
  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const piece = this.data.findPiece(params['id'] as string);
      if (!piece) {
        this.router.navigate(['/pieces']);
        return;
      }
      this.piece = piece;
      this.recharger();
    });
  }

  private recharger(): void {
    if (!this.piece) return;
    const pieceId = this.piece.Id;
    const audit = this.data.data;

    this.blocs = [];
    this.ajoutables = [];

    for (const def of AUDIT_SCHEMA) {
      // Une fiche unique (la zone piscine) vaut pour tout le bâtiment : elle
      // n'appartient à aucune pièce.
      if (def.single) continue;

      const items = this.data.getEntitiesOfPiece(def.key, pieceId);
      if (items.length) {
        this.blocs.push({
          def,
          colonnes: def.listColumns
            .map((k) => def.fields.find((f) => f.key === k))
            .filter((f): f is FieldDef => !!f && f.key !== 'Numero'),
          items,
          tableau: !PieceDetailComponent.SANS_TABLEAU.has(def.key),
        });
      }

      // Proposé si la section est offerte à l'auditeur — même règle que le
      // tableau de bord, pour qu'un type atteignable là le soit ici aussi.
      if (sectionVisible(def, audit, this.data.getEntities(def.key).length)) {
        this.ajoutables.push(def);
      }
    }
  }

  get titre(): string {
    return this.piece ? this.data.pieceLabel(this.piece.Id) || 'Pièce' : 'Pièce';
  }

  /** Bâtiment de la pièce, affiché en tête quand l'établissement en compte plusieurs. */
  get batiment(): string {
    if (!this.piece || this.data.getBatiments().length < 2) return '';
    return this.data.batimentLabel(this.piece.Batiment);
  }

  get total(): number {
    return this.blocs.reduce((n, b) => n + b.items.length, 0);
  }

  get location(): PlanLocation | null {
    return this.piece?.Localisation ?? null;
  }

  onLocationChange(location: PlanLocation | null): void {
    if (!this.piece) return;
    this.piece.Localisation = location;
    this.data.updatePiece(this.piece);
  }

  display(item: AuditEntity, field: FieldDef): string {
    return valeurAffichee(item, field, (entite, id) => this.data.getEntity(entite, id));
  }

  libelleColonne(def: EntityDef, field: FieldDef): string {
    return def.listColumnLabels?.[field.key] ?? field.label;
  }

  /**
   * Ajoute un point d'eau déjà rattaché à la pièce, et ouvre sa fiche.
   *
   * À la préparation on enchaîne les ajouts sans ouvrir chaque fiche ; sur le
   * terrain on veut la remplir aussitôt. Le bouton du sélecteur ouvre donc la
   * fiche, et celui de chaque bloc se contente d'ajouter une ligne.
   */
  ajouterEtOuvrir(): void {
    const def = AUDIT_SCHEMA.find((d) => d.key === this.aAjouter);
    if (!def || !this.piece) return;
    const item = this.data.createEntity(def.key, this.piece.Id);
    this.router.navigate(['/qte', def.route, item.Id]);
  }

  ajouterLigne(def: EntityDef): void {
    if (!this.piece) return;
    this.data.createEntity(def.key, this.piece.Id);
    this.recharger();
  }

  ouvrir(def: EntityDef, item: AuditEntity): void {
    this.router.navigate(['/qte', def.route, item.Id]);
  }

  /** Détache l'élément de la pièce sans le supprimer : il a pu être mal rangé. */
  detacher(def: EntityDef, item: AuditEntity, event: MouseEvent): void {
    event.stopPropagation();
    const label = item.Numero ? `${def.singular} n° ${item.Numero}` : def.singular;
    if (!confirm(`Retirer ${label} de cette pièce ?\n\nLa fiche et ses saisies sont conservées : elle reste dans la liste ${def.plural}.`)) {
      return;
    }
    this.data.updateEntity(def.key, { ...item, Piece: null });
    this.recharger();
  }

  async supprimer(def: EntityDef, item: AuditEntity, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    const label = item.Numero ? `« n° ${item.Numero} »` : 'cet élément';
    if (!confirm(`Supprimer ${label} ?`)) return;
    await this.data.deleteEntity(def.key, item.Id);
    this.recharger();
  }

  nav(route: string): void {
    this.router.navigate([route]);
  }
}
