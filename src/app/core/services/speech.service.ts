import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

/** États possibles de la dictée. */
export type SpeechState =
  | 'unsupported' // navigateur sans Web Speech API (Firefox, Safari)
  | 'ready' // prêt à écouter
  | 'listening' // dictée en cours
  | 'error'; // dernière tentative en échec, voir errorMessage

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Récupère le constructeur SpeechRecognition, préfixé ou non. */
function getRecognitionCtor(): any | null {
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Traduit un code d'erreur de la Web Speech API en message actionnable.
 * Les libellés visent l'auditeur sur le terrain, pas le développeur.
 */
function describeError(code: string): string {
  switch (code) {
    case 'not-allowed':
      return "Micro refusé. Autorisez l'accès au microphone dans le navigateur.";
    case 'service-not-allowed':
      return (
        'Service de dictée bloqué par le navigateur. ' +
        "Ouvrez l'application via une adresse http:// plutôt qu'en fichier local."
      );
    case 'network':
      return 'Pas de connexion réseau : la dictée en ligne est indisponible.';
    case 'audio-capture':
      return 'Aucun microphone détecté sur cet appareil.';
    case 'aborted':
      return 'Dictée interrompue.';
    default:
      return `Erreur de dictée (${code}).`;
  }
}

/**
 * Service de transcription vocale, adossé à la Web Speech API du navigateur.
 *
 * Choix d'architecture : la reconnaissance est **en ligne**. La variante
 * hors-ligne (Vosk WASM + modèle français de ~40 Mo) a été écartée, son poids
 * étant rédhibitoire sur téléphone. Conséquence : l'audio est traité par le
 * service de reconnaissance du navigateur, donc transmis à un serveur tiers
 * (Google pour Chrome/Edge), et une connexion réseau est nécessaire.
 *
 * Support : Chrome et Edge. Firefox et Safari n'implémentent pas l'API et
 * remontent l'état 'unsupported'.
 */
@Injectable({ providedIn: 'root' })
export class SpeechService {
  readonly state$ = new BehaviorSubject<SpeechState>('ready');

  /** Segments finalisés, à insérer dans l'éditeur. */
  readonly result$ = new Subject<string>();

  /** Texte provisoire, réécrit au fil de la parole. */
  readonly partial$ = new Subject<string>();

  /** Message de la dernière erreur, ou null. */
  errorMessage: string | null = null;

  private recognition: any = null;
  private wantListening = false;

  /**
   * Éditeur actuellement propriétaire de la dictée. Le service étant un
   * singleton et plusieurs éditeurs pouvant coexister sur une même page
   * (Adresse et Info sur l'accueil), ce jeton garantit qu'une seule dictée
   * est active et que le texte part dans le bon champ.
   */
  private owner: object | null = null;

  /** Garde-fou : évite une boucle de redémarrage si le micro est indisponible. */
  private restartBurst = 0;
  private lastStart = 0;

  constructor(private readonly ngZone: NgZone) {
    if (!getRecognitionCtor()) {
      this.state$.next('unsupported');
    }
  }

  get state(): SpeechState {
    return this.state$.value;
  }

  get isSupported(): boolean {
    return this.state !== 'unsupported';
  }

  /** Éditeur propriétaire de la dictée en cours, ou null. */
  get activeOwner(): object | null {
    return this.owner;
  }

  /**
   * Démarre la dictée pour le compte de `owner`. Toute dictée déjà en cours
   * sur un autre éditeur est arrêtée au préalable.
   * Résout dès que la reconnaissance est active.
   */
  start(owner: object): Promise<void> {
    if (this.owner && this.owner !== owner) this.stop();
    this.owner = owner;

    return new Promise((resolve, reject) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) {
        this.setState('unsupported');
        reject(new Error('unsupported'));
        return;
      }

      if (!navigator.onLine) {
        this.fail('network');
        reject(new Error('network'));
        return;
      }

      this.wantListening = true;
      this.restartBurst = 0;
      this.errorMessage = null;

      const rec = new Ctor();
      this.recognition = rec;
      rec.lang = 'fr-FR';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      let settled = false;

      rec.onstart = () => {
        this.lastStart = Date.now();
        this.ngZone.run(() => this.setState('listening'));
        if (!settled) {
          settled = true;
          resolve();
        }
      };

      rec.onresult = (event: any) => {
        let interim = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalText += res[0].transcript;
          } else {
            interim += res[0].transcript;
          }
        }

        this.ngZone.run(() => {
          if (finalText) this.result$.next(finalText.trim() + ' ');
          this.partial$.next(interim);
        });
      };

      // La reconnaissance s'arrête d'elle-même après un silence :
      // on relance tant que l'utilisateur n'a pas cliqué sur stop.
      rec.onend = () => {
        if (!this.wantListening) return;

        // Si onend survient juste après onstart de façon répétée,
        // c'est que le micro ne démarre pas : on abandonne.
        this.restartBurst = Date.now() - this.lastStart < 500 ? this.restartBurst + 1 : 0;
        if (this.restartBurst >= 5) {
          this.ngZone.run(() => this.fail('audio-capture'));
          return;
        }

        try {
          rec.start();
        } catch {
          // déjà démarrée : rien à faire
        }
      };

      rec.onerror = (event: any) => {
        // 'no-speech' est bénin : aucun son capté, onend relancera l'écoute.
        if (event.error === 'no-speech') return;

        this.ngZone.run(() => this.fail(event.error));
        if (!settled) {
          settled = true;
          reject(new Error(event.error));
        }
      };

      try {
        rec.start();
      } catch (e) {
        this.fail('aborted');
        reject(e instanceof Error ? e : new Error('aborted'));
      }
    });
  }

  /** Arrête la dictée à la demande de l'utilisateur. */
  stop(): void {
    this.wantListening = false;
    this.owner = null;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
    if (this.state === 'listening') this.setState('ready');
  }

  /** Repasse en état prêt après une erreur. */
  reset(): void {
    this.errorMessage = null;
    if (this.isSupported) this.setState('ready');
  }

  private fail(code: string): void {
    this.wantListening = false;
    this.owner = null;
    this.errorMessage = describeError(code);
    this.recognition = null;
    this.setState('error');
  }

  private setState(s: SpeechState): void {
    if (this.state$.value !== s) this.state$.next(s);
  }
}
