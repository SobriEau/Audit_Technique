import { Component, Input, forwardRef, OnInit } from '@angular/core';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FieldDef } from '../../../models/field.models';
import { DataService } from '../../../core/services/data.service';
import { AuditEntity } from '../../../models/data.models';
import { RichEditorComponent } from '../rich-editor/rich-editor.component';
import { DictationFieldComponent } from '../dictation-field/dictation-field.component';
import { PhotoEditorComponent } from '../photo-editor/photo-editor.component';
import { REQUIREMENT_LABEL } from '../../../models/field-priority';

/**
 * Aide affichée quand le classeur n'en porte pas, pour un champ générique
 * partagé par (presque) toutes les entités. Écrit ici plutôt que répété dans
 * `audit_technique.xlsx` pour une quinzaine d'onglets.
 */
const GENERIC_HELP: Record<string, string> = {
  Emplacement: 'Reprendre le nom de la pièce indiqué sur le plan.',
};

/** Un choix possible, quel que soit le type sous-jacent du champ. */
export interface Choice {
  label: string;
  value: unknown;
}

/**
 * En deçà de ce nombre de choix, la liste déroulante cède la place à des
 * boutons radio : tout est visible d'un coup d'œil et sélectionnable en un
 * seul geste, ce qui compte sur une tablette en intervention.
 */
export const RADIO_THRESHOLD = 4;

/** Compteur pour donner un nom unique à chaque groupe de boutons radio. */
let uniqueId = 0;

/** Comparaison insensible à la casse et aux accents : « melangeur » trouve « Mélangeur ». */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Composant de saisie unique de l'audit.
 *
 * Toutes les entrées — texte, nombre, choix, oui/non, référence vers un autre
 * élément, texte enrichi, photos — passent par ici. Faire évoluer un type de
 * champ se fait donc à un seul endroit, pour l'ensemble des formulaires.
 *
 * Les champs à choix adoptent deux formes selon le nombre d'options :
 *   - moins de quatre : boutons radio ;
 *   - au-delà : une liste filtrable à la saisie.
 *
 * Usage : <app-audit-field [def]="champ" [(ngModel)]="valeur" />
 */
@Component({
  selector: 'app-audit-field',
  standalone: true,
  imports: [FormsModule, RichEditorComponent, DictationFieldComponent, PhotoEditorComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AuditFieldComponent),
      multi: true,
    },
  ],
  templateUrl: './audit-field.component.html',
  styleUrl: './audit-field.component.scss',
})
export class AuditFieldComponent implements ControlValueAccessor, OnInit {
  @Input({ required: true }) def!: FieldDef;

  value: unknown = null;

  /** Choix normalisés du champ, tous types confondus. */
  choices: Choice[] = [];

  /** Éléments proposés pour un champ de type `entity-ref`. */
  refOptions: AuditEntity[] = [];

  readonly uid = `af-${++uniqueId}`;

  /** Aide effective : celle du classeur, sinon celle d'un champ générique connu. */
  get effectiveHelp(): string | null {
    return this.def.help ?? GENERIC_HELP[this.def.key] ?? null;
  }

  /**
   * Pastille d'exigence du classeur (« Obligatoire », « Recommandé »,
   * « Facultatif »), ou `null` si le classeur ne dit rien pour ce champ.
   *
   * Une seule pastille, dans la palette orange. Les deux migrations V3 menées
   * en parallèle en affichaient deux — une pastille orange tirée d'une table
   * curée à la main, un badge neutre tiré du classeur — pour la même donnée.
   * Le badge neutre visait à ne pas confondre exigence et validation ; le rouge
   * de l'encadré des champs manquants s'en charge, et l'orange ne se lit pas
   * comme une erreur. Voir `fusion-origin-main.md`.
   */
  get requirementLabel(): string | null {
    return this.def.requirement ? REQUIREMENT_LABEL[this.def.requirement] : null;
  }

  // ── État de la liste filtrable ───────────────────────────────────────────
  comboOpen = false;
  comboQuery = '';
  activeIndex = -1;

  onChangeFn: (v: unknown) => void = () => {};
  onTouchedFn: () => void = () => {};

  constructor(private data: DataService) {}

  ngOnInit(): void {
    if (this.def.kind === 'boolean') {
      this.choices = [
        { label: 'Oui', value: true },
        { label: 'Non', value: false },
      ];
    } else if (this.def.kind === 'select') {
      this.choices = (this.def.options ?? []).map((o) => ({ label: o, value: o }));
    } else if (this.def.kind === 'entity-ref' && this.def.refTo) {
      this.refOptions = this.data.getEntities(this.def.refTo);
    }
  }

  // ── Choix : radio ou liste filtrable ─────────────────────────────────────

  get isChoice(): boolean {
    return this.def.kind === 'boolean' || this.def.kind === 'select';
  }

  /** Peu d'options : on les montre toutes plutôt que de les cacher. */
  get useRadio(): boolean {
    return this.isChoice && this.choices.length > 0 && this.choices.length < RADIO_THRESHOLD;
  }

  get useCombo(): boolean {
    return this.isChoice && this.choices.length >= RADIO_THRESHOLD;
  }

  isSelected(c: Choice): boolean {
    return this.value === c.value;
  }

  selectChoice(c: Choice): void {
    this.value = c.value;
    this.onChangeFn(this.value);
    this.onTouchedFn();
  }

  clear(): void {
    this.value = null;
    this.comboQuery = '';
    this.onChangeFn(null);
    this.onTouchedFn();
  }

  get hasValue(): boolean {
    return this.value !== null && this.value !== undefined && this.value !== '';
  }

  // ── Liste filtrable ──────────────────────────────────────────────────────

  /**
   * Le champ affiche la valeur retenue au repos, et la saisie en cours dès que
   * la liste est ouverte.
   */
  get comboDisplay(): string {
    if (this.comboOpen) return this.comboQuery;
    return typeof this.value === 'string' ? this.value : '';
  }

  get filtered(): Choice[] {
    const q = normalize(this.comboQuery);
    if (!q) return this.choices;
    return this.choices.filter((c) => normalize(c.label).includes(q));
  }

  openCombo(): void {
    this.comboOpen = true;
    this.comboQuery = '';
    this.activeIndex = this.choices.findIndex((c) => c.value === this.value);
  }

  onComboInput(text: string): void {
    this.comboQuery = text;
    this.comboOpen = true;
    this.activeIndex = this.filtered.length ? 0 : -1;
  }

  /**
   * Fermeture sans validation : on ne conserve pas la saisie libre, le champ
   * n'accepte que des valeurs de la liste. L'affichage revient donc à la
   * valeur enregistrée.
   */
  closeCombo(): void {
    this.comboOpen = false;
    this.comboQuery = '';
    this.activeIndex = -1;
    this.onTouchedFn();
  }

  onComboKeydown(event: KeyboardEvent): void {
    const options = this.filtered;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.comboOpen) this.openCombo();
        else this.activeIndex = Math.min(this.activeIndex + 1, options.length - 1);
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex = Math.max(this.activeIndex - 1, 0);
        break;

      case 'Enter':
        if (this.comboOpen && options[this.activeIndex]) {
          event.preventDefault();
          this.selectChoice(options[this.activeIndex]);
          this.closeCombo();
        }
        break;

      case 'Escape':
        if (this.comboOpen) {
          event.preventDefault();
          this.closeCombo();
        }
        break;
    }
  }

  chooseFromList(c: Choice): void {
    this.selectChoice(c);
    this.closeCombo();
  }

  /**
   * Valeur enregistrée absente de la liste : elle est conservée et signalée.
   * Une liste de valeurs qui évolue ne doit jamais effacer en silence une
   * saisie déjà faite sur le terrain.
   */
  get orphanValue(): string | null {
    if (this.def.kind !== 'select') return null;
    const v = this.value;
    if (typeof v !== 'string' || !v) return null;
    return this.def.options?.includes(v) ? null : v;
  }

  // ── Autres types ─────────────────────────────────────────────────────────

  /** Libellé lisible d'un élément référencé. */
  refLabel(item: AuditEntity): string {
    const extra = item['Emplacement'];
    const num = item.Numero ? `n° ${item.Numero}` : 'sans numéro';
    return extra ? `${num} — ${extra}` : num;
  }

  onInput(v: unknown): void {
    this.value = v === '' ? null : v;
    this.onChangeFn(this.value);
  }

  /** Les champs numériques ne doivent pas stocker une chaîne. */
  onNumber(raw: string): void {
    const n = raw === '' ? null : Number(raw);
    this.value = n !== null && Number.isNaN(n) ? null : n;
    this.onChangeFn(this.value);
  }

  // ─── ControlValueAccessor ─────────────────────────────────────────────────

  writeValue(v: unknown): void {
    this.value = v ?? null;
  }

  registerOnChange(fn: (v: unknown) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }
}
