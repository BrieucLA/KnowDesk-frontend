import React from 'react';
import { cn } from '../../lib/cn';

interface SkeletonProps {
  className?: string;
}

/** Animated placeholder for loading states. Use instead of a global spinner. */
export function Skeleton({ className }: SkeletonProps) {
  return <span className={cn('skeleton', className)} aria-hidden="true" />;
}
