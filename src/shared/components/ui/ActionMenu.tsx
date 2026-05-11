import React, { useEffect, useRef, useState } from 'react';
import './ActionMenu.css';

export type ActionMenuItem =
  | {
      type?:    'item';
      label:    string;
      onClick:  () => void;
      variant?: 'default' | 'danger';
      disabled?: boolean;
      hidden?:   boolean;
    }
  | { type: 'separator'; hidden?: boolean };

interface ActionMenuProps {
  items:      ActionMenuItem[];
  /** Label a11y du bouton trigger. Default : « Actions ». */
  ariaLabel?: string;
  /** Si fourni, override l'icône du trigger (default : ···). */
  triggerLabel?: React.ReactNode;
}

/**
 * Menu d'actions en popover déclenché par un bouton « ··· ».
 *
 * - Click outside ferme
 * - Escape ferme + restaure le focus sur le trigger
 * - Items avec `variant: 'danger'` rendus en rouge (suppression typiquement)
 * - Items avec `hidden: true` ne sont pas rendus (utile pour actions
 *   contextuelles : ex. "Publier" caché si déjà publié)
 * - Separators acceptés pour grouper visuellement
 *
 * Pattern préféré au lieu de 3-4 boutons inline dans une cellule de
 * tableau — libère l'espace et regroupe l'action destructive.
 */
export function ActionMenu({ items, ariaLabel = 'Actions', triggerLabel = '···' }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef    = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (wrapRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown',   onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown',   onKey);
    };
  }, [open]);

  const visibleItems = items.filter(i => !i.hidden);
  if (visibleItems.length === 0) return null;

  return (
    <span ref={wrapRef} className="action-menu">
      <button
        ref={triggerRef}
        type="button"
        className="action-menu__trigger"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        {triggerLabel}
      </button>

      {open && (
        <div className="action-menu__popover" role="menu">
          {visibleItems.map((item, i) => {
            if (item.type === 'separator') {
              return <div key={`sep-${i}`} className="action-menu__separator" role="separator" />;
            }
            const variant = item.variant ?? 'default';
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={`action-menu__item action-menu__item--${variant}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.disabled) return;
                  setOpen(false);
                  item.onClick();
                }}
                disabled={item.disabled}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </span>
  );
}
