import React from 'react';
import './PasswordStrengthMeter.css';

interface PasswordStrengthMeterProps {
  password: string;
}

/**
 * Heuristique simple (pas zxcvbn pour la taille du bundle) :
 *   +1 si ≥ 8 chars
 *   +1 si ≥ 12 chars
 *   +1 si contient majuscules ET minuscules
 *   +1 si contient un chiffre
 *   +1 si contient un caractère spécial
 *
 * Score 0-5 → 4 niveaux : Faible / Moyen / Bon / Excellent.
 */
export function passwordStrength(pw: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
} {
  if (pw.length === 0) return { score: 0, label: '' };
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw))   s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  // Cap à 4 niveaux affichables
  const score = Math.min(4, s) as 0 | 1 | 2 | 3 | 4;
  const labels = ['Très faible', 'Faible', 'Moyen', 'Bon', 'Excellent'];
  return { score, label: labels[score] };
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { score, label } = passwordStrength(password);
  if (!password) return null;
  return (
    <div className="pw-strength" aria-live="polite">
      <div className="pw-strength__bars">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`pw-strength__bar pw-strength__bar--${
              i < score ? `lvl-${score}` : 'empty'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
      <span className={`pw-strength__label pw-strength__label--lvl-${score}`}>{label}</span>
    </div>
  );
}
