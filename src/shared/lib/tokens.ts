/**
 * Design tokens — single source of truth.
 * Import from here instead of hardcoding values in components.
 */

export const DURATION = {
  instant: 120,  // hover backgrounds
  fast:    200,  // dropdowns, toasts
  normal:  280,  // page transitions
} as const;

export const RADIUS = {
  sm:   '4px',
  md:   '8px',
  lg:   '12px',
  full: '9999px',
} as const;

export const FONT_SIZE = {
  xs:   '11px',
  sm:   '12px',
  md:   '13px',
  base: '14px',
  lg:   '16px',
  xl:   '20px',
  '2xl':'26px',
} as const;

export const SPACING = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
} as const;
