import React from 'react';
import { Skeleton } from '../../../shared/components/ui/Skeleton';

interface StatCardProps {
  label:    string;
  value:    number;
  loading?: boolean;
}

/** Metric card — label above, big number below. */
export function StatCard({ label, value, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="stat-card" aria-busy="true" aria-label="Chargement…">
        <Skeleton className="stat-card__skeleton-label" />
        <Skeleton className="stat-card__skeleton-value" />
      </div>
    );
  }

  return (
    <div className="stat-card">
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">{value.toLocaleString('fr-FR')}</span>
    </div>
  );
}
