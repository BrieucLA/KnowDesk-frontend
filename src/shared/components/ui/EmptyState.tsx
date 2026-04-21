import React from 'react';

interface EmptyStateProps {
  title:       string;
  description: string;
  ctaLabel?:   string;
  ctaHref?:    string;
  onCta?:      () => void;
}

export function EmptyState({ title, description, ctaLabel, ctaHref, onCta }: EmptyStateProps) {
  return (
    <div className="empty-state" role="region" aria-label={title}>
      <div className="empty-state__icon" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" strokeOpacity=".4"/>
          <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.5" strokeOpacity=".4"/>
          <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="1.5" strokeOpacity=".4"/>
        </svg>
      </div>
      <h3 className="empty-state__title">{title}</h3>
      <p  className="empty-state__desc">{description}</p>
      {ctaLabel && (
        onCta ? (
          <button type="button" onClick={onCta} className="empty-state__cta">
            {ctaLabel}
          </button>
        ) : ctaHref ? (
          <a href={ctaHref} className="empty-state__cta">
            {ctaLabel}
          </a>
        ) : null
      )}
    </div>
  );
}
