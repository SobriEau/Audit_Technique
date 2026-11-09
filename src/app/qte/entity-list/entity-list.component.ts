import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EntityFormComponent } from '../entity-form/entity-form.component';
import { FormsModule } from '@angular/forms';
import { AuditFieldComponent } from '../../shared/components/audit-field/audit-field.component';
import { entityByKey, entityByRoute } from '../../models/audit-schema';
import { EntityDef, FieldDef } from '../../models/field.models';
import { AuditEntity } from '../../models/data.models';
import { FormSection, buildSections, cleAutre, formFields } from '../form-layout';
import { Total, totaux } from '../totaux';
import { valeurAffichee } from '../affichage';
import { champsManquants } from '../exigences';
import { AssetRef } from '../../models/data.models';

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
  imports: [FormsModule, PageHeaderComponent, EntityFormComponent, AuditFieldComponent],
  templateUrl: './entity-list.component.html',
  styleUrl: './entity-list.component.scss',
})
export class EntityListComponent implements OnInit {
  def!: EntityDef;
  items: AuditEntity[] = [];
  columns: FieldDef[] = [];

  /**
   * Entité rendue **en tête de cette page**, quand le classeur en décrit une.
   *
   * Un seul cas : la zone piscine — pédiluve et nettoyage des plages — que
   * l'onglet « Liste Piscines » décrit sous le tableau des bassins, parce
   * qu'elle vaut pour l'ensemble de la zone et non pour chaque bassin.
   */
  preambule: EntityDef | null = null;
  preambuleSections: FormSection[] = [];
  private preambuleValeurs: Record<string, unknown> = {};

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

      this.preambule = def.preambule ? entityByKey(def.preambule) ?? null : null;
      this.preambuleSections = this.preambule ? buildSections(formFields(this.preambule.fields)) : [];
      this.preambuleValeurs = this.preambule ? { ...this.data.getSingle(this.preambule.key) } : {};

      this.reload();
    });
  }

  valeurPreambule(f: FieldDef): unknown {
    return this.preambuleValeurs[f.key] ?? null;
  }

  /**
   * Enregistré à la volée, sans bouton : cette page n'a pas de « Valider »,
   * l'auditeur en repart en ouvrant la fiche d'un bassin.
   */
  changerPreambule(f: FieldDef, valeur: unknown): void {
    if (!this.preambule) return;
    this.preambuleValeurs[f.key] = valeur;
    this.data.setSingle(this.preambule.key, this.preambuleValeurs);
  }

  autrePreambule(f: FieldDef): string | null {
    return (this.preambuleValeurs[cleAutre(f)] as string | null) ?? null;
  }

  changerAutrePreambule(f: FieldDef, texte: string | null): void {
    if (!this.preambule) return;
    this.preambuleValeurs[cleAutre(f)] = texte;
    this.data.setSingle(this.preambule.key, this.preambuleValeurs);
  }

  parOptionPreambule(f: FieldDef): Record<string, string> | null {
    return f.parOption ? ((this.preambuleValeurs[f.parOption.cle] as Record<string, string> | null) ?? null) : null;
  }

  changerParOptionPreambule(f: FieldDef, saisies: Record<string, string> | null): void {
    if (!this.preambule || !f.parOption) return;
    this.preambuleValeurs[f.parOption.cle] = saisies;
    this.data.setSingle(this.preambule.key, this.preambuleValeurs);
  }

  /** Totaux en tête de tableau (nombre de robinets, surfaces…). */
  totaux: Total[] = [];

  private reload(): void {
    this.items = [...this.data.getEntities(this.def.key)];
    this.totaux = totaux(this.def.key, this.items);
  }

  /** Intitulé de colonne : celui du champ, sauf s'il est trop long pour un en-tête. */
  columnLabel(field: FieldDef): string {
    return this.def.listColumnLabels?.[field.key] ?? field.label;
  }

  /** Rend une valeur lisible dans le tableau — voir `affichage.ts`. */
  display(item: AuditEntity, field: FieldDef): string {
    return valeurAffichee(item, field, (entite, id) => this.data.getEntity(entite, id));
  }

  /**
   * Pièce de l'élément, affichée en tête de ligne quand l'audit en définit.
   *
   * Une colonne de plus sur une liste déjà large, mais sans elle la liste par
   * type et l'entrée par pièce ne se recoupent nulle part : impossible de voir
   * qu'un robinet a été oublié dans une pièce, ni où il se trouve.
   */
  get avecPieces(): boolean {
    return this.data.getPieces().length > 0;
  }

  pieceDe(item: AuditEntity): string {
    return this.data.pieceLabel(item['Piece'] as string | null | undefined);
  }

  /**
   * Colonne « Bâtiment », à partir de **deux** bâtiments : avec un seul, elle
   * répéterait la même valeur sur chaque ligne.
   */
  get avecBatiments(): boolean {
    return this.data.getBatiments().length > 1;
  }

  batimentDe(item: AuditEntity): string {
    return this.data.batimentLabel(this.data.batimentDeElement(item as unknown as Record<string, unknown>));
  }

  /**
   * État d'une ligne, pour qu'on voie d'un coup d'œil où il reste à travailler.
   *
   * Demandé deux fois — « ajouter une barre de progression pour afficher que la
   * ligne a été validée », « jauge de progression basée sur la présence d'une
   * photo ». Deux conditions, donc, et elles ne disent pas la même chose : une
   * fiche complète sans photo reste une fiche à repasser.
   *
   * La complétude s'appuie sur `champsManquants`, la fonction même qui refuse
   * l'enregistrement d'une fiche : l'indicateur ne peut donc pas annoncer
   * « complet » là où la validation dirait le contraire.
   */
  etat(item: AuditEntity): { complet: boolean; manquants: number; photos: number } {
    const manquants = champsManquants(this.def, item as unknown as Record<string, unknown>).length;
    const photos = ((item['Photos'] as AssetRef[]) ?? []).length;
    return { complet: manquants === 0, manquants, photos };
  }

  /** Infobulle de l'indicateur : ce qui manque, en clair. */
  etatTitre(item: AuditEntity): string {
    const e = this.etat(item);
    const parts = [
      e.complet ? 'champs obligatoires remplis' : `${e.manquants} champ(s) obligatoire(s) à remplir`,
      e.photos ? `${e.photos} photo(s)` : 'aucune photo',
    ];
    return parts.join(' — ');
  }

  deplacer(item: AuditEntity, sens: -1 | 1, event: MouseEvent): void {
    event.stopPropagation();
    if (this.data.moveEntity(this.def.key, item.Id, sens)) this.reload();
  }

  premier(item: AuditEntity): boolean {
    return this.items[0]?.Id === item.Id;
  }

  dernier(item: AuditEntity): boolean {
    return this.items[this.items.length - 1]?.Id === item.Id;
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
