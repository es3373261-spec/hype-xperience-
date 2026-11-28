import React, { useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthService } from '../auth/AuthService';
import { initializeFirebase } from '../firebase/config';
import {
  LiquidGlassThemeProvider,
  useLiquidGlassTheme,
} from '../theme/liquidGlass';
import { brandTokens } from '../theme/tokens';
import { UserAccount } from '../types/user';
import { BottomStackBar, ExplorerTab } from './components/BottomStackBar';
import { OpaqueHelpSheet } from './components/LiquidGlassCard';
import { ProfileFloatingCard } from './components/ProfileFloatingCard';
import { SuitcaseSplash } from './components/SuitcaseSplash';
import { AllyDashboardScreen } from './screens/AllyDashboardScreen';
import { AuthScreen } from './screens/AuthScreen';
import {
  ExplorarView,
  FeedView,
  TaxiView,
  TicketsView,
  WalletView,
} from './screens/ExplorerScreens';

const HypeAppInner: React.FC = () => {
  const { theme } = useLiquidGlassTheme();
  const authService = useMemo(() => {
    initializeFirebase({ mode: 'mock' });
    return new AuthService();
  }, []);

  const [splashVariant, setSplashVariant] = useState<'first_load' | 'mode_switch' | null>(
    'first_load'
  );
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<ExplorerTab>('Feed');
  const [profileOpen, setProfileOpen] = useState(false);
  const [walletBalanceMxn, setWalletBalanceMxn] = useState(1000);
  const [tickets, setTickets] = useState<
    Array<{ id: string; title: string; amountMxn: number; qrCode: string; date: string }>
  >([]);
  const [auraReply, setAuraReply] = useState<{ title: string; body: string } | null>(null);

  if (splashVariant) {
    return (
      <SuitcaseSplash
        variant={splashVariant}
        onFinish={() => setSplashVariant(null)}
      />
    );
  }

  if (!account) {
    return (
      <AuthScreen
        onRegister={async (data) => {
          const res = await authService.registerMinimalAccount(data);
          setAccount(res.user);
        }}
      />
    );
  }

  const handleToggleMode = async (targetMode: 'viajero' | 'aliado') => {
    setSplashVariant('mode_switch');
    const res = await authService.switchMode(account.uid, targetMode);
    setAccount(res.user);
  };

  const handleQuickBook = (title: string, amountMxn: number) => {
    if (walletBalanceMxn < amountMxn) {
      setAuraReply({
        title: 'Saldo insuficiente',
        body: 'Agrega saldo en tu Wallet Hype para confirmar tu reserva.',
      });
      return;
    }
    setWalletBalanceMxn((b) => Number((b - amountMxn).toFixed(2)));
    setTickets((prev) => [
      {
        id: `tkt_${Date.now()}`,
        title,
        amountMxn,
        qrCode: `HYPE-QR-${Math.floor(100000 + Math.random() * 900000)}`,
        date: '2026-12-20',
      },
      ...prev,
    ]);
    setActiveTab('Tickets');
  };

  const handleRechargeWallet = async (amt: number) => {
    setWalletBalanceMxn((b) => Number((b + amt).toFixed(2)));
    try {
      const envCfg = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
      if (envCfg) {
        const fb = initializeFirebase({ mode: 'sdk', useLiveSdkClient: true });
        if (fb.functions) {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { httpsCallable } = require('firebase/functions');
          const createIntent = httpsCallable(fb.functions, 'createWalletRechargeIntent');
          const res: any = await createIntent({ amountMxn: amt });
          if (res?.data?.paymentIntentId) {
            setAuraReply({
              title: 'Stripe PaymentIntent Creado',
              body: `Recarga de $${amt} MXN procesada (${res.data.paymentIntentId}). Tu saldo de circuito cerrado se actualizó.`,
            });
          }
        }
      }
    } catch {
      // Fallback local demo mode if unauthenticated in Firebase Auth
    }
  };

  const handleAuraPrompt = async (prompt: string) => {
    setAuraReply({
      title: 'Aura · Consultando catálogo activo...',
      body: `Analizando "${prompt}" con Gemini 2.5 Flash...`,
    });
    try {
      const envCfg = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
      if (envCfg) {
        const fb = initializeFirebase({ mode: 'sdk', useLiveSdkClient: true });
        if (fb.functions) {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { httpsCallable } = require('firebase/functions');
          const callAura = httpsCallable(fb.functions, 'chatWithAura');
          const res: any = await callAura({ message: prompt });
          if (res?.data?.mensaje_al_usuario) {
            const fin = res.data.resumen_financiero;
            const breakdownText = fin
              ? `\n\nSubtotal aliados: $${fin.subtotal_aliados} MXN\nGestión Concierge (15%): $${fin.comision_concierge_15_pct} MXN\nTotal: $${fin.total_cliente_mxn} MXN (sujeto a verificación del Concierge)`
              : '';
            setAuraReply({
              title:
                res.data.estado_cotizacion === 'borrador_listo'
                  ? 'Aura · Borrador enviado a Concierge'
                  : 'Aura · Concierge IA',
              body: `${res.data.mensaje_al_usuario}${breakdownText}`,
            });
            return;
          }
        }
      }
    } catch {
      // Fallback to deterministic pilot reply when running without live Firebase Auth token
    }

    setAuraReply({
      title: 'Aura · Borrador en preparación',
      body: `Recibí tu solicitud: "${prompt}". Para enviarte un borrador real con el catálogo activo (Mariscos Rulo's $250 MXN, One By Pro $350 MXN y Hype Taxi desde $100 MXN + 15% Gestión Concierge), confírmame: 1) Fechas, 2) Número de personas y 3) Alergias alimentarias.`,
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Top Bar: Wordmark + Top-Right Profile Avatar */}
      <View style={[styles.topBar, { borderBottomColor: theme.glassBorder }]}>
        <View style={styles.brandRow}>
          <Text style={[styles.wordmarkPrimary, { color: theme.textPrimary }]}>
            {brandTokens.wordmark.primary.text}
          </Text>
          <Text style={[styles.wordmarkSecondary, { color: theme.textSecondary }]}>
            {brandTokens.wordmark.secondary.text}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setProfileOpen(true)}
          style={[
            styles.profileTrigger,
            { backgroundColor: theme.glassSurface, borderColor: theme.glassBorder },
          ]}
        >
          <View style={[styles.avatarCircle, { backgroundColor: theme.accent }]}>
            <Text style={styles.avatarInitial}>
              {account.display_name.slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.modePillText, { color: theme.textPrimary }]}>
            {account.mode === 'aliado' ? 'Aliado' : 'Explorador'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {account.mode === 'aliado' ? (
          <AllyDashboardScreen account={account} />
        ) : activeTab === 'Feed' ? (
          <FeedView
            account={account}
            walletBalanceMxn={walletBalanceMxn}
            onRechargeWallet={handleRechargeWallet}
            onQuickBook={handleQuickBook}
            tickets={tickets}
          />
        ) : activeTab === 'Explorar' ? (
          <ExplorarView />
        ) : activeTab === 'Tickets' ? (
          <TicketsView tickets={tickets} />
        ) : activeTab === 'Taxi' ? (
          <TaxiView account={account} />
        ) : (
          <WalletView
            walletBalanceMxn={walletBalanceMxn}
            onRechargeWallet={handleRechargeWallet}
          />
        )}
      </View>

      {/* Fixed Bottom Stack: Nav Bar ABOVE Aura Pill Bar (Explorer mode) */}
      {account.mode === 'viajero' && (
        <BottomStackBar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onSendAuraPrompt={handleAuraPrompt}
        />
      )}

      <ProfileFloatingCard
        visible={profileOpen}
        account={account}
        onClose={() => setProfileOpen(false)}
        onToggleMode={handleToggleMode}
        onLogout={() => {
          setProfileOpen(false);
          setAccount(null);
        }}
      />

      <OpaqueHelpSheet
        visible={Boolean(auraReply)}
        title={auraReply?.title || ''}
        body={auraReply?.body || ''}
        onClose={() => setAuraReply(null)}
      />
    </SafeAreaView>
  );
};

export const HypeApp: React.FC = () => (
  <LiquidGlassThemeProvider initialMode="dark">
    <HypeAppInner />
  </LiquidGlassThemeProvider>
);

export default HypeApp;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  wordmarkPrimary: {
    fontFamily: 'Montserrat',
    fontSize: 18,
    fontWeight: '800',
  },
  wordmarkSecondary: {
    fontFamily: 'Montserrat',
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 2.2,
  },
  profileTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: 10,
    gap: 8,
  },
  avatarCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'Montserrat',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modePillText: {
    fontFamily: 'Montserrat',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});
