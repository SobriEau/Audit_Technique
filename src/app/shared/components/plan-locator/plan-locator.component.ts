import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { AssetStoreService } from '../../../core/services/asset-store.service';
import { DataService } from '../../../core/services/data.service';
import { AssetRef, PlanLocation } from '../../../models/data.models';

/**
 * Localisation d'un élément sur un plan du bâtiment.
 *
 * Parcours :
 *   1. choisir le plan concerné parmi ceux chargés depuis l'accueil ;
 *   2. cliquer sur le plan pour poser la punaise ;
 *   3. une fois validé, le plan et la punaise s'affichent sous le formulaire.
 *
 * Les coordonnées sont enregistrées en fractions (0 à 1) de la taille du plan,
 * si bien que la punaise reste au bon endroit quelle que soit la taille
 * d'affichage — vignette, plein écran ou impression.
 */
@Component({
  selector: 'app-plan-locator',
  standalone: true,
  templateUrl: './plan-locator.component.html',
  styleUrl: './plan-locator.component.scss',
})
export class PlanLocatorComponent implements OnInit, OnChanges {
  /** Localisation actuelle de l'élément, ou null s'il n'est pas localisé. */
  @Input() location: PlanLocation | null = null;

  @Output() locationChange = new EventEmitter<PlanLocation | null>();

  plans: AssetRef[] = [];
  urls: Record<string, string> = {};

  // ── État de la boîte de dialogue ─────────────────────────────────────────
  open = false;
  step: 'plan' | 'point' = 'plan';
  draftPlan: AssetRef | null = null;
  draftX: number | null = null;
  draftY: number | null = null;

  constructor(
    private data: DataService,
    private assets: AssetStoreService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.plans = this.data.getPlans();
    void this.resolveAll();
  }

  ngOnChanges(): void {
    if (this.location) void this.resolveUrl(this.location.planId);
  }

  // ── Affichage de la localisation enregistrée ─────────────────────────────

  get currentPlan(): AssetRef | undefined {
    if (!this.location) return undefined;
    return this.data.findPlan(this.location.planId);
  }

  get hasPlans(): boolean {
    return this.plans.length > 0;
  }

  /** Position CSS de la punaise, en pourcentage du plan affiché. */
  pinStyle(loc: PlanLocation): Record<string, string> {
    return { left: `${loc.x * 100}%`, top: `${loc.y * 100}%` };
  }

  // ── Ouverture / fermeture ────────────────────────────────────────────────

  openDialog(): void {
    if (!this.hasPlans) return;

    this.plans = this.data.getPlans();
    void this.resolveAll();

    // Repart de la localisation existante si l'élément est déjà placé.
    if (this.location) {
      this.draftPlan = this.data.findPlan(this.location.planId) ?? null;
      this.draftX = this.location.x;
      this.draftY = this.location.y;
      this.step = this.draftPlan ? 'point' : 'plan';
    } else {
      this.draftPlan = null;
      this.draftX = null;
      this.draftY = null;
      this.step = 'plan';
    }

    this.open = true;
  }

  close(): void {
    this.open = false;
  }

  // ── Étape 1 : choix du plan ──────────────────────────────────────────────

  choosePlan(plan: AssetRef): void {
    this.draftPlan = plan;
    // Un changement de plan invalide le point déjà posé.
    if (this.location?.planId !== plan.id) {
      this.draftX = null;
      this.draftY = null;
    }
    this.step = 'point';
  }

  backToPlans(): void {
    this.step = 'plan';
  }

  // ── Étape 2 : pose de la punaise ─────────────────────────────────────────

  placePin(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    this.draftX = clamp01((event.clientX - rect.left) / rect.width);
    this.draftY = clamp01((event.clientY - rect.top) / rect.height);
  }

  get canConfirm(): boolean {
    return !!this.draftPlan && this.draftX !== null && this.draftY !== null;
  }

  confirm(): void {
    if (!this.canConfirm) return;
    this.locationChange.emit({
      planId: this.draftPlan!.id,
      x: this.draftX!,
      y: this.draftY!,
    });
    this.open = false;
  }

  clearLocation(): void {
    if (!confirm('Retirer la localisation de cet élément ?')) return;
    this.locationChange.emit(null);
    this.open = false;
  }

  // ── Résolution des images ────────────────────────────────────────────────

  private async resolveUrl(id: string): Promise<void> {
    if (this.urls[id]) return;
    const url = await this.assets.objectUrl(id);
    if (url) {
      this.urls[id] = url;
      this.cdr.markForCheck();
    }
  }

  private async resolveAll(): Promise<void> {
    for (const p of this.plans) await this.resolveUrl(p.id);
    if (this.location) await this.resolveUrl(this.location.planId);
    this.cdr.markForCheck();
  }
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}
