import React from 'react';
import './Switch.css';

interface SwitchProps {
  /** ID HTML pour le label associé. */
  id?:        string;
  /** Label visible à gauche du toggle. */
  label:      string;
  /** Description optionnelle sous le label (texte secondaire). */
  description?: string;
  checked:    boolean;
  onChange:   (next: boolean) => void;
  disabled?:  boolean;
  /** Si fourni, remplace le label cliqué pour `aria-label` (ex: contexte custom). */
  ariaLabel?: string;
}

/**
 * Switch (toggle on/off) accessible — extrait de la version réinventée
 * dans SettingsPage et ChatbotSettingsSection. Utilise role="switch" +
 * aria-checked pour les lecteurs d'écran.
 *
 * Le wrapper `.switch-row` est cliquable dans son ensemble (label + zone
 * blanche) pour respecter Fitts's Law sur des paramètres à 1 levier.
 */
export function Switch({
  id, label, description, checked, onChange, disabled, ariaLabel,
}: SwitchProps) {
  return (
    <div className={`switch-row${disabled ? ' switch-row--disabled' : ''}`}>
      <div className="switch-row__text">
        <label htmlFor={id} className="switch-row__label">{label}</label>
        {description && <p className="switch-row__desc">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-label={ariaLabel ?? label}
        disabled={disabled}
        className={`switch${checked ? ' switch--on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="switch__thumb" />
      </button>
    </div>
  );
}
