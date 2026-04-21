/**
 * Utility to merge class names conditionally.
 * Lightweight replacement for clsx — no extra dependency needed.
 *
 * Usage:
 *   cn('base-class', isActive && 'active', error ? 'red' : 'green')
 */
export function cn(...inputs: (string | boolean | undefined | null)[]): string {
  return inputs.filter(Boolean).join(' ');
}
