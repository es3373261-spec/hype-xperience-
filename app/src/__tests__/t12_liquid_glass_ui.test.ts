import {
  LIQUID_GLASS_THEMES,
  getLiquidGlassTheme,
  LiquidGlassThemeMode,
} from '../theme/liquidGlass';

describe('T-12: Liquid Glass Theme System (Dark, Light, Monocromático Dark & Light)', () => {
  const allModes: LiquidGlassThemeMode[] = ['dark', 'light', 'mono_dark', 'mono_light'];

  it('provides blur(16px) Liquid Glass surfaces and 100% opaque help sheets across all 4 theme modes', () => {
    for (const mode of allModes) {
      const palette = getLiquidGlassTheme(mode);
      expect(palette.backdropFilter).toBe('blur(16px)');
      expect(palette.blurRadiusPx).toBe(16);
      expect(palette.glassSurface).toMatch(/^rgba\(/);
      // Opaque "?" help sheets must be solid hex (no alpha channel)
      expect(palette.opaqueHelpSheetBg).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('matches Maestro v2.0 Dark (#0B0B0E / #E62E3D) and Light (#F23847) tokens', () => {
    const dark = LIQUID_GLASS_THEMES.dark;
    expect(dark.background).toBe('#0B0B0E');
    expect(dark.accent).toBe('#E62E3D');
    expect(dark.isDark).toBe(true);
    expect(dark.isMonochrome).toBe(false);
    expect(dark.opaqueHelpSheetBg).toBe('#141418');

    const light = LIQUID_GLASS_THEMES.light;
    expect(light.accent).toBe('#F23847');
    expect(light.isDark).toBe(false);
    expect(light.isMonochrome).toBe(false);
    expect(light.opaqueHelpSheetBg).toBe('#FFFFFF');
  });

  it('provides monochromatic Liquid Glass palettes (mono_dark & mono_light) with zero chromatic brand accents', () => {
    const monoDark = LIQUID_GLASS_THEMES.mono_dark;
    expect(monoDark.isMonochrome).toBe(true);
    expect(monoDark.isDark).toBe(true);
    expect(monoDark.primaryButtonBg).toBe('#FFFFFF');
    expect(monoDark.primaryButtonText).toBe('#09090B');
    expect(monoDark.accent).not.toBe('#E62E3D');

    const monoLight = LIQUID_GLASS_THEMES.mono_light;
    expect(monoLight.isMonochrome).toBe(true);
    expect(monoLight.isDark).toBe(false);
    expect(monoLight.primaryButtonBg).toBe('#111113');
    expect(monoLight.primaryButtonText).toBe('#FFFFFF');
    expect(monoLight.accent).not.toBe('#F23847');
  });
});
