export const COLORS = {
  black: '#000000',
  background: '#0f172a',
  backgroundSecondary: '#1e293b',
  foreground: '#f8fafc',
  white: '#ffffff',
  accentPrimary: '#38bdf8',
  accentSecondary: '#3b82f6',
  cardBackground: 'rgba(15, 23, 42, 0.92)',
  cardBorder: 'rgba(148, 163, 184, 0.35)',
  cardShadow: 'rgba(8, 47, 73, 0.3)',
  textMuted: 'rgba(226, 232, 240, 0.8)',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  buttonPrimaryBackground: '#2563eb',
  buttonSecondaryBackground: '#e5e7eb',
  buttonGhostBorder: '#d1d5db',
  buttonSecondaryText: '#111827',
  buttonGhostText: '#111827',
  ctaShadow: 'rgba(56, 189, 248, 0.25)',
  footerMuted: 'rgba(148, 163, 184, 0.75)',
  codeBackground: 'rgba(15, 23, 42, 0.7)',
  // Canvas-specific colors
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  border: '#e5e7eb',
} as const;

export const GRADIENTS = {
  body: `linear-gradient(160deg, ${COLORS.backgroundSecondary}, ${COLORS.background})`,
  cta: `linear-gradient(120deg, ${COLORS.accentPrimary}, ${COLORS.accentSecondary})`,
} as const;
