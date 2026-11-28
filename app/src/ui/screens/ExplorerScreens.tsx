import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLiquidGlassTheme } from '../../theme/liquidGlass';
import { welcomeTokens } from '../../theme/tokens';
import { UserAccount } from '../../types/user';
import { MARISCOS_RULOS_MENU_ITEMS } from '../../catalog/CatalogManager';
import { LiquidGlassCard, OpaqueHelpSheet, PrimaryButton } from '../components/LiquidGlassCard';

export interface ExplorerViewProps {
  account: UserAccount;
  walletBalanceMxn: number;
  onRechargeWallet: (amountMxn: number) => void;
  onQuickBook: (title: string, amountMxn: number) => void;
  tickets: Array<{ id: string; title: string; amountMxn: number; qrCode: string; date: string }>;
}

/**
 * 1. FEED VIEW — Welcome banner ("Bienvenido a la Saga del Sol, <name>"),
 *    simplified Feed calendar (gold bookings, blue events, circular line arrows),
 *    and real confirmed pilot catalog (Mariscos Rulo's & One By Pro).
 */
export const FeedView: React.FC<ExplorerViewProps> = ({ account, onQuickBook }) => {
  const { theme } = useLiquidGlassTheme();
  const [calendarExpanded, setCalendarExpanded] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={[styles.welcomeTitle, { color: theme.textPrimary }]}>
        {welcomeTokens.greetingPrefix}, {account.display_name}
      </Text>

      {/* Simplified Feed Calendar (no Mes/Semana text buttons, circular arrow buttons) */}
      <LiquidGlassCard style={styles.sectionCard}>
        <View style={styles.rowBetween}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            {calendarExpanded ? 'Diciembre 2026' : 'Esta semana · Dic'}
          </Text>
          <View style={styles.arrowRow}>
            <TouchableOpacity
              style={[styles.circleArrow, { borderColor: theme.glassBorder }]}
              onPress={() => {}}
            >
              <Text style={{ color: theme.textPrimary }}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.circleArrow, { borderColor: theme.glassBorder }]}
              onPress={() => {}}
            >
              <Text style={{ color: theme.textPrimary }}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.circleArrow, { borderColor: theme.glassBorder }]}
              onPress={() => setCalendarExpanded((v) => !v)}
            >
              <Text style={{ color: theme.textPrimary }}>{calendarExpanded ? '↑' : '↓'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: theme.calendarBookingColor }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Tus reservas</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: theme.calendarEventColor }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Eventos próximos</Text>
          </View>
        </View>
      </LiquidGlassCard>

      {/* Pilot Provider 1: Mariscos Rulo's (verified coords & real menu) */}
      <LiquidGlassCard style={styles.sectionCard}>
        <Text style={[styles.badge, { color: theme.accent }]}>VENUE · PILOTO CONFIRMADO</Text>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Mariscos Rulo&apos;s</Text>
        <Text style={[styles.pinText, { color: theme.textSecondary }]}>
          ⌖ Playa, acceso CICI, Acapulco (16.84911, -99.85405)
        </Text>
        <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
          {MARISCOS_RULOS_MENU_ITEMS.length} platillos y bebidas reales con IVA incluido. Alergias obligatorias al reservar.
        </Text>
        <PrimaryButton
          label="Reservar mesa · Desde $250 MXN"
          onPress={() => onQuickBook("Mariscos Rulo's — Ceviche de pez vela", 250)}
          style={{ marginTop: 12 }}
        />
      </LiquidGlassCard>

      {/* Pilot Provider 2: One By Pro ($350 cover) */}
      <LiquidGlassCard style={styles.sectionCard}>
        <Text style={[styles.badge, { color: theme.accent }]}>XPERIENCE · PILOTO CONFIRMADO</Text>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>One By Pro</Text>
        <Text style={[styles.pinText, { color: theme.textSecondary }]}>
          ⌖ Zona Dorada, Acapulco (ubicación aproximada)
        </Text>
        <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
          Productora de eventos oficiales Hype Xperience. Acceso rápido con Hype Ticket QR.
        </Text>
        <PrimaryButton
          label="Reservar acceso · $350 MXN"
          onPress={() => onQuickBook('One By Pro — Cover General', 350)}
          style={{ marginTop: 12 }}
        />
      </LiquidGlassCard>
    </ScrollView>
  );
};

/**
 * 2. EXPLORAR VIEW — Unified Map + Calendar (spec §2, T37)
 */
export const ExplorarView: React.FC = () => {
  const { theme } = useLiquidGlassTheme();
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={[styles.screenHeading, { color: theme.textPrimary }]}>
        Explorar · Mapa y Calendario
      </Text>
      <LiquidGlassCard style={styles.sectionCard}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
          Mapa interactivo de Acapulco
        </Text>
        <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
          Solo se muestran categorías con Aliados activos verificados.
        </Text>
        <View style={[styles.mapPlaceholder, { borderColor: theme.glassBorder }]}>
          <Text style={[styles.pinText, { color: theme.textPrimary }]}>
            ⌖ Mariscos Rulo&apos;s — 16.84911, -99.85405 (Verificado)
          </Text>
          <Text style={[styles.pinText, { color: theme.textSecondary }]}>
            ⌖ One By Pro — Av. Costera Miguel Alemán (Aproximado)
          </Text>
        </View>
      </LiquidGlassCard>
    </ScrollView>
  );
};

/**
 * 3. TICKETS VIEW — Hype Tickets QR + Digital Thermal Receipt
 */
export const TicketsView: React.FC<Pick<ExplorerViewProps, 'tickets'>> = ({ tickets }) => {
  const { theme } = useLiquidGlassTheme();
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={[styles.screenHeading, { color: theme.textPrimary }]}>Hype Tickets & Recibos</Text>
      {tickets.length === 0 ? (
        <LiquidGlassCard style={styles.sectionCard}>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            Aún no tienes reservas activas. Reserva desde Feed o pide a Aura que arme tu Xperience.
          </Text>
        </LiquidGlassCard>
      ) : (
        tickets.map((t) => (
          <LiquidGlassCard key={t.id} style={styles.sectionCard}>
            <Text style={[styles.badge, { color: theme.accent }]}>TICKET QR ACTIVO</Text>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{t.title}</Text>
            <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
              Código QR: {t.qrCode} · ${t.amountMxn} MXN · {t.date}
            </Text>
            <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>
              Recibo digital disponible · No es un comprobante fiscal
            </Text>
          </LiquidGlassCard>
        ))
      )}
    </ScrollView>
  );
};

/**
 * 4. TAXI VIEW — Formula pricing with $100 MXN floor (§15.1) & exact tier labels (§15.5)
 */
export const TaxiView: React.FC<{ account: UserAccount }> = ({ account }) => {
  const { theme } = useLiquidGlassTheme();
  const [selectedTier, setSelectedTier] = useState<'Hype Go' | 'Hype Confort' | 'Hype by Pro'>(
    'Hype Go'
  );
  const [helpOpen, setHelpOpen] = useState(false);

  const estimatedMxn =
    selectedTier === 'Hype Go' ? 100 : selectedTier === 'Hype Confort' ? 125 : 150;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.rowBetween}>
        <Text style={[styles.screenHeading, { color: theme.textPrimary }]}>Hype Taxi</Text>
        <TouchableOpacity
          onPress={() => setHelpOpen(true)}
          style={[styles.helpBtn, { borderColor: theme.glassBorder }]}
        >
          <Text style={[styles.helpBtnText, { color: theme.textPrimary }]}>?</Text>
        </TouchableOpacity>
      </View>

      <LiquidGlassCard style={styles.sectionCard}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
          Tarifa transparente por fórmula
        </Text>
        <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
          Mínimo $100 MXN · Pago prepago con Wallet Hype · Seguimiento por WhatsApp y chat privado.
        </Text>

        <View style={styles.tierRow}>
          {(['Hype Go', 'Hype Confort', 'Hype by Pro'] as const).map((tier) => {
            const locked = tier === 'Hype by Pro' && !account.concierge_access && !account.is_vip;
            const active = selectedTier === tier;
            return (
              <TouchableOpacity
                key={tier}
                disabled={locked}
                onPress={() => setSelectedTier(tier)}
                style={[
                  styles.tierChip,
                  {
                    backgroundColor: active ? theme.primaryButtonBg : theme.glassSurface,
                    borderColor: active ? theme.primaryButtonBg : theme.glassBorder,
                    opacity: locked ? 0.45 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tierText,
                    { color: active ? theme.primaryButtonText : theme.textPrimary },
                  ]}
                >
                  {tier}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.priceBig, { color: theme.textPrimary }]}>
          Desde ${estimatedMxn} MXN ({selectedTier})
        </Text>
        <PrimaryButton label={`Solicitar ${selectedTier}`} onPress={() => {}} />
      </LiquidGlassCard>

      <OpaqueHelpSheet
        visible={helpOpen}
        title="¿Cómo funciona Hype Taxi?"
        body="La tarifa se calcula con base en distancia y tiempo (mínimo $100 MXN en Hype Go, redondeado a $5). Tu viaje se paga desde Wallet para garantizar seguridad al pasajero y al conductor."
        onClose={() => setHelpOpen(false)}
      />
    </ScrollView>
  );
};

/**
 * 5. WALLET VIEW — Closed-loop MXN credits + T-13 Fase 1 Auto-Recharge Cap
 */
export const WalletView: React.FC<Pick<ExplorerViewProps, 'walletBalanceMxn' | 'onRechargeWallet'>> =
  ({ walletBalanceMxn, onRechargeWallet }) => {
    const { theme } = useLiquidGlassTheme();
    const [autoRecharge, setAutoRecharge] = useState(false);

    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.screenHeading, { color: theme.textPrimary }]}>Wallet Hype</Text>
        <LiquidGlassCard elevated style={styles.sectionCard}>
          <Text style={[styles.badge, { color: theme.accent }]}>CIRCUITO CERRADO · 1 CRÉDITO = $1 MXN</Text>
          <Text style={[styles.balanceAmount, { color: theme.textPrimary }]}>
            ${walletBalanceMxn.toFixed(2)} MXN
          </Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            Recarga rápida vía Stripe Sandbox:
          </Text>
          <View style={styles.chipsRow}>
            {[200, 500, 1000, 2000].map((amt) => (
              <TouchableOpacity
                key={amt}
                onPress={() => onRechargeWallet(amt)}
                style={[styles.rechargeChip, { borderColor: theme.glassBorder }]}
              >
                <Text style={[styles.rechargeChipText, { color: theme.textPrimary }]}>
                  +${amt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </LiquidGlassCard>

        {/* T-13 Fase 1: Wallet siempre cargado */}
        <LiquidGlassCard style={styles.sectionCard}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            Wallet siempre cargado (Fase 1)
          </Text>
          <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
            Recarga automática con mínimo de $300 MXN y tope mensual controlado por ti.
          </Text>
          <PrimaryButton
            label={autoRecharge ? 'Recarga automática: ACTIVA' : 'Activar recarga automática'}
            onPress={() => setAutoRecharge((v) => !v)}
            style={{ marginTop: 10 }}
          />
        </LiquidGlassCard>
      </ScrollView>
    );
  };

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    gap: 14,
  },
  welcomeTitle: {
    fontFamily: 'Montserrat',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  screenHeading: {
    fontFamily: 'Montserrat',
    fontSize: 20,
    fontWeight: '700',
  },
  sectionCard: {
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  arrowRow: {
    flexDirection: 'row',
    gap: 8,
  },
  circleArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: 'Montserrat',
    fontSize: 12,
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
  pinText: {
    fontFamily: 'Montserrat',
    fontSize: 12,
    fontWeight: '500',
  },
  bodyText: {
    fontFamily: 'Montserrat',
    fontSize: 13,
    lineHeight: 19,
  },
  mapPlaceholder: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  disclaimer: {
    fontFamily: 'Montserrat',
    fontSize: 11,
    marginTop: 4,
  },
  helpBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBtnText: {
    fontFamily: 'Montserrat',
    fontSize: 14,
    fontWeight: '700',
  },
  tierRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  tierChip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tierText: {
    fontFamily: 'Montserrat',
    fontSize: 11,
    fontWeight: '700',
  },
  priceBig: {
    fontFamily: 'Montserrat',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  balanceAmount: {
    fontFamily: 'Montserrat',
    fontSize: 30,
    fontWeight: '800',
    marginVertical: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  rechargeChip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rechargeChipText: {
    fontFamily: 'Montserrat',
    fontSize: 12,
    fontWeight: '700',
  },
});
