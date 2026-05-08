import React, { useState, useRef, useEffect } from 'react';
import './HelpPopover.css';

interface HelpPopoverProps {
  /** Contenu affiché dans la popover (texte ou JSX riche). */
  content: React.ReactNode;
  /** Label aria pour le bouton trigger. Défaut : "Aide". */
  ariaLabel?: string;
}

/**
 * Petit bouton circulaire « ? » qui ouvre une popover contextuelle au
 * clic. Utilisé à côté des réglages critiques pour expliquer l'impact
 * (ex: rétention 30j → seuil RGPD ; coût Mistral Large × 10 vs Small).
 *
 * Click outside / Escape ferme la popover. Le contenu reste flottant
 * et ne pousse pas le layout.
 */
export function HelpPopover({ content, ariaLabel = 'Aide' }: HelpPopoverProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span ref={wrapRef} className="help-popover">
      <button
        type="button"
        className="help-popover__trigger"
        onClick={() => setOpen(o => !o)}
        aria-label={ariaLabel}
        aria-expanded={open}
      >
        ?
      </button>
      {open && (
        <div className="help-popover__content" role="tooltip">
          {content}
        </div>
      )}
    </span>
  );
}
