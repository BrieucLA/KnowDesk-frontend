import React from 'react';

interface TreeProgressBarProps {
  step:     number;   // current step, 1-based
  estimate: number;   // rough total depth (best-effort)
}

/**
 * Visual progress indicator for the question tree.
 * Uses a pulsing fill to communicate "in progress" without
 * a false exactness (tree depth varies by path taken).
 */
export function TreeProgressBar({ step, estimate }: TreeProgressBarProps) {
  // Cap at 95% — we don't know the exact depth
  const pct = Math.min(95, Math.round((step / Math.max(estimate, step)) * 100));

  return (
    <div className="tree-progress" role="progressbar" aria-valuenow={step}
      aria-valuemin={1} aria-label={`Étape ${step}`}>
      <div className="tree-progress__track">
        <div
          className="tree-progress__fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="tree-progress__label" aria-live="polite">
        Étape {step}
      </span>
    </div>
  );
}
