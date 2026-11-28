import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLiquidGlassTheme } from '../../theme/liquidGlass';
import { brandTokens } from '../../theme/tokens';
import { LiquidGlassCard, PrimaryButton } from '../components/LiquidGlassCard';

export interface AuthScreenProps {
  onRegister: (data: {
    display_name: string;
    email: string;
    phone: string;
    terms_accepted: boolean;
  }) => Promise<void>;
}

/**
 * Minimalist, responsive Auth / Registration Screen (spec §3, design-system.md §4 T42/T43):
 * - Single primary action, max-width centered Liquid Glass card (390x844 mobile -> desktop)
 * - Name, email, phone + mandatory terms checkbox; immediate activation (no email verification)
 */
export const AuthScreen: React.FC<AuthScreenProps> = ({ onRegister }) => {
  const { theme } = useLiquidGlassTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Completa tu nombre, correo y teléfono.');
      return;
    }
    if (!termsAccepted) {
      setError('Debes aceptar los términos y condiciones para continuar.');
      return;
    }
    try {
      setSubmitting(true);
      await onRegister({
        display_name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        terms_accepted: termsAccepted,
      });
    } catch (err: any) {
      setError(err?.message || 'No se pudo crear la cuenta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Wordmark */}
        <View style={styles.brandHeader}>
          <View style={[styles.suitcaseMark, { backgroundColor: theme.accent }]} />
          <View style={styles.wordmarkRow}>
            <Text style={[styles.wordmarkPrimary, { color: theme.textPrimary }]}>
              {brandTokens.wordmark.primary.text}
            </Text>
            <Text style={[styles.wordmarkSecondary, { color: theme.textSecondary }]}>
              {brandTokens.wordmark.secondary.text}
            </Text>
          </View>
        </View>

        <LiquidGlassCard elevated style={styles.authCard}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Crea tu cuenta</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Una sola cuenta para explorar Acapulco o publicar como Aliado.
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nombre completo"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              {
                color: theme.textPrimary,
                borderColor: theme.glassBorder,
                backgroundColor: theme.glassSurface,
              },
            ]}
          />

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Correo electrónico"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[
              styles.input,
              {
                color: theme.textPrimary,
                borderColor: theme.glassBorder,
                backgroundColor: theme.glassSurface,
              },
            ]}
          />

          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Teléfono (10 dígitos)"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
            style={[
              styles.input,
              {
                color: theme.textPrimary,
                borderColor: theme.glassBorder,
                backgroundColor: theme.glassSurface,
              },
            ]}
          />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setTermsAccepted((v) => !v)}
            style={styles.termsRow}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: termsAccepted ? theme.accent : theme.glassBorder,
                  backgroundColor: termsAccepted ? theme.accent : 'transparent',
                },
              ]}
            >
              {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.termsText, { color: theme.textSecondary }]}>
              Acepto los términos de servicio y política de privacidad de Hype Xperience.
            </Text>
          </TouchableOpacity>

          {error && <Text style={[styles.errorText, { color: theme.accent }]}>{error}</Text>}

          <PrimaryButton
            label={submitting ? 'Activando cuenta...' : 'Entrar a Hype Xperience'}
            onPress={handleSubmit}
            disabled={submitting}
          />
        </LiquidGlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  suitcaseMark: {
    width: 44,
    height: 54,
    borderRadius: 10,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  wordmarkPrimary: {
    fontFamily: 'Montserrat',
    fontSize: 24,
    fontWeight: '800',
  },
  wordmarkSecondary: {
    fontFamily: 'Montserrat',
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 3,
  },
  authCard: {
    width: '100%',
    maxWidth: 420,
    gap: 12,
  },
  title: {
    fontFamily: 'Montserrat',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: 'Montserrat',
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    fontFamily: 'Montserrat',
    fontSize: 14,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  termsText: {
    flex: 1,
    fontFamily: 'Montserrat',
    fontSize: 12,
    lineHeight: 17,
  },
  errorText: {
    fontFamily: 'Montserrat',
    fontSize: 12,
    fontWeight: '600',
  },
});
