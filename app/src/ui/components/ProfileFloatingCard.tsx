import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UserAccount } from '../../types/user';
import {
  LIQUID_GLASS_THEMES,
  LiquidGlassThemeMode,
  useLiquidGlassTheme,
} from '../../theme/liquidGlass';
import { LiquidGlassCard, PrimaryButton } from './LiquidGlassCard';

export interface ProfileFloatingCardProps {
  visible: boolean;
  account: UserAccount;
  onClose: () => void;
  onToggleMode: (targetMode: 'viajero' | 'aliado') => void;
  onEnterConcierge?: () => void;
  onLogout: () => void;
}

const THEME_MODES: LiquidGlassThemeMode[] = ['dark', 'light', 'mono_dark', 'mono_light'];

export const ProfileFloatingCard: React.FC<ProfileFloatingCardProps> = ({
  visible,
  account,
  onClose,
  onToggleMode,
  onEnterConcierge,
  onLogout,
}) => {
  const { theme, mode, setMode } = useLiquidGlassTheme();
  const nextMode = account.mode === 'viajero' ? 'aliado' : 'viajero';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <LiquidGlassCard elevated style={styles.card}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.name, { color: theme.textPrimary }]}>
                {account.display_name}
              </Text>
              <Text style={[styles.email, { color: theme.textSecondary }]}>
                {account.email}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.closeText, { color: theme.textPrimary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Single-account Explorador <-> Aliado mode toggle */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Modo actual: {account.mode === 'aliado' ? 'Aliado (B2B)' : 'Explorador (B2C)'}
            </Text>
            <PrimaryButton
              label={
                nextMode === 'aliado'
                  ? 'Cambiar a modo Aliado'
                  : 'Cambiar a modo Explorador'
              }
              onPress={() => {
                onClose();
                onToggleMode(nextMode);
              }}
            />
          </View>

          {/* Hidden Concierge button — rendered ONLY when concierge_access === true */}
          {account.concierge_access && onEnterConcierge && (
            <TouchableOpacity
              onPress={() => {
                onClose();
                onEnterConcierge();
              }}
              style={[styles.conciergeBtn, { borderColor: theme.accent }]}
            >
              <Text style={[styles.conciergeText, { color: theme.accent }]}>
                Entrar a Hype Control (Concierge)
              </Text>
            </TouchableOpacity>
          )}

          {/* Liquid Glass Theme Selector: Dark, Light, Mono Dark, Mono Light */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Apariencia Liquid Glass
            </Text>
            <View style={styles.themeGrid}>
              {THEME_MODES.map((m) => {
                const preset = LIQUID_GLASS_THEMES[m];
                const selected = mode === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMode(m)}
                    style={[
                      styles.themeChip,
                      {
                        backgroundColor: selected ? theme.primaryButtonBg : theme.glassSurface,
                        borderColor: selected ? theme.primaryButtonBg : theme.glassBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.themeChipText,
                        { color: selected ? theme.primaryButtonText : theme.textPrimary },
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
            <Text style={[styles.logoutText, { color: theme.textSecondary }]}>
              Cerrar sesión
            </Text>
          </TouchableOpacity>
        </LiquidGlassCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 64,
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontFamily: 'Montserrat',
    fontSize: 17,
    fontWeight: '700',
  },
  email: {
    fontFamily: 'Montserrat',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontFamily: 'Montserrat',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontFamily: 'Montserrat',
    fontSize: 12,
    fontWeight: '600',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeChip: {
    flexBasis: '47%',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  themeChipText: {
    fontFamily: 'Montserrat',
    fontSize: 12,
    fontWeight: '600',
  },
  conciergeBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  conciergeText: {
    fontFamily: 'Montserrat',
    fontSize: 13,
    fontWeight: '700',
  },
  logoutBtn: {
    alignItems: 'center',
    paddingTop: 6,
  },
  logoutText: {
    fontFamily: 'Montserrat',
    fontSize: 13,
    fontWeight: '600',
  },
});
