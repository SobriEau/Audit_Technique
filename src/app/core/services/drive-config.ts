/**
 * Identifiants du client OAuth pour la synchronisation Google Drive.
 *
 * ── Type de client ───────────────────────────────────────────────────
 * Il faut un client **« Téléviseurs et périphériques d'entrée limités »**.
 * Un client « Application Web » est refusé d'emblée : le flux utilisé ici est
 * le device flow (RFC 8628), seul à fonctionner depuis un fichier ouvert en
 * `file://`, puisqu'il n'exige aucune URI de redirection.
 *
 * ── Portée ───────────────────────────────────────────────────────────
 * `drive.file` est la **seule** portée Drive que Google accorde à ce flux
 * (mesuré : `drive` et `drive.appdata` sont refusés). Elle ne donne accès
 * qu'aux fichiers créés par l'application — suffisant pour déposer et relire
 * des audits, et préférable côté consentement.
 *
 * ── Le secret, et le dépôt ───────────────────────────────────────────
 * Ces identifiants sont **volontairement versionnés**. Google indique que le
 * secret d'un client installé n'est pas traité comme confidentiel : il est par
 * nature distribué avec l'application, et le device flow exige de toute façon
 * une validation humaine sur un autre appareil. Le retirer d'ici ne
 * protégerait rien, puisqu'il figure aussi dans `index.html`, commité.
 *
 * Ce qui reste sensible, en revanche, ce sont les **jetons** obtenus après
 * connexion : ils vivent dans le localStorage du poste, jamais dans le dépôt,
 * et la déconnexion les révoque côté Google.
 *
 * Laisser ces champs vides désactive proprement la fonction : l'application
 * affiche « non configurée » et tout le reste continue de fonctionner.
 */
export const DRIVE_CONFIG = {
  clientId: '705709334285-h47m0a7can25a1p3ls6ftn6qs786o2t2.apps.googleusercontent.com',
  clientSecret: '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',
  /**
   * `drive.file` pour déposer les audits, `openid email profile` pour afficher
   * l'identité dans l'en-tête. Combinaison vérifiée comme acceptée par le
   * device flow — contrairement à `drive` et `drive.appdata`.
   */
  scope: 'https://www.googleapis.com/auth/drive.file openid email profile',
  /** Dossier créé sur le Drive pour y ranger les audits. */
  folderName: 'SobriEau',
};

export function driveIsConfigured(): boolean {
  return !!DRIVE_CONFIG.clientId && !!DRIVE_CONFIG.clientSecret;
}
