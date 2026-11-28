export const maestroDarkTheme = {
  mode: 'dark' as const,
  isDefault: true,
  background: '#0B0B0E',
  cardBackground: 'rgba(28, 28, 34, 0.75)',
  backdropFilter: 'blur(16px)',
  cardBorder: 'rgba(230, 46, 61, 0.25)',
  accent: '#E62E3D',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
};

export const maestroLightTheme = {
  mode: 'light' as const,
  isDefault: false,
  background: 'rgba(248, 248, 250, 0.85)',
  cardBackground: 'rgba(255, 255, 255, 0.90)',
  backdropFilter: 'blur(16px)',
  cardBorder: 'rgba(242, 56, 71, 0.25)',
  accent: '#F23847',
  textPrimary: '#0B0B0E',
  textSecondary: '#4B5563',
};

export const brandTokens = {
  wordmark: {
    primary: {
      text: 'HYPE',
      fontWeight: 800,
    },
    secondary: {
      text: 'XPERIENCE',
      fontWeight: 300,
      letterSpacing: '0.15em',
    },
  },
  suitcase: {
    color: '#E62E3D',
    is3D: true,
    isSoleSuitcaseImage: true,
  },
};

export const typographyTokens = {
  appFontFamily: 'Montserrat',
  codeFontFamily: 'JetBrains Mono',
  codeFontSourceCodeOnly: true,
};

export const splashTokens = {
  firstLoadDurationMs: 8000,
  modeSwitchDurationMs: 900,
  backgroundColor: '#000000',
  suitcaseColor: '#E62E3D',
  showProgressBar: false,
  showText: false,
};

export const navigationTokens = {
  tabs: ['Feed', 'Explorar', 'Tickets', 'Taxi', 'Wallet'] as const,
  independentFloatingButtons: true,
  positionRelativeToAuraBar: 'above' as const,
};

export const auraBarTokens = {
  borderRadius: 999,
  placeholder: 'Crea tu Xperience con Aura...',
  placement: 'bottom_below_nav' as const,
  orbColor: '#E62E3D',
};

export const glassmorphismTokens = {
  backdropFilter: 'blur(16px)',
  blurRadiusPx: 16,
  helpSheetOpaque: true,
  datePickerStyle: 'liquid_glass' as const,
};

export const welcomeTokens = {
  greetingPrefix: 'Bienvenido a la Saga del Sol',
  forbiddenCopy: ['MODO TURISTA'] as const,
};

export const iconTokens = {
  style: 'line' as const,
  allowEmojisAsIcons: false,
  ratingIcon: 'star' as const,
  allowFireIcons: false,
  ratingScale: { min: 1.0, max: 5.0 },
};

export const responsiveTokens = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
};

export const themeTokens = {
  colors: {
    background: '#0B0B0E',
    accent: '#E62E3D',
    textPrimary: '#FFFFFF',
    textSecondary: '#9CA3AF',
    cardBackground: 'rgba(28, 28, 34, 0.75)',
    border: 'rgba(230, 46, 61, 0.25)',
  },
  card: {
    borderRadius: 16,
    hasHeroPhoto: true,
    backgroundColor: 'rgba(28, 28, 34, 0.75)',
    backdropFilter: 'blur(16px)',
  },
  primaryButton: {
    backgroundColor: '#E62E3D',
    textColor: '#FFFFFF',
    textAlign: 'center' as const,
    symmetric: true,
    borderRadius: 8,
  },
  calendar: {
    location: 'feed-only' as const,
    unifiedIn: 'Explorar' as const,
    defaultView: 'weekly' as const,
    canSwitchToMonthly: true,
    bookingColor: '#d4af37',
    eventColor: '#46578f',
    showMonthWeekToggleButtons: false,
    showSharedViewLegend: false,
    circularArrowButtons: true,
  },
};
