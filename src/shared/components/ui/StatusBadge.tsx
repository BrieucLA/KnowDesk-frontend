import React from 'react';

type Status = 'draft' | 'published' | 'archived';

interface StatusBadgeProps {
  status: Status;
}

const CONFIG: Record<Status, { label: string; className: string }> = {
  published: { label: 'Publié',   className: 'badge badge--success' },
  draft:     { label: 'Brouillon', className: 'badge badge--secondary' },
  archived:  { label: 'Archivé',  className: 'badge badge--warning' },
};

/**
 * Status badge — always shows text alongside color.
 * Never uses color alone to convey meaning (a11y rule).
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className } = CONFIG[status];
  return <span className={className}>{label}</span>;
}
