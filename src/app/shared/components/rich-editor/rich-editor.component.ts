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
 * Composant partagÃ© : Ã©diteur rich-text (barre d'outils + contenteditable).
 * ImplÃ©mente ControlValueAccessor pour Ãªtre utilisable avec [(ngModel)].
 *
 * Usage : <app-rich-editor [(ngModel)]="htmlContent" />
 *
 * Transcription vocale : vosk-browser (WASM + modÃ¨le fr ~32 Mo).
 * TÃ©lÃ©chargÃ© une seule fois et mis en cache â€” fonctionne 100 % hors-ligne
 * sur tous les navigateurs modernes (Chrome, Firefox, Edge, Safari).
 */

/** Ã‰tats possibles du bouton micro, calculÃ©s depuis le service Vosk + Ã©tat local. */
export type MicState =
  | 'unsupported'  // getUserMedia absent
  | 'unloaded'     // modÃ¨le non chargÃ©
  | 'downloading'  // tÃ©lÃ©chargement en cours
  | 'error'        // Ã©chec du chargement
  | 'idle'         // prÃªt, pas en Ã©coute
  | 'listening';   // dictÃ©e active

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

  // â”€â”€â”€ Mic state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  interimText = '';

  private _isListening = false;
  private resultSub?: Subscription;
  private partialSub?: Subscription;
  private stateSub?: Subscription;

  /** Ã‰tat calculÃ© affichÃ© dans le template. */
  get micState(): MicState {
    if (!navigator.mediaDevices?.getUserMedia) return 'unsupported';
    const vs = this.speech.state;
    if (vs === 'downloading') return 'downloading';
    if (vs === 'error') return 'error';
    if (vs === 'unloaded') return 'unloaded';
    return this._isListening ? 'listening' : 'idle';
  }

  constructor(
    private speech: SpeechService,
    private cdr: ChangeDetectorRef,
  ) {}

  // â”€â”€â”€ Lifecycle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  ngOnInit(): void {
    this.stateSub = this.speech.state$.subscribe(() =>
      this.cdr.detectChanges(),
    );
  }

  ngAfterViewInit(): void {
    if (this.pendingValue !== null) {
      this.editorRef.nativeElement.innerHTML = this.pendingValue;
      this.pendingValue = null;
    }
  }

  ngOnDestroy(): void {
    this.stopDictation();
    this.stateSub?.unsubscribe();
  }

  // â”€â”€â”€ Toolbar formatting â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // â”€â”€â”€ Microphone â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Premier clic : charge le modÃ¨le si nÃ©cessaire puis dÃ©marre la dictÃ©e.
   * Clic suivant (Ã©tat listening) : arrÃªte la dictÃ©e.
   * (mousedown) + preventDefault() â†’ le caret du contenteditable reste en place.
   */
  async toggleMic(event: MouseEvent): Promise<void> {
    event.preventDefault();

    if (this._isListening) {
      this.stopDictation();
      return;
    }

    if (this.speech.state === 'unloaded') {
      await this.speech.loadModel();
    }
    if (this.speech.state !== 'ready') return;

    await this.startDictation();
  }

  async retryLoad(event: MouseEvent): Promise<void> {
    event.preventDefault();
    this.speech.resetAfterError();
    await this.speech.loadModel();
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
      await this.speech.startListening();
      this._isListening = true;
      this.cdr.detectChanges();
    } catch {
      this.resultSub?.unsubscribe();
      this.partialSub?.unsubscribe();
    }
  }

  private stopDictation(): void {
    this._isListening = false;
    this.resultSub?.unsubscribe();
    this.partialSub?.unsubscribe();
    this.speech.stopListening();
    this.interimText = '';
    this.cdr.detectChanges();
  }

  /**
   * InsÃ¨re du texte brut Ã  la position courante du curseur dans le contenteditable.
   */
  private insertAtCursor(text: string): void {
    const editor = this.editorRef.nativeElement;
    editor.focus();

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
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

  // â”€â”€â”€ ControlValueAccessor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
