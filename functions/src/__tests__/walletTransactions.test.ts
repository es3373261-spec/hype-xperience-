import { calculateCommissionSplit } from '../walletTransactions';

describe('@hype/functions walletTransactions', () => {
  it('calculates 10% standard split accurately', () => {
    const split = calculateCommissionSplit(350, 'direct_standard');
    expect(split).toEqual({
      grossMXN: 350,
      platformFeeMXN: 35,
      providerNetMXN: 315,
      rateApplied: 0.1,
    });
  });

  it('calculates 5% intro split and 15% concierge split accurately', () => {
    expect(calculateCommissionSplit(1000, 'direct_intro').platformFeeMXN).toBe(50);
    expect(calculateCommissionSplit(1000, 'concierge_package')).toEqual({
      grossMXN: 1000,
      platformFeeMXN: 150,
      providerNetMXN: 850,
      rateApplied: 0.15,
    });
  });

  it('rejects non-positive amounts', () => {
    expect(() => calculateCommissionSplit(0)).toThrow();
    expect(() => calculateCommissionSplit(-100)).toThrow();
  });
});
