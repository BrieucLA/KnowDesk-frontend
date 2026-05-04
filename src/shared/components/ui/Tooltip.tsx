import React, { useEffect, useId, useRef, useState } from 'react';

/**
 * InfoTooltip — petite icône ⓘ qui ouvre une bulle d'aide au hover/focus/tap.
 *
 * Usage :
 *   <InfoTooltip
 *     title="Couverture"
 *     rows={[
 *       { label: 'Quoi',   text: '...' },
 *       { label: 'Calcul', text: '...' },
 *       { label: 'Action', text: '...' },
 *     ]}
 *   />
 *
 * Accessibilité :
 *  - L'icône est un <button> focusable au clavier (Tab → focus → bulle visible)
 *  - aria-describedby relie le bouton au tooltip pour les lecteurs d'écran
 *  - Escape ferme la bulle quand elle a le focus
 *  - Tap mobile (click) toggle (le hover ne marche pas sur tactile)
 *  - Click outside ferme aussi
 *
 * Style : la bulle s'affiche au-dessus de l'icône par défaut. Si la rangée
 * est en haut de page, la bulle peut sortir du viewport — on n'a pas
 * implémenté le smart-placement pour cette V1, à voir au cas par cas.
 */
export interface InfoTooltipRow {
  label: string;
  /** Texte simple ou JSX si on veut formater (gras, lien…). */
  text:  React.ReactNode;
}

interface InfoTooltipProps {
  /** Titre affiché en gras dans la bulle. */
  title:    string;
  /** Lignes structurées Label : Texte (le pattern qu'on impose dans Analytics). */
  rows?:    InfoTooltipRow[];
  /** Contenu libre à la place des rows si besoin de formatage particulier. */
  children?: React.ReactNode;
  /** Texte alternatif du bouton, lu par les lecteurs d'écran. */
  ariaLabel?: string;
}

export function InfoTooltip({ title, rows, children, ariaLabel }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const wrapRef         = useRef<HTMLSpanElement>(null);
  const tooltipId       = useId();

  // Escape pour fermer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Click outside pour fermer
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // setTimeout pour ne pas attraper le click qui vient d'ouvrir
    const t = window.setTimeout(() => window.addEventListener('mousedown', onClick), 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    <span
      ref={wrapRef}
      className="info-tooltip"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="info-tooltip__trigger"
        aria-label={ariaLabel ?? `À propos de ${title}`}
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7 4.5v.01M6.4 6.5h.6V10h.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        </svg>
      </button>
      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          className="info-tooltip__bubble"
        >
          <div className="info-tooltip__title">{title}</div>
          {rows && rows.length > 0 && (
            <dl className="info-tooltip__rows">
              {rows.map(r => (
                <div key={r.label} className="info-tooltip__row">
                  <dt>{r.label}</dt>
                  <dd>{r.text}</dd>
                </div>
              ))}
            </dl>
          )}
          {children}
          <span className="info-tooltip__arrow" aria-hidden="true" />
        </div>
      )}
    </span>
  );
}
