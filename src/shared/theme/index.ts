// Design tokens shared across every feature. No feature-specific values here.

export const colors = {
  background: '#ffffff',
  surface: '#f7f7f8',
  border: '#e4e4e7',
  text: '#18181b',
  textMuted: '#71717a',
  primary: '#2563eb',
  primaryText: '#ffffff',
  danger: '#dc2626',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  pill: 999,
} as const;

export const typography = {
  title: 24,
  body: 17,
  small: 14,
} as const;

export const theme = { colors, spacing, radius, typography } as const;
export type Theme = typeof theme;
