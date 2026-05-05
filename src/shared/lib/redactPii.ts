/**
 * Version frontend de redactPii — alignée sur le backend (shared/redactPii.ts).
 * Sert au beforeSend Sentry pour scrubber les coordonnées (email, téléphone,
 * IBAN, carte, sécu) avant envoi à sentry.io.
 */

function maskEmail(match: string): string {
  const at = match.indexOf('@');
  if (at < 1) return match;
  const local = match.slice(0, at);
  const rest  = match.slice(at + 1);
  const dot   = rest.lastIndexOf('.');
  if (dot < 1) return match;
  return `${local[0]}****@${rest[0]}****${rest.slice(dot)}`;
}

function maskPhone(match: string): string {
  const digits = match.replace(/\D/g, '');
  if (digits.length < 8) return match;
  const start = digits.slice(0, 2);
  const end   = digits.slice(-2);
  let digitIdx = 0;
  let masked = '';
  for (const ch of match) {
    if (/\d/.test(ch)) {
      if (digitIdx < 2)                                  masked += start[digitIdx];
      else if (digitIdx >= digits.length - 2)            masked += end[digitIdx - (digits.length - 2)];
      else                                               masked += '*';
      digitIdx += 1;
    } else {
      masked += ch;
    }
  }
  return masked;
}

const RE_SECU  = /\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}\b/g;
const RE_IBAN  = /\bFR\d{2}[\s]?(?:[A-Z0-9]{4}[\s]?){5}[A-Z0-9]{3}\b/gi;
const RE_CARD  = /\b(?:\d[\s-]?){13,19}\b/g;
const RE_PHONE = /(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:\d[\s.-]?){8,14}\d/g;
const RE_EMAIL = /\b[\w!#$%&'*+\/=?^`{|}~.-]+@[\w.-]+\.[A-Za-z]{2,}\b/g;

export function redactPii(text: string): string {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(RE_SECU,  '[sécu]')
    .replace(RE_IBAN,  '[iban]')
    .replace(RE_CARD,  '[carte]')
    .replace(RE_PHONE, maskPhone)
    .replace(RE_EMAIL, maskEmail);
}
