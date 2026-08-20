import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EntityFormComponent } from '../entity-form/entity-form.component';
import { entityByRoute } from '../../models/audit-schema';
import { EntityDef, FieldDef } from '../../models/field.models';
import { AuditEntity } from '../../models/data.models';

/**
 * Page index générique : liste les éléments d'une entité et mène à leur fiche.
 *
 * Correspond aux onglets « Liste … » du classeur, dont le comportement est
 * identique pour toutes les entités : colonnes alimentées par les fiches,
 * ajout, et clic sur une ligne pour ouvrir l'élément.
 */
@Component({
  selector: 'app-entity-list',
  standalone: true,
  imports: [PageHeaderComponent, EntityFormComponent],
  templateUrl: './entity-list.component.html',
  styleUrl: './entity-list.component.scss',
})
export class EntityListComponent implements OnInit {
  def!: EntityDef;
  items: AuditEntity[] = [];
  columns: FieldDef[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private data: DataService
  ) {}

  /**
   * On s'abonne aux paramètres plutôt que de lire `snapshot` : Angular réutilise
   * l'instance du composant quand on passe d'une entité à l'autre (même route,
   * paramètre différent). Avec `snapshot`, la page continuerait d'afficher — et
   * de modifier — l'entité précédente.
   */
  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const def = entityByRoute(params['entity'] as string);
      if (!def) {
        this.router.navigate(['/qte']);
        return;
      }

      this.def = def;
      this.columns = def.listColumns
        .map((k) => def.fields.find((f) => f.key === k))
        .filter((f): f is FieldDef => !!f);
      this.reload();
    });
  }

  private reload(): void {
    this.items = [...this.data.getEntities(this.def.key)];
  }

  /** Rend une valeur lisible dans le tableau, selon le type du champ. */
  display(item: AuditEntity, field: FieldDef): string {
    const v = (item as Record<string, unknown>)[field.key];
    if (v === null || v === undefined || v === '') return '';

    if (field.kind === 'boolean') return v ? 'Oui' : 'Non';

    if (field.kind === 'entity-ref' && field.refTo) {
      const target = this.data.getEntity(field.refTo, String(v));
      return target ? `n° ${target.Numero ?? '?'}` : '(élément supprimé)';
    }

    return String(v);
  }

  add(): void {
    const item = this.data.createEntity(this.def.key);
    this.router.navigate(['/qte', this.def.route, item.Id]);
  }

  open(item: AuditEntity): void {
    this.router.navigate(['/qte', this.def.route, item.Id]);
  }

  /**
   * Crée un nouvel élément reprenant tous les champs de celui-ci.
   *
   * Ni l'`Id` (attribué une fois pour toutes par `createEntity`), ni les
   * photos ne sont recopiés : deux éléments partageant les mêmes références
   * d'images se supprimeraient l'une l'autre au premier ménage (voir
   * `DataService.deleteEntity`).
   */
  duplicate(item: AuditEntity, event: MouseEvent): void {
    event.stopPropagation();
    const created = this.data.createEntity(this.def.key);
    const clone = { ...item, Id: created.Id, Numero: created.Numero, Photos: [] };
    this.data.updateEntity(this.def.key, clone as never);
    this.reload();
  }

  async remove(item: AuditEntity, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    const label = item.Numero ? `« n° ${item.Numero} »` : 'cet élément';
    if (!confirm(`Supprimer ${label} ?`)) return;

    await this.data.deleteEntity(this.def.key, item.Id);
    this.reload();
  }
}
