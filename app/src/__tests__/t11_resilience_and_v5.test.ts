import {
  clearOddLogs,
  emitOddLog,
  flushOddOutbox,
  getOddLogs,
  getPendingOddOutboxCount,
  registerOddSink,
} from '../observability/oddLogger';
import { getFirebaseEnvConfig, initializeFirebase } from '../firebase/config';
import { themeTokensV5 } from '../theme/tokens';

describe('T11 - Resiliencia ODD, configuración de entorno y Design System v5', () => {
  beforeEach(() => {
    clearOddLogs();
    registerOddSink(null);
  });

  it('retiene eventos ODD en el outbox cuando el sink falla y los vacía al recuperarse', async () => {
    emitOddLog('wallet.recharge', { monto: 500 });
    emitOddLog('trip.requested', { tripId: 'trip_1' });

    expect(getOddLogs()).toHaveLength(2);
    expect(getPendingOddOutboxCount()).toBe(2);

    registerOddSink(async () => {
      throw new Error('Sin conexión');
    });
    const failed = await flushOddOutbox();
    expect(failed).toEqual({ flushed: 0, pending: 2 });

    const sent: string[] = [];
    registerOddSink(async (batch) => {
      sent.push(...batch.map((b) => b.event));
    });
    const recovered = await flushOddOutbox();
    expect(recovered).toEqual({ flushed: 2, pending: 0 });
    expect(sent).toEqual(['wallet.recharge', 'trip.requested']);
  });

  it('expone configuración de Firebase desde variables de entorno con fallback seguro', () => {
    const envCfg = getFirebaseEnvConfig();
    expect(envCfg.projectId).toBeTruthy();

    const fb = initializeFirebase({ useMocks: true });
    expect(fb.isMock).toBe(true);
    expect(fb.projectId).toBe(envCfg.projectId);
  });

  it('incluye los tokens del Borrador v5 (Hype Night gris + Liquid Glass + Montserrat)', () => {
    expect(themeTokensV5.dark.background).toBe('#0B0B0E');
    expect(themeTokensV5.dark.accent).toBe('#8E8E93');
    expect(themeTokensV5.light.accent).toBe('#6E6E73');
    expect(themeTokensV5.typography.fontFamily).toBe('Montserrat');
    expect(themeTokensV5.splashDurationMs).toBe(1800);
  });
});
