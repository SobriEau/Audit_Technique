import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export type VoskState = 'unloaded' | 'downloading' | 'ready' | 'error';

/**
 * Modèle fr petite taille (~32 Mo).
 * Mis en cache automatiquement dans le Cache Storage du navigateur : téléchargé
 * une seule fois en ligne, puis utilisable indéfiniment hors-ligne.
 */
const MODEL_URL =
  'https://alphacephei.com/vosk/models/vosk-model-small-fr-0.22.zip';

@Injectable({ providedIn: 'root' })
export class VoskSpeechService implements OnDestroy {
  /** État du service (charge modèle / prêt / …). */
  readonly state$ = new BehaviorSubject<VoskState>('unloaded');

  /** Progression du téléchargement (0–100). */
  readonly progress$ = new BehaviorSubject<number>(0);

  /** Émet le texte final reconnu (prêt à insérer). */
  readonly result$ = new Subject<string>();

  /** Émet le texte provisoire en cours de dictée. */
  readonly partial$ = new Subject<string>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private model: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognizer: any = null;

  private audioCtx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;

  private _listening = false;
  get isListening(): boolean {
    return this._listening;
  }

  get state(): VoskState {
    return this.state$.value;
  }

  constructor(private ngZone: NgZone) {}

  ngOnDestroy(): void {
    this.stopListening();
  }

  // ─── Modèle ────────────────────────────────────────────────────────────────

  /** Remet l'état à 'unloaded' pour permettre un nouvel essai après erreur. */
  resetAfterError(): void {
    if (this.state !== 'error') return;
    this.model = null;
    this.state$.next('unloaded');
    this.progress$.next(0);
  }

  /**
   * Télécharge et charge le modèle vosk-fr (idempotent).
   * Le modèle est mis en cache par le navigateur → un seul téléchargement.
   */
  async loadModel(): Promise<void> {
    if (this.state === 'ready' || this.state === 'downloading') return;

    this.state$.next('downloading');
    this.progress$.next(0);

    try {
      // Import dynamique : vosk-browser est chargé paresseusement.
      const { createModel } = await import('vosk-browser');

      this.model = await createModel(MODEL_URL);

      this.ngZone.run(() => {
        this.progress$.next(100);
        this.state$.next('ready');
      });
    } catch (err) {
      console.error('[Vosk] Erreur chargement modèle :', err);
      this.ngZone.run(() => this.state$.next('error'));
    }
  }

  // ─── Écoute ────────────────────────────────────────────────────────────────

  async startListening(): Promise<void> {
    if (this._listening || !this.model || this.state !== 'ready') return;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
        video: false,
      });

      // Vosk travaille en 16 kHz
      this.audioCtx = new AudioContext({ sampleRate: 16000 });
      this.recognizer = new this.model.KaldiRecognizer(
        this.audioCtx.sampleRate,
      );

      this.recognizer.on(
        'result',
        (msg: { result: { text: string } }) => {
          this.ngZone.run(() => {
            if (msg.result.text?.trim()) {
              this.result$.next(msg.result.text + ' ');
            }
          });
        },
      );

      this.recognizer.on(
        'partialresult',
        (msg: { result: { partial: string } }) => {
          this.ngZone.run(() => this.partial$.next(msg.result.partial));
        },
      );

      const source = this.audioCtx.createMediaStreamSource(this.stream);

      // ScriptProcessorNode — déprécié mais support universel (tous navigateurs)
      this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);
      this.processor.onaudioprocess = (e: AudioProcessingEvent) => {
        if (this._listening && this.recognizer) {
          this.recognizer.acceptWaveform(e.inputBuffer);
        }
      };

      // Gain 0 pour ne pas renvoyer le micro dans les haut-parleurs
      const gain = this.audioCtx.createGain();
      gain.gain.value = 0;
      source.connect(this.processor);
      this.processor.connect(gain);
      gain.connect(this.audioCtx.destination);

      this._listening = true;
    } catch (err) {
      console.error('[Vosk] Erreur démarrage écoute :', err);
      this.stopListening();
      throw err;
    }
  }

  stopListening(): void {
    this._listening = false;

    if (this.processor) {
      this.processor.onaudioprocess = null;
      this.processor.disconnect();
      this.processor = null;
    }

    this.audioCtx?.close().catch(() => {});
    this.audioCtx = null;

    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;

    if (this.recognizer) {
      try {
        this.recognizer.free();
      } catch {
        /* ignore */
      }
      this.recognizer = null;
    }

    this.partial$.next('');
  }
}
