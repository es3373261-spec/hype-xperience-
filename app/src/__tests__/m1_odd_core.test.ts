import {
  emitOddLog,
  getOddLogs,
  clearOddLogs,
  MVP_ODD_EVENTS,
  EXCLUDED_PHASE2_3_ODD_EVENTS,
} from '../observability/oddLogger';
import type { OddEventName } from '../types/odd';
import { PilotQAService, REQUIRED_ODD_EVENTS } from '../release/PilotQAService';
import { CatalogManager } from '../catalog/CatalogManager';
import { initializeFirebase, resetFirebaseInstance } from '../firebase/config';
import { mockStore } from '../firebase/mock';

const EXPECTED_64_MVP_EVENTS: readonly OddEventName[] = [
  // Wallet MVP + Fase 1 (9)
  'wallet.recharge',
  'wallet.payment',
  'wallet.payment_rejected',
  'wallet.mixed_payment',
  'wallet.withdrawal',
  'wallet.autorecharge',
  'wallet.autorecharge_blocked',
  'wallet.low_balance_alert',
  'wallet.preload_suggested',
  // Booking (5)
  'booking.created',
  'booking.paid',
  'booking.double_payment_blocked',
  'booking.self_booking_blocked',
  'booking.cancelled_cascade',
  // Ticket (4)
  'ticket.scanned',
  'ticket.rejected',
  'ticket.final_closed',
  'ticket.tips_paid',
  // Trip (6)
  'trip.requested',
  'trip.accepted',
  'trip.location_updated',
  'trip.completed',
  'trip.cancelled',
  'trip.fare_quoted',
  // Driver (3)
  'driver.pool_deducted',
  'driver.online_paused',
  'driver.pool_topped_up',
  // Ally (4)
  'ally.created',
  'ally.activated',
  'ally.profile_updated',
  'ally.payout_pending',
  // Listing (4)
  'listing.created',
  'listing.published',
  'listing.publish_blocked',
  'listing.draft_saved',
  // Review (3)
  'review.created',
  'review.rejected_not_completed',
  'review.reply_posted',
  // Staff (2)
  'staff.created',
  'staff.scan_rejected_wrong_ally',
  // Aura (4)
  'aura.qualified',
  'aura.draft_created',
  'aura.no_service_found',
  'aura.hallucination_blocked',
  // Concierge (8)
  'concierge.request_received',
  'concierge.request_reviewed',
  'concierge.request_approved',
  'concierge.payment_link_sent',
  'concierge.request_paid',
  'concierge.pending_verification',
  'concierge.action_approved',
  'concierge.action_rejected',
  // Experience / Subbooking / Guide (5)
  'experience.created',
  'experience.published',
  'subbooking.created',
  'subbooking.cancelled_cascade',
  'guide.assigned',
  // Allergies & Preorder (3)
  'allergy.flagged',
  'preorder.created',
  'preorder.ready',
  // Profile & Auth (4)
  'profile.theme_updated',
  'auth.role_assigned',
  'auth.login_failed',
  'account.mode_switched',
];

const EXPECTED_7_EXCLUDED_FASE2_3_EVENTS = [
  'wallet.oxxo_code_generated',
  'wallet.oxxo_paid',
  'wallet.oxxo_expired',
  'wallet.spei_pending',
  'wallet.spei_confirmed',
  'wallet.toll_topup',
  'wallet.fuel_qr_paid',
] as const;

describe('M1 — ODD Core (64 MVP Events, 7 Metrics, 6 Alerts & Security Audit, spec.md §13)', () => {
  let qa: PilotQAService;
  let catalog: CatalogManager;

  beforeEach(() => {
    resetFirebaseInstance();
    mockStore.reset();
    clearOddLogs();
    initializeFirebase({ mode: 'mock' });
    catalog = new CatalogManager();
    qa = new PilotQAService({ catalog });
  });

  describe('64 MVP ODD Events & Fase 2/3 Exclusion', () => {
    it('exports the exact 64 MVP ODD events in MVP_ODD_EVENTS and REQUIRED_ODD_EVENTS with zero overlap with the 7 excluded Fase 2/3 events', () => {
      expect(EXPECTED_64_MVP_EVENTS.length).toBe(64);
      expect(MVP_ODD_EVENTS.length).toBe(64);
      expect(REQUIRED_ODD_EVENTS.length).toBe(64);

      expect(new Set(MVP_ODD_EVENTS)).toEqual(new Set(EXPECTED_64_MVP_EVENTS));
      expect(new Set(REQUIRED_ODD_EVENTS)).toEqual(new Set(EXPECTED_64_MVP_EVENTS));

      expect(EXCLUDED_PHASE2_3_ODD_EVENTS.length).toBe(7);
      expect(new Set(EXCLUDED_PHASE2_3_ODD_EVENTS)).toEqual(
        new Set(EXPECTED_7_EXCLUDED_FASE2_3_EVENTS)
      );

      for (const excluded of EXPECTED_7_EXCLUDED_FASE2_3_EVENTS) {
        expect(MVP_ODD_EVENTS).not.toContain(excluded);
        expect(REQUIRED_ODD_EVENTS).not.toContain(excluded);
      }
    });
  });

  describe('emitOddLog & getOddLogs signatures and filtering', () => {
    it('supports both legacy (event, payload) and structured { event, actorUid, entityId, metadata, timestamp } and filters by event, actorUid/entityId, and time window', () => {
      emitOddLog('booking.created', { bookingId: 'bkg_legacy', vertical: 'venue' });
      emitOddLog({
        event: 'booking.paid',
        actorUid: 'u_sofia',
        entityId: 'bkg_structured',
        metadata: { vertical: 'tour', amountMxn: 350 },
        timestamp: '2026-11-19T10:00:00.000Z',
      });
      emitOddLog({
        event: 'booking.paid',
        actorUid: 'u_other',
        entityId: 'bkg_later',
        metadata: { vertical: 'venue', amountMxn: 580 },
        timestamp: '2026-11-19T15:00:00.000Z',
      });

      expect(getOddLogs().length).toBe(3);
      expect(getOddLogs('booking.created').length).toBe(1);

      const byActor = getOddLogs({ event: 'booking.paid', actorUid: 'u_sofia' });
      expect(byActor.length).toBe(1);
      expect(byActor[0].entityId).toBe('bkg_structured');

      const byEntity = getOddLogs({ entityId: 'bkg_later' });
      expect(byEntity.length).toBe(1);

      const byTimeWindow = getOddLogs({
        from: '2026-11-19T09:00:00.000Z',
        to: '2026-11-19T12:00:00.000Z',
      });
      expect(byTimeWindow.length).toBe(1);
      expect(byTimeWindow[0].entityId).toBe('bkg_structured');
    });
  });

  describe('All 7 §13 Metrics in computeMetrics()', () => {
    it('computes all 7 ODD metrics accurately from emitted logs', () => {
      // 1. Paid bookings by day & vertical
      emitOddLog({
        event: 'booking.paid',
        actorUid: 'u_1',
        entityId: 'bkg_1',
        metadata: { vertical: 'venue', day: '2026-11-19' },
        timestamp: '2026-11-19T10:00:00.000Z',
      });
      emitOddLog({
        event: 'booking.paid',
        actorUid: 'u_2',
        entityId: 'bkg_2',
        metadata: { vertical: 'venue', day: '2026-11-19' },
        timestamp: '2026-11-19T11:00:00.000Z',
      });
      emitOddLog({
        event: 'booking.paid',
        actorUid: 'u_3',
        entityId: 'bkg_3',
        metadata: { vertical: 'tour', day: '2026-11-20' },
        timestamp: '2026-11-20T10:00:00.000Z',
      });

      // 2. Insufficient balance rejections
      emitOddLog({
        event: 'wallet.payment_rejected',
        actorUid: 'u_1',
        entityId: 'bkg_fail',
        metadata: { reason: 'Saldo insuficiente' },
        timestamp: '2026-11-19T10:05:00.000Z',
      });

      // 3. Taxi acceptance latency (30s and 90s -> avg 60s)
      emitOddLog({
        event: 'trip.requested',
        actorUid: 'u_1',
        entityId: 'trip_1',
        metadata: { tripId: 'trip_1' },
        timestamp: '2026-11-19T10:00:00.000Z',
      });
      emitOddLog({
        event: 'trip.accepted',
        actorUid: 'drv_1',
        entityId: 'trip_1',
        metadata: { tripId: 'trip_1' },
        timestamp: '2026-11-19T10:00:30.000Z',
      });
      emitOddLog({
        event: 'trip.requested',
        actorUid: 'u_2',
        entityId: 'trip_2',
        metadata: { tripId: 'trip_2' },
        timestamp: '2026-11-19T10:10:00.000Z',
      });
      emitOddLog({
        event: 'trip.accepted',
        actorUid: 'drv_2',
        entityId: 'trip_2',
        metadata: { tripId: 'trip_2' },
        timestamp: '2026-11-19T10:11:30.000Z',
      });

      // 4. Tickets scanned vs issued (3 paid/issued, 2 scanned -> 2/3)
      emitOddLog({
        event: 'ticket.scanned',
        actorUid: 'staff_1',
        entityId: 'tkt_1',
        timestamp: '2026-11-19T10:30:00.000Z',
      });
      emitOddLog({
        event: 'ticket.scanned',
        actorUid: 'staff_1',
        entityId: 'tkt_2',
        timestamp: '2026-11-19T10:35:00.000Z',
      });

      // 5. Payment & QR errors per hour
      emitOddLog({
        event: 'booking.double_payment_blocked',
        actorUid: 'u_1',
        entityId: 'bkg_1',
        timestamp: '2026-11-19T10:15:00.000Z',
      });
      emitOddLog({
        event: 'ticket.rejected',
        actorUid: 'staff_1',
        entityId: 'tkt_1',
        timestamp: '2026-11-19T10:40:00.000Z',
      });

      // 6 & 7. Aura draft-to-paid conversion rate & mean Concierge approval time
      // 2 Aura drafts; 1 paid (conversion 0.5); approvals at 120s and 240s -> avg 180s
      emitOddLog({
        event: 'aura.draft_created',
        actorUid: 'u_1',
        entityId: 'req_1',
        timestamp: '2026-11-19T10:00:00.000Z',
      });
      emitOddLog({
        event: 'aura.draft_created',
        actorUid: 'u_2',
        entityId: 'req_2',
        timestamp: '2026-11-19T11:00:00.000Z',
      });
      emitOddLog({
        event: 'concierge.request_received',
        actorUid: 'u_1',
        entityId: 'req_1',
        metadata: { requestId: 'req_1' },
        timestamp: '2026-11-19T10:00:00.000Z',
      });
      emitOddLog({
        event: 'concierge.request_approved',
        actorUid: 'concierge_1',
        entityId: 'req_1',
        metadata: { requestId: 'req_1' },
        timestamp: '2026-11-19T10:02:00.000Z', // 120s
      });
      emitOddLog({
        event: 'concierge.request_received',
        actorUid: 'u_2',
        entityId: 'req_2',
        metadata: { requestId: 'req_2' },
        timestamp: '2026-11-19T11:00:00.000Z',
      });
      emitOddLog({
        event: 'concierge.request_approved',
        actorUid: 'concierge_1',
        entityId: 'req_2',
        metadata: { requestId: 'req_2' },
        timestamp: '2026-11-19T11:04:00.000Z', // 240s
      });
      emitOddLog({
        event: 'concierge.request_paid',
        actorUid: 'u_1',
        entityId: 'req_1',
        metadata: { requestId: 'req_1' },
        timestamp: '2026-11-19T10:05:00.000Z',
      });

      const metrics = qa.computeMetrics();

      expect(metrics.paidBookingsTotal).toBe(3);
      expect(metrics.paidBookingsByDayAndVertical['2026-11-19']?.venue).toBe(2);
      expect(metrics.paidBookingsByDayAndVertical['2026-11-20']?.tour).toBe(1);
      expect(metrics.insufficientBalanceRejections).toBe(1);
      expect(metrics.averageTaxiAcceptanceSeconds).toBeCloseTo(60, 2);
      expect(metrics.ticketsScannedVsIssued.issued).toBe(3);
      expect(metrics.ticketsScannedVsIssued.scanned).toBe(2);
      expect(metrics.ticketsScannedVsIssued.ratio).toBeCloseTo(2 / 3, 4);
      expect(metrics.paymentAndQrErrorsCount).toBe(3);
      expect(metrics.paymentAndQrErrorsPerHour).toBeGreaterThan(0);
      expect(metrics.auraDraftConversionRate).toBeCloseTo(0.5, 4);
      expect(metrics.averageConciergeApprovalSeconds).toBeCloseTo(180, 2);
    });
  });

  describe('All 6 §13 Alert Detectors in evaluateAlerts()', () => {
    it('returns all false when system is healthy', () => {
      const alerts = qa.evaluateAlerts();
      expect(alerts.paymentChargedWithoutBooking).toBe(false);
      expect(alerts.withdrawalExceedsBalance).toBe(false);
      expect(alerts.facebookLoginDown).toBe(false);
      expect(alerts.auraOrConciergeHallucination).toBe(false);
      expect(alerts.driverPoolBelowMinimum).toBe(false);
      expect(alerts.listingPublishedWithoutAvailability).toBe(false);
    });

    it('detects all 6 §13 alert conditions', async () => {
      // 1. Orphan payment without booking
      emitOddLog('wallet.payment', { uid: 'u_1', amountMxn: 500 });
      // 2. Withdrawal / debit exceeds balance
      emitOddLog('wallet.payment_rejected', {
        uid: 'u_1',
        reason: 'exceeds_balance',
        attemptedAmountMxn: 2000,
        balanceMxn: 500,
      });
      // 3. Facebook login down
      emitOddLog('auth.login_failed', { provider: 'facebook', reason: 'facebook_login_down' });
      // 4. Aura / Concierge hallucination
      emitOddLog('aura.hallucination_blocked', { inventedService: 'Yate Fantasma' });
      // 5. Driver pool < -$30
      emitOddLog('driver.pool_deducted', {
        driverId: 'drv_1',
        balanceAfterMxn: -35,
      });
      // 6. Listing published without availability (in Firestore or ODD log)
      await mockStore.firestore.collection('listings').doc('lst_bad').set({
        id: 'lst_bad',
        status: 'publicado',
        pricedDates: [],
      });

      const alerts = qa.evaluateAlerts();
      expect(alerts.paymentChargedWithoutBooking).toBe(true);
      expect(alerts.withdrawalExceedsBalance).toBe(true);
      expect(alerts.facebookLoginDown).toBe(true);
      expect(alerts.auraOrConciergeHallucination).toBe(true);
      expect(alerts.driverPoolBelowMinimum).toBe(true);
      expect(alerts.listingPublishedWithoutAvailability).toBe(true);
    });
  });

  describe('Security Audit: Zero CLABE Leakage', () => {
    it('passes when no full CLABE exists and flags clabeFull or public spei_clabe leakage', () => {
      const cleanReport = qa.auditSecurityAndPrivacy(
        [
          {
            uid: 'u_1',
            display_name: 'Sofía',
            email: 'sofia@ejemplo.com',
            phone: '7441112233',
            terms_accepted: true,
            account_status: 'active',
            roles: ['explorer'],
            mode: 'viajero',
            concierge_access: false,
            allergies: [],
            theme: 'dark',
            wallet: {
              balance_mxn: 1000,
              currency: 'MXN',
              is_closed_loop: true,
              updated_at: '2026-11-19T00:00:00Z',
            },
            bank: { clabeLast4: '4567', titular: 'Sofía' },
          },
        ],
        [
          {
            allyId: 'ally_rulos',
            owner_uid: 'u_rulos',
            status: 'active',
            ally_category: 'venue',
            ally_subcategory: 'restaurante',
            payout_config: {
              payout_method: 'spei_manual',
              spei_clabe_last4: '4567',
              spei_beneficiary_name: 'Mariscos Rulos SA de CV',
              pending_payout_balance_mxn: 0,
              driver_commission_pool_mxn: 0,
            },
            profile: {
              business_name: "Mariscos Rulo's",
              avatar_url: '',
              description: '',
              location: { lat: 16.84911, lng: -99.85405, address: 'CICI' },
              languages: ['es'],
              gallery_photos: [],
            },
            vertical_config: {},
            staff_uids: [],
          },
        ]
      );
      expect(cleanReport.clabePrivacyCompliant).toBe(true);

      const leakedUserReport = qa.auditSecurityAndPrivacy([
        {
          uid: 'u_bad',
          bank: { clabeLast4: '4567', clabeFull: '012345678901234567', titular: 'Bad' },
        } as any,
      ]);
      expect(leakedUserReport.clabePrivacyCompliant).toBe(false);

      const leakedAllyReport = qa.auditSecurityAndPrivacy(
        [],
        [
          {
            allyId: 'ally_bad',
            payout_config: {
              payout_method: 'spei_manual',
              spei_clabe: '012345678901234567',
              spei_clabe_last4: '4567',
            },
          } as any,
        ]
      );
      expect(leakedAllyReport.clabePrivacyCompliant).toBe(false);
    });
  });
});
