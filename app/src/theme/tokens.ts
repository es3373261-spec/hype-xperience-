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
