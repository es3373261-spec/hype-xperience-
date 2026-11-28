/**
 * Financial & Pricing Engine — Hype Xperience Backend (spec.md §7, §15)
 * Confirmed decisions (2026-11-26):
 * - Taxi minimum fare floor: $100 MXN (§15.1)
 * - Trip type label: always the requested tier (Hype Go / Hype Confort / Hype by Pro), never 'colectivo' (§15.5)
 * - Driver commission pool: exact 2-decimal cents (§15.6)
 * - Concierge 15% package commission: rounded individually per service, added to final client price with clear per-service breakdown (§15.3, §15.4)
 */

export type TransportTier = 'hype_go' | 'hype_confort' | 'hype_pro';

export const MIN_TAXI_FARE_MXN = 100;
export const BASE_TAXI_FARE_MXN = 35;
export const RATE_PER_KM_MXN = 12;
export const RATE_PER_MIN_MXN = 2;

export const TIER_MULTIPLIERS: Record<TransportTier, number> = {
  hype_go: 1.0,
  hype_confort: 1.25,
  hype_pro: 1.5,
};

export const TIER_DISPLAY_LABELS: Record<TransportTier, string> = {
  hype_go: 'Hype Go',
  hype_confort: 'Hype Confort',
  hype_pro: 'Hype by Pro',
};

export interface TaxiFareRequest {
  distanceKm: number;
  durationMin: number;
  tier: TransportTier;
  hasConciergeOrVip?: boolean;
}

export interface TaxiFareQuote {
  tier: TransportTier;
  tripTypeLabel: string;
  baseFormulaMxn: number;
  flooredBaseMxn: number;
  multiplier: number;
  finalFareMxn: number;
}

export function roundToNearest5(amount: number): number {
  return Math.round(amount / 5) * 5;
}

export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function calculateTaxiFare(req: TaxiFareRequest): TaxiFareQuote {
  if (req.distanceKm < 0 || req.durationMin < 0) {
    throw new Error('Distancia y duración deben ser mayores o iguales a 0');
  }

  if (req.tier === 'hype_pro' && !req.hasConciergeOrVip) {
    throw new Error('Hype by Pro está reservado exclusivamente para Concierge o usuarios VIP');
  }

  const baseFormulaMxn =
    BASE_TAXI_FARE_MXN + req.distanceKm * RATE_PER_KM_MXN + req.durationMin * RATE_PER_MIN_MXN;
  const flooredBaseMxn = Math.max(MIN_TAXI_FARE_MXN, baseFormulaMxn);
  const multiplier = TIER_MULTIPLIERS[req.tier];
  const finalFareMxn = roundToNearest5(flooredBaseMxn * multiplier);

  return {
    tier: req.tier,
    tripTypeLabel: TIER_DISPLAY_LABELS[req.tier],
    baseFormulaMxn: roundToCents(baseFormulaMxn),
    flooredBaseMxn: roundToCents(flooredBaseMxn),
    multiplier,
    finalFareMxn,
  };
}

/**
 * Driver commission pool deduction — exact 2-decimal cents (§15.6).
 * Example: $210 cash trip at 5% = $10.50 -> pool $250.00 -> $239.50.
 */
export function calculateDriverPoolDeduction(
  currentPoolMxn: number,
  tripFareMxn: number,
  commissionRate: number
): {
  deductionMxn: number;
  newPoolBalanceMxn: number;
  requiresPause: boolean;
} {
  const deductionMxn = roundToCents(tripFareMxn * commissionRate);
  const newPoolBalanceMxn = roundToCents(currentPoolMxn - deductionMxn);
  return {
    deductionMxn,
    newPoolBalanceMxn,
    requiresPause: newPoolBalanceMxn < -30,
  };
}

export interface ConciergeServiceInput {
  allyId: string;
  serviceName: string;
  basePriceMxn: number;
  allyDirectCommissionRate?: number; // e.g. 0.05 (promo <30d) or 0.10 (>=30d)
}

export interface ConciergeServiceLineItem {
  allyId: string;
  serviceName: string;
  basePriceMxn: number;
  conciergeCommission15Mxn: number; // rounded individually per service (§15.4)
  clientLineTotalMxn: number;
  allyCommissionDiscountMxn: number;
  allyNetPayoutMxn: number;
}

export interface ConciergePackageBreakdown {
  items: ConciergeServiceLineItem[];
  subtotalServicesMxn: number;
  totalConciergeCommissionMxn: number;
  totalClientPriceMxn: number;
  totalAllyPayoutsMxn: number;
}

/**
 * Concierge package breakdown (§15.3 & §15.4):
 * - Rounds the 15% service commission per individual service.
 * - Adds the service commission to the final client price with an explicit per-service breakdown.
 * - Computes each ally's net payout after applicable commission discount.
 */
export function calculateConciergePackageBreakdown(
  services: ConciergeServiceInput[]
): ConciergePackageBreakdown {
  const items: ConciergeServiceLineItem[] = services.map((s) => {
    const basePriceMxn = roundToCents(s.basePriceMxn);
    const conciergeCommission15Mxn = Math.round(basePriceMxn * 0.15);
    const clientLineTotalMxn = roundToCents(basePriceMxn + conciergeCommission15Mxn);
    const directRate = s.allyDirectCommissionRate ?? 0;
    const allyCommissionDiscountMxn = roundToCents(basePriceMxn * directRate);
    const allyNetPayoutMxn = roundToCents(basePriceMxn - allyCommissionDiscountMxn);

    return {
      allyId: s.allyId,
      serviceName: s.serviceName,
      basePriceMxn,
      conciergeCommission15Mxn,
      clientLineTotalMxn,
      allyCommissionDiscountMxn,
      allyNetPayoutMxn,
    };
  });

  const subtotalServicesMxn = roundToCents(
    items.reduce((sum, i) => sum + i.basePriceMxn, 0)
  );
  const totalConciergeCommissionMxn = roundToCents(
    items.reduce((sum, i) => sum + i.conciergeCommission15Mxn, 0)
  );
  const totalClientPriceMxn = roundToCents(
    items.reduce((sum, i) => sum + i.clientLineTotalMxn, 0)
  );
  const totalAllyPayoutsMxn = roundToCents(
    items.reduce((sum, i) => sum + i.allyNetPayoutMxn, 0)
  );

  return {
    items,
    subtotalServicesMxn,
    totalConciergeCommissionMxn,
    totalClientPriceMxn,
    totalAllyPayoutsMxn,
  };
}
