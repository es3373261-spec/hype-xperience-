import React from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useLiquidGlassTheme } from '../../theme/liquidGlass';

export interface LiquidGlassCardProps {
  children: React.ReactNode;
  elevated?: boolean;
  style?: ViewStyle;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  elevated = false,
  style,
}) => {
  const { theme } = useLiquidGlassTheme();

  const webBlurStyle =
    Platform.OS === 'web'
      ? ({ backdropFilter: theme.backdropFilter, WebkitBackdropFilter: theme.backdropFilter } as any)
      : {};

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: elevated ? theme.glassElevated : theme.glassSurface,
          borderColor: theme.glassBorder,
          shadowColor: theme.shadowColor,
        },
        webBlurStyle,
        style,
      ]}
    >
      {/* Top specular highlight line for Liquid Glass depth */}
      <View
        pointerEvents="none"
        style={[styles.specularTop, { backgroundColor: theme.specularHighlight }]}
      />
      {children}
    </View>
  );
};

export interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  disabled = false,
  style,
}) => {
  const { theme } = useLiquidGlassTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.primaryButton,
        {
          backgroundColor: theme.primaryButtonBg,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.primaryButtonText, { color: theme.primaryButtonText }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * 100% Opaque "?" Help Sheet (design-system.md §2b, T33):
 * Uses solid #141418 (dark) or #FFFFFF (light) with full visual separation from background.
 */
export interface OpaqueHelpSheetProps {
  visible: boolean;
  title: string;
  body: string;
  onClose: () => void;
}

export const OpaqueHelpSheet: React.FC<OpaqueHelpSheetProps> = ({
  visible,
  title,
  body,
  onClose,
}) => {
  const { theme } = useLiquidGlassTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View
          style={[
            styles.opaqueSheet,
            {
              backgroundColor: theme.opaqueHelpSheetBg,
              borderColor: theme.opaqueHelpSheetBorder,
            },
          ]}
        >
          <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>{title}</Text>
          <Text style={[styles.sheetBody, { color: theme.textSecondary }]}>{body}</Text>
          <PrimaryButton label="Entendido" onPress={onClose} style={{ marginTop: 18 }} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 6,
  },
  specularTop: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: 'Montserrat',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  opaqueSheet: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
  },
  sheetTitle: {
    fontFamily: 'Montserrat',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  sheetBody: {
    fontFamily: 'Montserrat',
    fontSize: 14,
    lineHeight: 21,
  },
});
