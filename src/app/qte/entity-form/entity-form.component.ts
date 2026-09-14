import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { PageHeaderComponent, Crumb } from '../../shared/components/page-header/page-header.component';
import { AuditFieldComponent } from '../../shared/components/audit-field/audit-field.component';
import { PlanLocatorComponent } from '../../shared/components/plan-locator/plan-locator.component';
import { PhotoEditorComponent } from '../../shared/components/photo-editor/photo-editor.component';
import { entityByRoute } from '../../models/audit-schema';
import { EntityDef, FieldDef } from '../../models/field.models';
import { AssetRef, NiveauRemplissage, PlanLocation } from '../../models/data.models';

type Record_ = Record<string, unknown>;

/**
 * Regroupe les champs par ligne du classeur, en conservant leur ordre.
 *
 * Un champ marqué `wide`, ou dépourvu de `row`, occupe sa propre ligne. Les
 * autres se répartissent la largeur de la ligne qu'ils partagent.
 */
function groupByRow(fields: FieldDef[]): FieldDef[][] {
  const rows: FieldDef[][] = [];
  let currentRow: number | null = null;

  for (const f of fields) {
    if (f.wide || f.row === undefined) {
      rows.push([f]);
      currentRow = null;
      continue;
    }
    if (f.row !== currentRow) {
      rows.push([f]);
      currentRow = f.row;
    } else {
      rows[rows.length - 1].push(f);
    }
  }
  return rows;
}

/**
 * Un champ est visible à un niveau de remplissage donné d'après son
 * `requirement` (V3 du classeur). Un champ dépourvu de `requirement` (onglet
 * disparu, ou jamais reclassé) est traité comme `facultatif` : masqué dès
 * qu'on quitte le niveau complet, jamais exigé à la validation.
 */
function requirementVisible(req: FieldDef['requirement'], niveau: NiveauRemplissage): boolean {
  if (niveau === 'complet') return true;
  if (niveau === 'allege') return req === 'obligatoire' || req === 'recommande';
  return req === 'obligatoire';
}

/** Comparaison insensible à la casse et aux accents, pour le filtre du volet des champs masqués. */
function normalizeSearch(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Un champ sans valeur : chaîne vide (après espaces) ou `null`/`undefined`. 0 et `false` comptent comme répondus. */
function estVide(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  return false;
}

const NIVEAU_LABELS: Record<NiveauRemplissage, string> = {
  complet: 'Complet',
  allege: 'Allégée',
  minimal: 'Minimale',
};

/**
 * Fiche générique : rend le formulaire d'un élément à partir du schéma.
 *
 * Sert aussi bien les entités listées (robinets, WC, piscines…) que les pages
 * uniques (compteur général, collecte d'eau de pluie), signalées par
 * `single` dans le schéma.
 */
@Component({
  selector: 'app-entity-form',
  standalone: true,
  imports: [
    FormsModule,
    PageHeaderComponent,
    AuditFieldComponent,
    PlanLocatorComponent,
    PhotoEditorComponent,
  ],
  templateUrl: './entity-form.component.html',
  styleUrl: './entity-form.component.scss',
})
export class EntityFormComponent implements OnInit {
  def!: EntityDef;
  item: Record_ = {};

  /**
   * Champs regroupés par ligne du classeur : chaque sous-tableau est une ligne
   * du formulaire. C'est la disposition prescrite par le tableau Excel, et non
   * un remplissage automatique.
   */
  formRows: FieldDef[][] = [];

  /** Niveau de remplissage choisi sur l'accueil du projet. */
  niveau: NiveauRemplissage = 'complet';

  /**
   * Champs masqués par le niveau de remplissage, révélés malgré tout sur
   * cette fiche — depuis le volet dépliable, ou automatiquement parce
   * qu'obligatoires et laissés vides à la validation. Propre à la fiche
   * ouverte : rouvrir la page repart du niveau choisi.
   */
  revealed = new Set<string>();

  /** Filtre du volet des champs masqués par le niveau de remplissage. */
  filtreMasques = '';

  /** Champs obligatoires restés vides au dernier essai de validation. */
  champsManquants: FieldDef[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private data: DataService
  ) {}

  /**
   * Abonnement aux paramètres, et non `snapshot` : passer d'une fiche à l'autre
   * réutilise l'instance du composant. Sans cela, la fiche resterait figée sur
   * le premier élément ouvert et les saisies partiraient dans le mauvais.
   */
  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const def = entityByRoute(params['entity'] as string);
      if (!def) {
        this.router.navigate(['/qte']);
        return;
      }
      this.def = def;
      this.formRows = groupByRow(def.fields.filter((f) => f.kind !== 'photos' && f.kind !== 'plan'));
      this.niveau = this.data.data.NiveauRemplissage ?? 'complet';
      this.revealed = new Set();
      this.filtreMasques = '';
      this.champsManquants = [];

      if (def.single) {
        this.item = { ...this.data.getSingle(def.key) };
        this.item['Photos'] ??= [];
        return;
      }

      const id = params['id'] as string;
      const found = id ? this.data.getEntity(def.key, id) : undefined;
      if (!found) {
        alert("Cet élément n'existe plus.");
        this.router.navigate(['/qte', def.route]);
        return;
      }
      this.item = { ...(found as unknown as Record_) };
      this.item['Photos'] ??= [];
    });
  }

  get title(): string {
    if (this.def.single) return this.def.singular;
    const n = this.item['Numero'];
    return n ? `${this.def.singular} n° ${n}` : this.def.singular;
  }

  get backTo(): string[] {
    return this.def.single ? ['/qte'] : ['/qte', this.def.route];
  }

  get crumbs(): Crumb[] {
    if (!this.def) return [];
    if (this.def.single) {
      return [{ label: 'Audit technique', link: ['/qte'] }, { label: this.title }];
    }
    return [
      { label: 'Audit technique', link: ['/qte'] },
      { label: this.def.plural, link: ['/qte', this.def.route] },
      { label: this.title },
    ];
  }

  /**
   * Lignes du classeur jusqu'à celle d'Emplacement incluse, et le reste.
   * Sépare le point d'insertion du bloc de localisation, qui doit apparaître
   * juste après ce champ plutôt qu'en fin de fiche.
   */
  private get locationRowIndex(): number {
    return this.formRows.findIndex((row) => row.some((f) => f.key === 'Emplacement'));
  }

  get rowsBeforeLocation(): FieldDef[][] {
    const i = this.locationRowIndex;
    return i === -1 ? [] : this.formRows.slice(0, i + 1);
  }

  get rowsAfterLocation(): FieldDef[][] {
    const i = this.locationRowIndex;
    return i === -1 ? this.formRows : this.formRows.slice(i + 1);
  }

  /**
   * Un champ masqué par le niveau de remplissage en cours reste affiché s'il
   * a été révélé depuis le volet dépliable, ou automatiquement parce
   * qu'obligatoire et resté vide à la validation.
   */
  isVisible(f: FieldDef): boolean {
    return requirementVisible(f.requirement, this.niveau) || this.revealed.has(f.key);
  }

  private filterRows(rows: FieldDef[][]): FieldDef[][] {
    return rows.map((row) => row.filter((f) => this.isVisible(f))).filter((row) => row.length > 0);
  }

  get visibleRowsBeforeLocation(): FieldDef[][] {
    return this.filterRows(this.rowsBeforeLocation);
  }

  get visibleRowsAfterLocation(): FieldDef[][] {
    return this.filterRows(this.rowsAfterLocation);
  }

  /** Champs masqués par le niveau de remplissage en cours, pour le volet dépliable. */
  get hiddenFields(): FieldDef[] {
    return this.def.fields.filter((f) => f.kind !== 'photos' && f.kind !== 'plan' && !this.isVisible(f));
  }

  get hiddenFieldsFiltres(): FieldDef[] {
    const q = normalizeSearch(this.filtreMasques);
    if (!q) return this.hiddenFields;
    return this.hiddenFields.filter((f) => normalizeSearch(f.label).includes(q));
  }

  /** Affiche un champ masqué directement dans la fiche, sans changer le niveau choisi. */
  revealField(f: FieldDef): void {
    this.revealed.add(f.key);
  }

  get niveauLabel(): string {
    return NIVEAU_LABELS[this.niveau];
  }

  get photos(): AssetRef[] {
    return (this.item['Photos'] as AssetRef[]) ?? [];
  }

  get location(): PlanLocation | null {
    return (this.item['Localisation'] as PlanLocation | null) ?? null;
  }

  valueOf(field: FieldDef): unknown {
    return this.item[field.key] ?? null;
  }

  onFieldChange(field: FieldDef, value: unknown): void {
    this.item[field.key] = value;
  }

  /**
   * Photos et localisation sont écrites immédiatement : les images vivent déjà
   * en IndexedDB, quitter la page sans enregistrer les laisserait orphelines.
   */
  onPhotosChange(photos: AssetRef[]): void {
    this.item['Photos'] = photos;
    this.persist();
  }

  onLocationChange(location: PlanLocation | null): void {
    this.item['Localisation'] = location;
    this.persist();
  }

  private persist(): void {
    if (this.def.single) {
      this.data.setSingle(this.def.key, this.item);
    } else {
      this.data.updateEntity(this.def.key, this.item as never);
    }
  }

  /**
   * Un champ `obligatoire` (V3 du classeur) doit être rempli avant
   * l'enregistrement, qu'il soit visible au niveau de remplissage en cours
   * ou non — sans quoi choisir « Minimale » permettrait de valider une fiche
   * sans ses champs les plus nécessaires. Les champs manquants sont révélés
   * automatiquement pour que l'auditeur puisse les compléter tout de suite.
   */
  save(): void {
    const manquants = this.def.fields.filter(
      (f) =>
        f.kind !== 'photos' &&
        f.kind !== 'plan' &&
        f.requirement === 'obligatoire' &&
        estVide(this.item[f.key])
    );
    this.champsManquants = manquants;
    if (manquants.length) {
      for (const f of manquants) this.revealed.add(f.key);
      return;
    }
    this.persist();
    this.router.navigate(this.backTo);
  }

  /**
   * Quitte la fiche sans enregistrer les champs texte en cours.
   *
   * Les photos et la localisation ne sont pas concernées : elles sont déjà
   * enregistrées (voir `onPhotosChange`/`onLocationChange`), Annuler ne les
   * retire donc pas — c'est signalé à l'écran plutôt que laissé deviner.
   */
  annuler(): void {
    this.router.navigate(this.backTo);
  }

  async remove(): Promise<void> {
    if (this.def.single) return;
    if (!confirm('Supprimer cet élément ?')) return;

    await this.data.deleteEntity(this.def.key, String(this.item['Id']));
    this.router.navigate(['/qte', this.def.route]);
  }
}
