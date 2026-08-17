import { Component, Input, forwardRef, OnInit } from '@angular/core';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FieldDef } from '../../../models/field.models';
import { DataService } from '../../../core/services/data.service';
import { AuditEntity } from '../../../models/data.models';
import { RichEditorComponent } from '../rich-editor/rich-editor.component';
import { PhotoEditorComponent } from '../photo-editor/photo-editor.component';

/**
 * Composant de saisie unique de l'audit.
 *
 * Toutes les entrées — texte, nombre, liste, oui/non, référence vers un autre
 * élément, texte enrichi, photos — passent par ici. Faire évoluer l'apparence
 * ou le comportement d'un type de champ se fait donc à un seul endroit, pour
 * l'ensemble des formulaires.
 *
 * Usage : <app-audit-field [def]="champ" [(ngModel)]="valeur" />
 */
@Component({
  selector: 'app-audit-field',
  standalone: true,
  imports: [FormsModule, RichEditorComponent, PhotoEditorComponent],
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

  /** Éléments proposés pour un champ de type `entity-ref`. */
  refOptions: AuditEntity[] = [];

  onChangeFn: (v: unknown) => void = () => {};
  onTouchedFn: () => void = () => {};

  constructor(private data: DataService) {}

  ngOnInit(): void {
    if (this.def.kind === 'entity-ref' && this.def.refTo) {
      this.refOptions = this.data.getEntities(this.def.refTo);
    }
  }

  /**
   * Valeur enregistrée absente de la liste : on la conserve et on l'affiche
   * quand même. Une liste de valeurs qui évolue ne doit jamais effacer en
   * silence une saisie déjà faite sur le terrain.
   */
  get orphanValue(): string | null {
    if (this.def.kind !== 'select') return null;
    const v = this.value;
    if (typeof v !== 'string' || !v) return null;
    return this.def.options?.includes(v) ? null : v;
  }

  /** Libellé lisible d'un élément référencé. */
  refLabel(item: AuditEntity): string {
    const extra = (item as Record<string, unknown>)['Emplacement'];
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

  onBoolean(raw: string): void {
    this.value = raw === '' ? null : raw === 'true';
    this.onChangeFn(this.value);
  }

  get booleanValue(): string {
    if (this.value === true) return 'true';
    if (this.value === false) return 'false';
    return '';
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
