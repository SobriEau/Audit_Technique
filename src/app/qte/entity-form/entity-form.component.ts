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
import { FormSection, buildSections, formFields } from '../form-layout';
import { NIVEAU_LABELS, champsManquants, champsMasques, requirementVisible } from '../exigences';

type Record_ = Record<string, unknown>;

/** Comparaison insensible à la casse et aux accents, pour le filtre des champs masqués. */
function normalizeSearch(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Fiche générique : rend le formulaire d'un élément à partir du schéma.
 *
 * Sert aussi bien les entités listées (robinets, WC, piscines…) que les pages
 * uniques (compteur général), signalées par `single` dans le schéma.
 *
 * Trois mécanismes se superposent, et viennent de deux migrations V3 menées en
 * parallèle puis fusionnées (voir `fusion-origin-main.md`) :
 *  - le **découpage en sections** du classeur (migration locale) ;
 *  - le **niveau de remplissage**, qui masque les champs les moins exigés, et
 *    la **validation** des champs obligatoires (migration d'origin/main) ;
 *  - les **blocs conditionnels**, ajoutés à la fusion pour que la validation
 *    n'exige pas les champs d'un bloc qui ne concerne pas l'élément.
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

  /** Champs à rendre, hors photos et plan qui ont leur propre bloc. */
  champs: FieldDef[] = [];

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
      this.champs = formFields(def.fields);
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
   * Découpe la fiche en blocs, selon les sections du classeur, en ne gardant
   * que les champs visibles au niveau de remplissage choisi.
   *
   * Une fiche peut compter jusqu'à 77 champs : d'un seul tenant, elle est
   * illisible (retour de la revue d'ergonomie, « séparer les formulaires en
   * plus petits blocs »). Le classeur V3 dit lui-même où couper — chaque
   * champ porte le titre de sa section.
   *
   * Ce découpage vient **par-dessus** le groupement par ligne, il ne le
   * remplace pas : les champs qui partagent une ligne du classeur restent
   * côte à côte à l'intérieur de leur bloc. Une section dont tous les champs
   * sont masqués disparaît, sauf si elle porte la localisation sur plan.
   *
   * La localisation s'insère à la fin de la section qui porte l'emplacement —
   * c'est-à-dire « Localisation » quand le classeur la nomme.
   */
  get sections(): FormSection[] {
    const blocs = buildSections(this.champs);

    const iEmplacement = blocs.findIndex((b) =>
      b.rows.some((row) => row.some((f) => f.key === 'Emplacement'))
    );
    if (iEmplacement !== -1) {
      blocs[iEmplacement].withLocator = true;
    } else if (blocs.length && blocs[0].title === null) {
      // Pas de champ « Emplacement » — les espaces extérieurs le nomment
      // autrement. La localisation rejoint alors le bloc de tête plutôt que
      // d'ouvrir un panneau vide à elle seule.
      blocs[0].withLocator = true;
    } else {
      // Fiche entièrement sectionnée : la localisation ouvre la page, pour ne
      // pas la reléguer en bas (retour KAPT, « Localiser : mettre tout en haut »).
      blocs.unshift({ title: null, rows: [], withLocator: true });
    }

    return blocs
      .map((b) => ({
        ...b,
        rows: b.rows.map((row) => row.filter((f) => this.isVisible(f))).filter((row) => row.length > 0),
      }))
      .filter((b) => b.rows.length > 0 || b.withLocator);
  }

  /**
   * Un champ masqué par le niveau de remplissage en cours reste affiché s'il
   * a été révélé depuis le volet dépliable, ou automatiquement parce
   * qu'obligatoire et resté vide à la validation.
   */
  isVisible(f: FieldDef): boolean {
    return requirementVisible(f.requirement, this.niveau) || this.revealed.has(f.key);
  }

  /** Champs masqués par le niveau de remplissage en cours, pour le volet dépliable. */
  get hiddenFields(): FieldDef[] {
    return champsMasques(this.def, this.niveau, this.revealed);
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
   * Les champs obligatoires doivent être remplis avant l'enregistrement, qu'ils
   * soient visibles au niveau de remplissage en cours ou non — mais seulement
   * dans les blocs qui concernent l'élément (voir `champsManquants`). Les
   * champs manquants sont révélés pour être complétés tout de suite.
   */
  save(): void {
    const manquants = champsManquants(this.def, this.item);
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
