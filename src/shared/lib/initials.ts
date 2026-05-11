/**
 * Calcule les initiales d'affichage pour un user/membre, garantit la
 * même règle partout (sidebar avatar, ligne membre, impersonate banner,
 * etc.) — évite la divergence où le même utilisateur s'affichait « BL »
 * d'un côté et « B » de l'autre selon la source de données.
 *
 * Priorité :
 *  1. firstName[0] + lastName[0]  → ex. "BL"
 *  2. firstName[0..2]              → ex. "BR" si pas de lastName
 *  3. email[0..2] avant @          → ex. "BR" pour brieuc@...
 *  4. fallback "?"
 *
 * Robuste face aux strings littérales « undefined » / « null » qui
 * peuvent traîner en DB sur les vieux comptes.
 */
function isUsable(s: unknown): s is string {
  return typeof s === 'string'
    && s.trim().length > 0
    && s !== 'undefined'
    && s !== 'null';
}

export function computeInitials(user: {
  firstName?: string | null;
  lastName?:  string | null;
  email?:     string;
}): string {
  const first = isUsable(user.firstName) ? user.firstName.trim() : '';
  const last  = isUsable(user.lastName)  ? user.lastName.trim()  : '';

  if (first && last)  return (first[0] + last[0]).toUpperCase();
  if (first.length >= 2) return first.slice(0, 2).toUpperCase();
  if (first)          return first[0].toUpperCase();

  const email = isUsable(user.email) ? user.email.trim() : '';
  if (email) {
    const local = email.split('@')[0];
    if (local.length >= 2) return local.slice(0, 2).toUpperCase();
    if (local)             return local[0].toUpperCase();
  }
  return '?';
}
