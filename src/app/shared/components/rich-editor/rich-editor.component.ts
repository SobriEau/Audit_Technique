import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SpeechService } from '../../../core/services/speech.service';

/**
 * Composant partagé : éditeur rich-text (barre d'outils + contenteditable).
 * Implémente ControlValueAccessor pour être utilisable avec [(ngModel)].
 *
 * Usage : <app-rich-editor [(ngModel)]="htmlContent" />
 *
 * Dictée vocale : Web Speech API du navigateur (en ligne, Chrome / Edge).
 * Voir SpeechService pour les contraintes.
 */

/** États du bouton micro affichés dans le template. */
export type MicState =
  | 'unsupported' // navigateur sans Web Speech API
  | 'idle' // prêt à dicter
  | 'listening' // dictée active dans CET éditeur
  | 'error'; // échec, bouton « réessayer »

@Component({
  selector: 'app-rich-editor',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichEditorComponent),
      multi: true,
    },
  ],
  templateUrl: './rich-editor.component.html',
  styleUrl: './rich-editor.component.scss',
})
export class RichEditorComponent
  implements ControlValueAccessor, OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('editor', { static: false })
  editorRef!: ElementRef<HTMLDivElement>;

  onChangeFn: (v: string) => void = () => {};
  onTouchedFn: () => void = () => {};

  private pendingValue: string | null = null;

  /** Texte provisoire affiché pendant que la phrase se construit. */
  interimText = '';

  private resultSub?: Subscription;
  private partialSub?: Subscription;
  private stateSub?: Subscription;

  constructor(
    private speech: SpeechService,
    private cdr: ChangeDetectorRef
  ) {}

  /** État du micro pour CET éditeur. */
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

  /** Vrai si la dictée en cours appartient à cet éditeur. */
  private get isOwner(): boolean {
    return this.speech.activeOwner === this;
  }

  // ─── Cycle de vie ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.stateSub = this.speech.state$.subscribe(() => this.cdr.markForCheck());
  }

  ngAfterViewInit(): void {
    if (this.pendingValue !== null) {
      this.editorRef.nativeElement.innerHTML = this.pendingValue;
      this.pendingValue = null;
    }
  }

  ngOnDestroy(): void {
    if (this.isOwner) this.stopDictation();
    this.stateSub?.unsubscribe();
  }

  // ─── Barre d'outils ───────────────────────────────────────────────────────

  exec(event: MouseEvent, cmd: string): void {
    event.preventDefault();
    document.execCommand(cmd, false);
  }

  execWithValue(cmd: string, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.editorRef?.nativeElement.focus();
    document.execCommand(cmd, false, value);
  }

  onContentInput(): void {
    this.onChangeFn(this.editorRef.nativeElement.innerHTML);
  }

  // ─── Microphone ───────────────────────────────────────────────────────────

  /**
   * Démarre ou arrête la dictée.
   * (mousedown) + preventDefault() : le curseur du contenteditable ne bouge pas.
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

  /** Insère du texte brut à la position du curseur dans le contenteditable. */
  private insertAtCursor(text: string): void {
    const editor = this.editorRef.nativeElement;
    editor.focus();

    const sel = window.getSelection();
    // On n'insère via la sélection que si elle se trouve bien dans cet éditeur.
    if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(text);
      range.insertNode(node);
      range.setStartAfter(node);
      range.setEndAfter(node);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      editor.insertAdjacentText('beforeend', text);
    }

    this.onChangeFn(editor.innerHTML);
  }

  // ─── ControlValueAccessor ─────────────────────────────────────────────────

  writeValue(value: string | null): void {
    const html = value ?? '';
    if (this.editorRef?.nativeElement) {
      this.editorRef.nativeElement.innerHTML = html;
    } else {
      this.pendingValue = html;
    }
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }
}
