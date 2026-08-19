import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DRIVE_CONFIG, driveIsConfigured } from './drive-config';
import { safeStorage } from '../utils/safe-storage';

const TOKEN_KEY = 'sobrieau.drive.token';

const DEVICE_URL = 'https://oauth2.googleapis.com/device/code';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

export type AuthState =
  | 'unconfigured' // identifiants absents de drive-config.ts
  | 'disconnected'
  | 'pending' // en attente de la saisie du code par l'auditeur
  | 'connected'
  | 'error';

/** Identité du compte connecté, pour l'afficher dans l'en-tête. */
export interface GoogleProfile {
  name: string;
  email: string;
  /** Une ou deux lettres, affichées dans la pastille. */
  initials: string;
}

/** Ce que l'auditeur doit saisir sur un autre appareil. */
export interface DeviceChallenge {
  userCode: string;
  verificationUrl: string;
}

interface StoredToken {
  refreshToken: string;
  accessToken: string;
  /** Horodatage d'expiration, en millisecondes. */
  expiresAt: number;
}

/**
 * Authentification Google par « device flow » (RFC 8628).
 *
 * Ce flux n'utilise **aucune URI de redirection** : l'application affiche un
 * code, l'auditeur le saisit depuis son téléphone, et l'application interroge
 * Google jusqu'à obtenir le jeton. C'est le seul flux exploitable depuis le
 * fichier autonome, dont l'origine est `null`.
 *
 * Vérifié en conditions réelles : Google renvoie les en-têtes CORS pour
 * l'origine nulle sur `device/code`, `token`, `revoke` et l'API Drive — ce qui
 * n'est le cas ni de Microsoft ni de GitHub. Voir `tools/README.md`.
 */
@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  readonly state$ = new BehaviorSubject<AuthState>('disconnected');
  readonly challenge$ = new BehaviorSubject<DeviceChallenge | null>(null);
  readonly profile$ = new BehaviorSubject<GoogleProfile | null>(null);

  /** Message de la dernière erreur, destiné à l'auditeur. */
  errorMessage: string | null = null;

  private token: StoredToken | null = null;
  private annule = false;

  constructor() {
    if (!driveIsConfigured()) {
      this.state$.next('unconfigured');
      return;
    }
    this.token = this.readToken();
    this.state$.next(this.token ? 'connected' : 'disconnected');
    if (this.token) void this.loadProfile();
  }

  get state(): AuthState {
    return this.state$.value;
  }

  // ── Connexion ────────────────────────────────────────────────────────────

  /**
   * Démarre le flux et interroge Google jusqu'à validation.
   * Le code à saisir est publié sur `challenge$` dès qu'il est disponible.
   */
  async connect(): Promise<void> {
    if (!driveIsConfigured()) {
      this.state$.next('unconfigured');
      return;
    }

    this.annule = false;
    this.errorMessage = null;

    try {
      const demande = await this.post(DEVICE_URL, {
        client_id: DRIVE_CONFIG.clientId,
        scope: DRIVE_CONFIG.scope,
      });

      if (demande.status !== 200) {
        return this.fail(this.decrire(demande.body));
      }

      this.challenge$.next({
        userCode: demande.body['user_code'] as string,
        verificationUrl: demande.body['verification_url'] as string,
      });
      this.state$.next('pending');

      await this.poll(
        demande.body['device_code'] as string,
        Number(demande.body['interval'] ?? 5) * 1000,
        Number(demande.body['expires_in'] ?? 1800) * 1000
      );
    } catch (e) {
      this.fail(e instanceof Error ? e.message : String(e));
    }
  }

  /** L'auditeur renonce : on cesse d'interroger Google. */
  cancel(): void {
    this.annule = true;
    this.challenge$.next(null);
    if (this.state === 'pending') this.state$.next('disconnected');
  }

  private async poll(deviceCode: string, intervalle: number, duree: number): Promise<void> {
    const fin = Date.now() + duree;

    while (Date.now() < fin) {
      await new Promise((r) => setTimeout(r, intervalle));
      if (this.annule) return;

      const r = await this.post(TOKEN_URL, {
        client_id: DRIVE_CONFIG.clientId,
        client_secret: DRIVE_CONFIG.clientSecret,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      });

      if (r.status === 200) {
        this.store({
          refreshToken: r.body['refresh_token'] as string,
          accessToken: r.body['access_token'] as string,
          expiresAt: Date.now() + Number(r.body['expires_in'] ?? 3600) * 1000,
        });
        this.challenge$.next(null);
        this.state$.next('connected');
        void this.loadProfile();
        return;
      }

      const err = r.body['error'];
      // L'auditeur n'a pas encore validé : c'est le cas nominal.
      if (err === 'authorization_pending') continue;
      // Google demande de ralentir : on allonge l'intervalle plutôt que d'insister.
      if (err === 'slow_down') {
        intervalle += 2000;
        continue;
      }
      return this.fail(this.decrire(r.body));
    }

    this.fail('Délai dépassé : le code n’a pas été validé à temps.');
  }

  // ── Jeton ────────────────────────────────────────────────────────────────

  /**
   * Jeton d'accès valide, renouvelé si nécessaire.
   * Renvoie null si l'auditeur n'est pas connecté.
   */
  async accessToken(): Promise<string | null> {
    if (!this.token) return null;

    // Marge d'une minute : un jeton qui expire pendant l'envoi ferait échouer
    // une requête déjà partie.
    if (Date.now() < this.token.expiresAt - 60_000) return this.token.accessToken;

    const r = await this.post(TOKEN_URL, {
      client_id: DRIVE_CONFIG.clientId,
      client_secret: DRIVE_CONFIG.clientSecret,
      refresh_token: this.token.refreshToken,
      grant_type: 'refresh_token',
    });

    if (r.status !== 200) {
      // Jeton révoqué côté Google, ou consentement retiré.
      this.forget();
      this.fail(this.decrire(r.body));
      return null;
    }

    this.store({
      refreshToken: this.token.refreshToken,
      accessToken: r.body['access_token'] as string,
      expiresAt: Date.now() + Number(r.body['expires_in'] ?? 3600) * 1000,
    });
    return this.token.accessToken;
  }

  /**
   * Déconnexion : le jeton est **révoqué chez Google**, pas seulement oublié.
   * Sur un poste partagé, l'effacer localement ne suffirait pas.
   */
  async signOut(): Promise<void> {
    const jeton = this.token?.refreshToken;
    this.forget();
    if (jeton) {
      try {
        await this.post(REVOKE_URL, { token: jeton });
      } catch {
        /* révocation impossible hors ligne : le jeton local est déjà effacé */
      }
    }
  }

  /**
   * Récupère nom et adresse du compte, pour la pastille de l'en-tête.
   * Un échec n'est pas bloquant : la synchronisation fonctionne sans identité.
   */
  private async loadProfile(): Promise<void> {
    try {
      const token = await this.accessToken();
      if (!token) return;

      const r = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!r.ok) return;

      const u = (await r.json()) as Record<string, string>;
      const name = u['name'] || u['email'] || '';
      this.profile$.next({ name, email: u['email'] ?? '', initials: initiales(name, u['email']) });
    } catch {
      /* identité indisponible : on reste connecté, sans pastille nominative */
    }
  }

  // ── Outils ───────────────────────────────────────────────────────────────

  private async post(
    url: string,
    params: Record<string, string>
  ): Promise<{ status: number; body: Record<string, unknown> }> {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    });
    const body = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    return { status: r.status, body };
  }

  private decrire(body: Record<string, unknown>): string {
    const code = String(body['error'] ?? 'inconnue');
    const detail = body['error_description'];
    switch (code) {
      case 'access_denied':
        return "Autorisation refusée sur la page Google.";
      case 'expired_token':
        return 'Le code a expiré. Relancez la connexion.';
      case 'invalid_client':
        return (
          "Identifiant client refusé. Vérifiez qu'il est de type « Téléviseurs " +
          'et périphériques d’entrée limités ».'
        );
      case 'invalid_scope':
        return "Portée refusée par Google. Seul `drive.file` est accepté sur ce flux.";
      default:
        return detail ? `${code} — ${detail}` : `Erreur Google : ${code}`;
    }
  }

  private fail(message: string): void {
    this.errorMessage = message;
    this.challenge$.next(null);
    this.state$.next('error');
  }

  private store(t: StoredToken): void {
    this.token = t;
    safeStorage.setItem(TOKEN_KEY, JSON.stringify(t));
  }

  private forget(): void {
    this.token = null;
    safeStorage.removeItem(TOKEN_KEY);
    this.challenge$.next(null);
    this.profile$.next(null);
    this.state$.next(driveIsConfigured() ? 'disconnected' : 'unconfigured');
  }

  private readToken(): StoredToken | null {
    try {
      const raw = safeStorage.getItem(TOKEN_KEY);
      const t = raw ? (JSON.parse(raw) as StoredToken) : null;
      return t?.refreshToken ? t : null;
    } catch {
      return null;
    }
  }
}

/**
 * Initiales affichées dans la pastille : premières lettres du prénom et du nom,
 * à défaut les deux premières de l'adresse électronique.
 */
function initiales(name: string, email?: string): string {
  const mots = (name || '').trim().split(/\s+/).filter(Boolean);
  if (mots.length >= 2) return (mots[0][0] + mots[mots.length - 1][0]).toUpperCase();
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
  return (email || '?').slice(0, 2).toUpperCase();
}
