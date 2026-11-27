/**
 * Tokens base (T01–T10, design-system v2).
 */
export const themeTokens = {
  colors: {
    background: '#0a0a0a',
    accent: '#d4af37',
    textPrimary: '#ffffff',
    textSecondary: '#9ca3af',
    cardBackground: '#121212',
    border: '#262626',
  },
  card: {
    borderRadius: 16,
    hasHeroPhoto: true,
    backgroundColor: '#121212',
  },
  primaryButton: {
    backgroundColor: '#d4af37',
    textColor: '#000000',
    borderRadius: 8,
  },
  calendar: {
    location: 'feed-only' as const,
    defaultView: 'weekly' as const,
    canSwitchToMonthly: true,
  },
};

/**
 * Tokens alineados al Borrador v5 (README.md §El plano / §Stack):
 * fondo #0B0B0E, acento gris #8E8E93 (oscuro) / #6E6E73 (claro),
 * Liquid Glass, Montserrat y splash de 1.8s.
 */
export const themeTokensV5 = {
  dark: {
    background: '#0B0B0E',
    accent: '#8E8E93',
    accentHighContrast: '#6E6E73',
    textPrimary: '#FFFFFF',
    textSecondary: '#A1A1AA',
    glassFill: 'rgba(255, 255, 255, 0.08)',
    glassBorder: 'rgba(255, 255, 255, 0.16)',
  },
  light: {
    background: '#F5F2EA',
    accent: '#6E6E73',
    textPrimary: '#1A1B26',
    textSecondary: '#6E6E73',
    glassFill: 'rgba(255, 255, 255, 0.65)',
    glassBorder: 'rgba(255, 255, 255, 0.60)',
  },
  typography: {
    fontFamily: 'Montserrat',
    wordmarkTracking: '0.15em',
  },
  splashDurationMs: 1800,
};
