/**
 * Identifiant interne stable.
 *
 * Sert aussi bien aux images (IndexedDB) qu'aux éléments de l'audit (robinets,
 * et à terme les autres entités). Un identifiant n'est jamais réattribué ni
 * renuméroté : c'est ce qui permet à une relation entre éléments de survivre à
 * une suppression dans la liste.
 *
 * `crypto.randomUUID` n'existe pas dans tous les contextes — notamment certains
 * navigateurs anciens en `file://` — d'où le repli.
 */
export function uid(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
