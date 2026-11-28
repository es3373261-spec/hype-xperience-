import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLiquidGlassTheme } from '../../theme/liquidGlass';
import { UserAccount } from '../../types/user';
import { LiquidGlassCard, PrimaryButton } from '../components/LiquidGlassCard';

export interface AllyDashboardScreenProps {
  account: UserAccount;
}

const ALLY_TABS = ['Hoy', 'Calendario', 'Anuncios', 'Mensajes', 'Menú'] as const;

export const AllyDashboardScreen: React.FC<AllyDashboardScreenProps> = ({ account }) => {
  const { theme } = useLiquidGlassTheme();
  const [activeTab, setActiveTab] = useState<(typeof ALLY_TABS)[number]>('Hoy');

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={[styles.heading, { color: theme.textPrimary }]}>
        Panel de Aliado · {account.display_name}
      </Text>

      <View style={styles.tabRow}>
        {ALLY_TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabChip,
                {
                  backgroundColor: active ? theme.primaryButtonBg : theme.glassSurface,
                  borderColor: active ? theme.primaryButtonBg : theme.glassBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: active ? theme.primaryButtonText : theme.textPrimary },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <LiquidGlassCard elevated style={styles.card}>
        <Text style={[styles.badge, { color: theme.accent }]}>EDITOR TOTAL 24/7</Text>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
          {activeTab === 'Hoy'
            ? 'Reservas y sub-reservas de hoy'
            : `Gestión de ${activeTab}`}
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          Edita precios, menú con IVA, horarios y disponibilidad en cualquier momento. Un anuncio requiere al menos una fecha con precio para publicarse.
        </Text>
        <PrimaryButton label="Editar Perfil y Oferta" onPress={() => {}} style={{ marginTop: 10 }} />
      </LiquidGlassCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    gap: 14,
  },
  heading: {
    fontFamily: 'Montserrat',
    fontSize: 20,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tabChip: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tabText: {
    fontFamily: 'Montserrat',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    gap: 8,
  },
  badge: {
    fontFamily: 'Montserrat',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardTitle: {
    fontFamily: 'Montserrat',
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    fontFamily: 'Montserrat',
    fontSize: 13,
    lineHeight: 19,
  },
});
