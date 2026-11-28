import type {
  OddEventName,
  ExcludedPhase23OddEventName,
  StructuredOddLogInput,
  OddLogFilter,
} from '../types/odd';

export const MVP_ODD_EVENTS: readonly OddEventName[] = [
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
] as const;

export const EXCLUDED_PHASE2_3_ODD_EVENTS: readonly ExcludedPhase23OddEventName[] = [
  'wallet.oxxo_code_generated',
  'wallet.oxxo_paid',
  'wallet.oxxo_expired',
  'wallet.spei_pending',
  'wallet.spei_confirmed',
  'wallet.toll_topup',
  'wallet.fuel_qr_paid',
] as const;

export interface OddLogEntry {
  event: string;
  payload: Record<string, any>;
  actorUid?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

const oddLogsStore: OddLogEntry[] = [];

export function emitOddLog(event: string, payload?: Record<string, any>): void;
export function emitOddLog(input: StructuredOddLogInput): void;
export function emitOddLog(
  eventOrInput: string | StructuredOddLogInput,
  payload?: Record<string, any>
): void {
  if (typeof eventOrInput === 'string') {
    const safePayload = payload || {};
    oddLogsStore.push({
      event: eventOrInput,
      payload: safePayload,
      actorUid: safePayload.actorUid || safePayload.userId || safePayload.uid,
      entityId:
        safePayload.entityId ||
        safePayload.bookingId ||
        safePayload.tripId ||
        safePayload.requestId ||
        safePayload.listingId,
      metadata: safePayload,
      timestamp: new Date().toISOString(),
    });
  } else {
    const meta = eventOrInput.metadata || {};
    oddLogsStore.push({
      event: eventOrInput.event,
      payload: meta,
      actorUid: eventOrInput.actorUid,
      entityId: eventOrInput.entityId,
      metadata: meta,
      timestamp: eventOrInput.timestamp || new Date().toISOString(),
    });
  }
}

export function getOddLogs(filter?: string | OddLogFilter): OddLogEntry[] {
  if (!filter) {
    return [...oddLogsStore];
  }
  if (typeof filter === 'string') {
    return oddLogsStore.filter((log) => log.event === filter);
  }
  const fromTs = filter.from ? new Date(filter.from).getTime() : undefined;
  const toTs = filter.to ? new Date(filter.to).getTime() : undefined;

  return oddLogsStore.filter((log) => {
    if (filter.event && log.event !== filter.event) return false;
    if (filter.actorUid && log.actorUid !== filter.actorUid) return false;
    if (filter.entityId && log.entityId !== filter.entityId) return false;
    const logTs = new Date(log.timestamp).getTime();
    if (fromTs !== undefined && logTs < fromTs) return false;
    if (toTs !== undefined && logTs > toTs) return false;
    return true;
  });
}

export function clearOddLogs(): void {
  oddLogsStore.length = 0;
}
