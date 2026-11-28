import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLiquidGlassTheme } from '../../theme/liquidGlass';
import { auraBarTokens, navigationTokens } from '../../theme/tokens';

export type ExplorerTab = (typeof navigationTokens.tabs)[number];

export interface BottomStackBarProps {
  activeTab: ExplorerTab;
  onSelectTab: (tab: ExplorerTab) => void;
  onSendAuraPrompt: (prompt: string) => void;
}

/**
 * Fixed Bottom Stack (spec.md §2, §4, T38):
 * 1. Top row: 5 independent floating nav buttons (Feed, Explorar, Tickets, Taxi, Wallet)
 * 2. Directly below: Aura pill bar (borderRadius: 999) with fluid orb, placeholder, circular send button
 */
export const BottomStackBar: React.FC<BottomStackBarProps> = ({
  activeTab,
  onSelectTab,
  onSendAuraPrompt,
}) => {
  const { theme } = useLiquidGlassTheme();
  const [prompt, setPrompt] = useState('');

  const webBlur =
    Platform.OS === 'web'
      ? ({ backdropFilter: theme.backdropFilter, WebkitBackdropFilter: theme.backdropFilter } as any)
      : {};

  const handleSend = () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    onSendAuraPrompt(trimmed);
    setPrompt('');
  };

  return (
    <View style={styles.stackWrapper}>
      {/* Row 1: 5 Independent Floating Navigation Buttons */}
      <View style={styles.navRow}>
        {navigationTokens.tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.85}
              onPress={() => onSelectTab(tab)}
              style={[
                styles.navButton,
                {
                  backgroundColor: isActive ? theme.primaryButtonBg : theme.pillBarBg,
                  borderColor: isActive ? theme.primaryButtonBg : theme.pillBarBorder,
                },
                webBlur,
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.navLabel,
                  { color: isActive ? theme.primaryButtonText : theme.textPrimary },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Row 2 (directly below nav): Aura Pill Bar */}
      <View
        style={[
          styles.auraPill,
          {
            backgroundColor: theme.pillBarBg,
            borderColor: theme.pillBarBorder,
          },
          webBlur,
        ]}
      >
        <View style={[styles.auraOrb, { backgroundColor: theme.orbColor }]} />
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder={auraBarTokens.placeholder}
          placeholderTextColor={theme.textSecondary}
          onSubmitEditing={handleSend}
          style={[styles.auraInput, { color: theme.textPrimary }]}
        />
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSend}
          accessibilityLabel="Enviar a Aura"
          style={[styles.sendButton, { backgroundColor: theme.primaryButtonBg }]}
        >
          <Text style={[styles.sendArrow, { color: theme.primaryButtonText }]}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stackWrapper: {
    paddingHorizontal: 12,
    paddingBottom: 14,
    paddingTop: 8,
    gap: 8,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  navButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontFamily: 'Montserrat',
    fontSize: 11,
    fontWeight: '600',
  },
  auraPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: auraBarTokens.borderRadius,
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 10,
  },
  auraOrb: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  auraInput: {
    flex: 1,
    fontFamily: 'Montserrat',
    fontSize: 13,
    paddingVertical: 4,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendArrow: {
    fontFamily: 'Montserrat',
    fontSize: 16,
    fontWeight: '700',
  },
});
