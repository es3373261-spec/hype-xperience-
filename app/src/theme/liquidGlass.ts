import React, { createContext, useContext, useState } from 'react';

export type LiquidGlassThemeMode = 'dark' | 'light' | 'mono_dark' | 'mono_light';

export interface LiquidGlassPalette {
  mode: LiquidGlassThemeMode;
  label: string;
  isDark: boolean;
  isMonochrome: boolean;
  background: string;
  surfaceCanvas: string;
  glassSurface: string;
  glassElevated: string;
  glassBorder: string;
  specularHighlight: string;
  backdropFilter: 'blur(16px)';
  blurRadiusPx: 16;
  opaqueHelpSheetBg: string;
  opaqueHelpSheetBorder: string;
  accent: string;
  primaryButtonBg: string;
  primaryButtonText: string;
  textPrimary: string;
  textSecondary: string;
  pillBarBg: string;
  pillBarBorder: string;
  orbColor: string;
  calendarBookingColor: string;
  calendarEventColor: string;
  shadowColor: string;
}

export const LIQUID_GLASS_THEMES: Record<LiquidGlassThemeMode, LiquidGlassPalette> = {
  // 1. Dark Mode (Hype Night — Liquid Glass por defecto, spec §4)
  dark: {
    mode: 'dark',
    label: 'Oscuro',
    isDark: true,
    isMonochrome: false,
    background: '#0B0B0E',
    surfaceCanvas: '#121218',
    glassSurface: 'rgba(28, 28, 34, 0.75)',
    glassElevated: 'rgba(38, 38, 46, 0.82)',
    glassBorder: 'rgba(230, 46, 61, 0.25)',
    specularHighlight: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(16px)',
    blurRadiusPx: 16,
    opaqueHelpSheetBg: '#141418',
    opaqueHelpSheetBorder: 'rgba(230, 46, 61, 0.35)',
    accent: '#E62E3D',
    primaryButtonBg: '#E62E3D',
    primaryButtonText: '#FFFFFF',
    textPrimary: '#FFFFFF',
    textSecondary: '#A1A1AA',
    pillBarBg: 'rgba(20, 20, 26, 0.84)',
    pillBarBorder: 'rgba(230, 46, 61, 0.35)',
    orbColor: '#E62E3D',
    calendarBookingColor: '#d4af37',
    calendarEventColor: '#46578f',
    shadowColor: '#000000',
  },

  // 2. Light Mode (Diurno / Playa — Liquid Glass perlado, spec §4)
  light: {
    mode: 'light',
    label: 'Claro',
    isDark: false,
    isMonochrome: false,
    background: '#F4F4F7',
    surfaceCanvas: '#ECECF1',
    glassSurface: 'rgba(248, 248, 250, 0.85)',
    glassElevated: 'rgba(255, 255, 255, 0.92)',
    glassBorder: 'rgba(242, 56, 71, 0.22)',
    specularHighlight: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(16px)',
    blurRadiusPx: 16,
    opaqueHelpSheetBg: '#FFFFFF',
    opaqueHelpSheetBorder: 'rgba(17, 24, 39, 0.12)',
    accent: '#F23847',
    primaryButtonBg: '#F23847',
    primaryButtonText: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    pillBarBg: 'rgba(255, 255, 255, 0.88)',
    pillBarBorder: 'rgba(242, 56, 71, 0.28)',
    orbColor: '#F23847',
    calendarBookingColor: '#d4af37',
    calendarEventColor: '#46578f',
    shadowColor: 'rgba(17, 24, 39, 0.14)',
  },

  // 3. Monocromático Oscuro (Liquid Glass grafito / plata puro)
  mono_dark: {
    mode: 'mono_dark',
    label: 'Mono Oscuro',
    isDark: true,
    isMonochrome: true,
    background: '#09090B',
    surfaceCanvas: '#111114',
    glassSurface: 'rgba(24, 24, 27, 0.78)',
    glassElevated: 'rgba(39, 39, 42, 0.84)',
    glassBorder: 'rgba(255, 255, 255, 0.16)',
    specularHighlight: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(16px)',
    blurRadiusPx: 16,
    opaqueHelpSheetBg: '#121214',
    opaqueHelpSheetBorder: 'rgba(255, 255, 255, 0.22)',
    accent: '#E4E4E7',
    primaryButtonBg: '#FFFFFF',
    primaryButtonText: '#09090B',
    textPrimary: '#FAFAFA',
    textSecondary: '#A1A1AA',
    pillBarBg: 'rgba(20, 20, 23, 0.86)',
    pillBarBorder: 'rgba(255, 255, 255, 0.20)',
    orbColor: '#E4E4E7',
    calendarBookingColor: '#D4D4D8',
    calendarEventColor: '#71717A',
    shadowColor: '#000000',
  },

  // 4. Monocromático Claro (Liquid Glass cristal hielo / tinta negra)
  mono_light: {
    mode: 'mono_light',
    label: 'Mono Claro',
    isDark: false,
    isMonochrome: true,
    background: '#F5F5F7',
    surfaceCanvas: '#EAEAEE',
    glassSurface: 'rgba(255, 255, 255, 0.82)',
    glassElevated: 'rgba(255, 255, 255, 0.94)',
    glassBorder: 'rgba(17, 24, 39, 0.14)',
    specularHighlight: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(16px)',
    blurRadiusPx: 16,
    opaqueHelpSheetBg: '#FFFFFF',
    opaqueHelpSheetBorder: 'rgba(17, 24, 39, 0.18)',
    accent: '#18181B',
    primaryButtonBg: '#111113',
    primaryButtonText: '#FFFFFF',
    textPrimary: '#111113',
    textSecondary: '#52525B',
    pillBarBg: 'rgba(255, 255, 255, 0.90)',
    pillBarBorder: 'rgba(17, 24, 39, 0.18)',
    orbColor: '#18181B',
    calendarBookingColor: '#27272A',
    calendarEventColor: '#71717A',
    shadowColor: 'rgba(0, 0, 0, 0.10)',
  },
};

export function getLiquidGlassTheme(mode: LiquidGlassThemeMode = 'dark'): LiquidGlassPalette {
  return LIQUID_GLASS_THEMES[mode] || LIQUID_GLASS_THEMES.dark;
}

interface LiquidGlassThemeContextValue {
  theme: LiquidGlassPalette;
  mode: LiquidGlassThemeMode;
  setMode: (mode: LiquidGlassThemeMode) => void;
}

const LiquidGlassThemeContext = createContext<LiquidGlassThemeContextValue>({
  theme: LIQUID_GLASS_THEMES.dark,
  mode: 'dark',
  setMode: () => {},
});

export const LiquidGlassThemeProvider: React.FC<{
  initialMode?: LiquidGlassThemeMode;
  children: React.ReactNode;
}> = ({ initialMode = 'dark', children }) => {
  const [mode, setMode] = useState<LiquidGlassThemeMode>(initialMode);
  const theme = getLiquidGlassTheme(mode);

  return React.createElement(
    LiquidGlassThemeContext.Provider,
    { value: { theme, mode, setMode } },
    children
  );
};

export function useLiquidGlassTheme(): LiquidGlassThemeContextValue {
  return useContext(LiquidGlassThemeContext);
}
