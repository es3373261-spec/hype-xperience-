import {
  calculateTaxiFare,
  calculateDriverPoolDeduction,
  calculateConciergePackageBreakdown,
  MIN_TAXI_FARE_MXN,
} from '../pricing';
import {
  AURA_RESPONSE_SCHEMA,
  buildAuraSystemInstruction,
  validateAuraDraftAgainstCatalog,
} from '../auraLogic';

describe('Backend Functions — Confirmed Decisions (§15) & Aura Guardrail (§10)', () => {
  describe('Taxi Fare Formula (§15.1 $100 floor & §15.5 Tier Label)', () => {
    it('enforces exact $100 MXN minimum floor for short Hype Go trips and displays requested tier label', () => {
      expect(MIN_TAXI_FARE_MXN).toBe(100);
      const quote = calculateTaxiFare({
        distanceKm: 1,
        durationMin: 5,
        tier: 'hype_go',
      });
      // Base: 35 + 12 + 10 = 57 -> floored to $100 -> * 1.0 = $100
      expect(quote.flooredBaseMxn).toBe(100);
      expect(quote.finalFareMxn).toBe(100);
      expect(quote.tripTypeLabel).toBe('Hype Go');
    });

    it('calculates Costera Go and Colosio Confort with nearest-$5 rounding', () => {
      const goQuote = calculateTaxiFare({
        distanceKm: 6.5,
        durationMin: 14,
        tier: 'hype_go',
      });
      // 35 + 78 + 28 = 141 -> nearest 5 = 140
      expect(goQuote.finalFareMxn).toBe(140);
      expect(goQuote.tripTypeLabel).toBe('Hype Go');

      const confortQuote = calculateTaxiFare({
        distanceKm: 10,
        durationMin: 12,
        tier: 'hype_confort',
      });
      // 35 + 120 + 24 = 179 -> * 1.25 = 223.75 -> nearest 5 = 225
      expect(confortQuote.finalFareMxn).toBe(225);
      expect(confortQuote.tripTypeLabel).toBe('Hype Confort');
    });

    it('blocks Hype by Pro without Concierge/VIP permission and allows it with permission', () => {
      expect(() =>
        calculateTaxiFare({ distanceKm: 5, durationMin: 10, tier: 'hype_pro' })
      ).toThrow(/VIP|Concierge/i);

      const vipQuote = calculateTaxiFare({
        distanceKm: 5,
        durationMin: 10,
        tier: 'hype_pro',
        hasConciergeOrVip: true,
      });
      expect(vipQuote.tripTypeLabel).toBe('Hype by Pro');
      expect(vipQuote.finalFareMxn).toBe(175); // (35+60+20)=115 * 1.5 = 172.5 -> 175
    });
  });

  describe('Driver Commission Pool (§15.6 Exact 2-Decimal Cents)', () => {
    it('deducts exact 2-decimal cents ($210 at 5% = $10.50 -> $250.00 -> $239.50)', () => {
      const res = calculateDriverPoolDeduction(250, 210, 0.05);
      expect(res.deductionMxn).toBe(10.5);
      expect(res.newPoolBalanceMxn).toBe(239.5);
      expect(res.requiresPause).toBe(false);
    });

    it('flags requiresPause when pool falls below -$30.00', () => {
      const res = calculateDriverPoolDeduction(-25, 200, 0.05);
      expect(res.deductionMxn).toBe(10);
      expect(res.newPoolBalanceMxn).toBe(-35);
      expect(res.requiresPause).toBe(true);
    });
  });

  describe('Concierge Package Breakdown (§15.3 & §15.4 Individual Per-Service Rounding)', () => {
    it('rounds 15% commission per individual service and provides clear per-service breakdown', () => {
      // Verification example from spec §15.4: $4,350 + $2,086 + $500 = $6,936
      // Individual 15%: round(652.5)=653, round(312.9)=313, round(75)=75 -> total commission = $1,041
      const breakdown = calculateConciergePackageBreakdown([
        { allyId: 'ally_lucia', serviceName: 'Yate Bahía', basePriceMxn: 4350, allyDirectCommissionRate: 0.1 },
        { allyId: 'ally_diego', serviceName: 'Foto Sesión', basePriceMxn: 2086, allyDirectCommissionRate: 0.05 },
        { allyId: 'ally_rulos', serviceName: "Mariscos Rulo's", basePriceMxn: 500, allyDirectCommissionRate: 0.1 },
      ]);

      expect(breakdown.items[0].conciergeCommission15Mxn).toBe(653);
      expect(breakdown.items[1].conciergeCommission15Mxn).toBe(313);
      expect(breakdown.items[2].conciergeCommission15Mxn).toBe(75);
      expect(breakdown.subtotalServicesMxn).toBe(6936);
      expect(breakdown.totalConciergeCommissionMxn).toBe(1041);
      expect(breakdown.totalClientPriceMxn).toBe(7977);
      expect(breakdown.items[2].allyCommissionDiscountMxn).toBe(50);
      expect(breakdown.items[2].allyNetPayoutMxn).toBe(450);
    });
  });

  describe('Aura Structured Output & Anti-Hallucination Guardrail (§10)', () => {
    it('embeds active catalog in system instruction and rejects hallucinated ally_ids', () => {
      const activeCatalog = [
        {
          ally_id: 'ally_rulos',
          business_name: "Mariscos Rulo's",
          vertical: 'venue',
          subcategory: 'restaurante',
          price_mxn: 250,
          location: 'Playa, acceso CICI, Acapulco',
        },
      ];

      const instruction = buildAuraSystemInstruction(activeCatalog);
      expect(instruction).toContain('CERO ALUCINACIONES');
      expect(instruction).toContain("Mariscos Rulo's");
      expect(AURA_RESPONSE_SCHEMA.required).toEqual([
        'mensaje_conversacional',
        'estado_cotizacion',
      ]);

      const validCheck = validateAuraDraftAgainstCatalog(
        {
          mensaje_conversacional: 'Te armé tu plan.',
          estado_cotizacion: 'borrador_listo',
          itinerario_propuesto: [
            {
              dia: 1,
              vertical: 'venue',
              ally_id: 'ally_rulos',
              servicio_nombre: 'Ceviche en playa',
              precio_neto_aliado: 250,
            },
          ],
        },
        activeCatalog
      );
      expect(validCheck.valid).toBe(true);

      const hallucinatedCheck = validateAuraDraftAgainstCatalog(
        {
          mensaje_conversacional: 'Yate inventado.',
          estado_cotizacion: 'borrador_listo',
          itinerario_propuesto: [
            {
              dia: 1,
              vertical: 'tour',
              ally_id: 'ally_inventado',
              servicio_nombre: 'Yate Fantasma',
              precio_neto_aliado: 9000,
            },
          ],
        },
        activeCatalog
      );
      expect(hallucinatedCheck.valid).toBe(false);
      expect(hallucinatedCheck.invalidAllyIds).toEqual(['ally_inventado']);
    });
  });
});
