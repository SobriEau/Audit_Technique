import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SpeechService } from '../../../core/services/speech.service';

/**
 * Composant partagé : champ texte (une ligne ou plusieurs) avec dictée vocale.
 * Contrairement à `app-rich-editor`, la valeur reste une chaîne brute, sans
 * mise en forme HTML — adapté aux champs qui stockent du texte simple
 * (adresse, numéro, note courte…).
 *
 * Usage : <app-dictation-field [(ngModel)]="texte" />
 *         <app-dictation-field [(ngModel)]="texte" [multiline]="true" />
 */

export type MicState = 'unsupported' | 'idle' | 'listening' | 'error';

@Component({
  selector: 'app-dictation-field',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DictationFieldComponent),
      multi: true,
    },
  ],
  templateUrl: './dictation-field.component.html',
  styleUrl: './dictation-field.component.scss',
})
export class DictationFieldComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() id = '';
  @Input() multiline = false;
  @Input() placeholder = '';
  /** Classe CSS reportée sur le champ natif (le wrapper reste sans classe). */
  @Input() fieldClass = '';
  @Input() ariaLabel: string | null = null;
  /** `list` d'un `<input>`, pour une datalist d'autocomplétion. Ignoré en multiligne. */
  @Input() list = '';

  /** Valeur au moment où le champ perd le focus — pour enregistrer à la volée. */
  @Output() fieldBlur = new EventEmitter<string>();

  @ViewChild('field') fieldRef?: ElementRef<HTMLInputElement | HTMLTextAreaElement>;

  value = '';

  /** Texte provisoire affiché pendant que la phrase se construit. */
  interimText = '';

  onChangeFn: (v: string) => void = () => {};
  onTouchedFn: () => void = () => {};

  private resultSub?: Subscription;
  private partialSub?: Subscription;
  private stateSub?: Subscription;

  constructor(
    private speech: SpeechService,
    private cdr: ChangeDetectorRef
  ) {}

  /** État du micro pour CE champ. */
  get micState(): MicState {
    switch (this.speech.state) {
      case 'unsupported':
        return 'unsupported';
      case 'error':
        return this.isOwner ? 'error' : 'idle';
      case 'listening':
        return this.isOwner ? 'listening' : 'idle';
      default:
        return 'idle';
    }
  }

  get errorMessage(): string | null {
    return this.speech.errorMessage;
  }

  /** Vrai si la dictée en cours appartient à ce champ. */
  private get isOwner(): boolean {
    return this.speech.activeOwner === this;
  }

  // ─── Cycle de vie ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.stateSub = this.speech.state$.subscribe(() => this.cdr.markForCheck());
  }

  ngOnDestroy(): void {
    if (this.isOwner) this.stopDictation();
    this.stateSub?.unsubscribe();
  }

  // ─── Saisie clavier ───────────────────────────────────────────────────────

  onNativeInput(v: string): void {
    this.value = v;
    this.onChangeFn(v);
  }

  onBlur(): void {
    this.onTouchedFn();
    this.fieldBlur.emit(this.value);
  }

  // ─── Microphone ───────────────────────────────────────────────────────────

  /**
   * Démarre ou arrête la dictée.
   * (mousedown) + preventDefault() : le focus et la position du curseur dans
   * le champ ne bougent pas.
   */
  async toggleMic(event: MouseEvent): Promise<void> {
    event.preventDefault();

    if (this.micState === 'listening') {
      this.stopDictation();
      return;
    }

    await this.startDictation();
  }

  /** Réessaie après une erreur. */
  async retry(event: MouseEvent): Promise<void> {
    event.preventDefault();
    this.speech.reset();
    await this.startDictation();
  }

  private async startDictation(): Promise<void> {
    this.resultSub = this.speech.result$.subscribe((text) => {
      this.insertAtCursor(text);
      this.interimText = '';
      this.cdr.detectChanges();
    });

    this.partialSub = this.speech.partial$.subscribe((text) => {
      this.interimText = text;
      this.cdr.detectChanges();
    });

    try {
      await this.speech.start(this);
    } catch {
      // L'erreur est déjà exposée via speech.errorMessage
      this.resultSub?.unsubscribe();
      this.partialSub?.unsubscribe();
    }
    this.cdr.detectChanges();
  }

  private stopDictation(): void {
    this.resultSub?.unsubscribe();
    this.partialSub?.unsubscribe();
    this.speech.stop();
    this.interimText = '';
    this.cdr.detectChanges();
  }

  /** Insère le texte dicté à la position du curseur, comme une frappe au clavier. */
  private insertAtCursor(text: string): void {
    const field = this.fieldRef?.nativeElement;
    if (!field) {
      this.value += text;
      this.onChangeFn(this.value);
      return;
    }

    field.focus();
    const start = field.selectionStart ?? this.value.length;
    const end = field.selectionEnd ?? this.value.length;
    this.value = this.value.slice(0, start) + text + this.value.slice(end);
    this.onChangeFn(this.value);

    field.value = this.value;
    const caret = start + text.length;
    field.setSelectionRange(caret, caret);
  }

  // ─── ControlValueAccessor ─────────────────────────────────────────────────

  writeValue(v: string | null): void {
    this.value = v ?? '';
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }
}
