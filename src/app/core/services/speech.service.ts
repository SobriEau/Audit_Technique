import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { VoskSpeechService, VoskState } from './vosk-speech.service';

export type SpeechEngine = 'webspeech' | 'vosk';

/**
 * Détecte si on peut utiliser la Web Speech API :
 * - Chrome ou Edge (Chromium) : /Chrome\// présent dans le UA
 * - Connexion réseau active
 * - SpeechRecognition disponible dans le navigateur
 */
function detectEngine(): SpeechEngine {
  const hasSR =
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  const isChromiumBased = /Chrome\//.test(navigator.userAgent);
  const isOnline = navigator.onLine;
  return hasSR && isChromiumBased && isOnline ? 'webspeech' : 'vosk';
}

/**
 * Service de transcription vocale unifié.
 *
 * Choisit automatiquement l'engine au démarrage :
 *   - Chrome / Edge + en ligne  → Web Speech API (instantané, pas de téléchargement)
 *   - Sinon                     → Vosk WASM (hors-ligne, modèle fr bundlé)
 *
 * Expose la même interface que VoskSpeechService : state$, progress$,
 * result$, partial$, loadModel(), startListening(), stopListening().
 */
@Injectable({ providedIn: 'root' })
export class SpeechService implements OnDestroy {
  readonly engine: SpeechEngine;

  readonly state$ = new BehaviorSubject<VoskState>('unloaded');
  readonly progress$ = new BehaviorSubject<number>(0);
  readonly result$ = new Subject<string>();
  readonly partial$ = new Subject<string>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;
  private _listening = false;

  private voskStateSub?: Subscription;
  private voskProgressSub?: Subscription;
  private voskResultSub?: Subscription;
  private voskPartialSub?: Subscription;

  get state(): VoskState {
    return this.state$.value;
  }

  get isListening(): boolean {
    return this._listening;
  }

  constructor(
    private readonly vosk: VoskSpeechService,
    private readonly ngZone: NgZone,
  ) {
    this.engine = detectEngine();

    if (this.engine === 'webspeech') {
      // Pas de chargement nécessaire : prêt immédiatement
      this.state$.next('ready');
    } else {
      // Relayer l'état et la progression Vosk
      this.voskStateSub = this.vosk.state$.subscribe((s) =>
        this.state$.next(s),
      );
      this.voskProgressSub = this.vosk.progress$.subscribe((p) =>
        this.progress$.next(p),
      );
    }
  }

  ngOnDestroy(): void {
    this.stopListening();
    this.voskStateSub?.unsubscribe();
    this.voskProgressSub?.unsubscribe();
  }

  // ─── API publique ──────────────────────────────────────────────────────────

  async loadModel(): Promise<void> {
    if (this.engine === 'webspeech') {
      this.state$.next('ready');
      return;
    }
    return this.vosk.loadModel();
  }

  resetAfterError(): void {
    if (this.engine === 'vosk') {
      this.vosk.resetAfterError();
    } else {
      this.state$.next('ready');
    }
  }

  async startListening(): Promise<void> {
    if (this.engine === 'webspeech') {
      return this.startWebSpeech();
    }
    // Relayer les résultats Vosk vers ce service
    this.voskResultSub = this.vosk.result$.subscribe((t) =>
      this.result$.next(t),
    );
    this.voskPartialSub = this.vosk.partial$.subscribe((t) =>
      this.partial$.next(t),
    );
    await this.vosk.startListening();
    this._listening = true;
  }

  stopListening(): void {
    this._listening = false;
    if (this.engine === 'webspeech') {
      this.recognition?.stop();
      this.recognition = null;
    } else {
      this.voskResultSub?.unsubscribe();
      this.voskPartialSub?.unsubscribe();
      this.vosk.stopListening();
    }
  }

  // ─── Web Speech API ────────────────────────────────────────────────────────

  private startWebSpeech(): Promise<void> {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SR: any =
        (window as any).SpeechRecognition ??
        (window as any).webkitSpeechRecognition;

      this.recognition = new SR();
      this.recognition.lang = 'fr-FR';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      let started = false;

      this.recognition.onstart = () => {
        this._listening = true;
        if (!started) {
          started = true;
          resolve();
        }
      };

      this.recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            const text = res[0].transcript;
            this.ngZone.run(() => this.result$.next(text + ' '));
          } else {
            interim += res[0].transcript;
          }
        }
        this.ngZone.run(() => this.partial$.next(interim));
      };

      // onend se déclenche après chaque silence ou arrêt auto :
      // on redémarre si l'utilisateur n'a pas explicitement arrêté.
      this.recognition.onend = () => {
        if (this._listening) {
          try {
            this.recognition?.start();
          } catch {
            // ignore si déjà en cours
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        // 'no-speech' est bénin : pas de parole détectée, on continue
        if (event.error === 'no-speech') return;
        this.ngZone.run(() => {
          this._listening = false;
          this.state$.next('error');
        });
        if (!started) {
          started = true;
          reject(new Error(event.error));
        }
      };

      this.recognition.start();
    });
  }
}
