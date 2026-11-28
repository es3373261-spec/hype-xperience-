export type OddEventName =
  // Wallet MVP + Fase 1 (9)
  | 'wallet.recharge'
  | 'wallet.payment'
  | 'wallet.payment_rejected'
  | 'wallet.mixed_payment'
  | 'wallet.withdrawal'
  | 'wallet.autorecharge'
  | 'wallet.autorecharge_blocked'
  | 'wallet.low_balance_alert'
  | 'wallet.preload_suggested'
  // Booking (5)
  | 'booking.created'
  | 'booking.paid'
  | 'booking.double_payment_blocked'
  | 'booking.self_booking_blocked'
  | 'booking.cancelled_cascade'
  // Ticket (4)
  | 'ticket.scanned'
  | 'ticket.rejected'
  | 'ticket.final_closed'
  | 'ticket.tips_paid'
  // Trip (6)
  | 'trip.requested'
  | 'trip.accepted'
  | 'trip.location_updated'
  | 'trip.completed'
  | 'trip.cancelled'
  | 'trip.fare_quoted'
  // Driver (3)
  | 'driver.pool_deducted'
  | 'driver.online_paused'
  | 'driver.pool_topped_up'
  // Ally (4)
  | 'ally.created'
  | 'ally.activated'
  | 'ally.profile_updated'
  | 'ally.payout_pending'
  // Listing (4)
  | 'listing.created'
  | 'listing.published'
  | 'listing.publish_blocked'
  | 'listing.draft_saved'
  // Review (3)
  | 'review.created'
  | 'review.rejected_not_completed'
  | 'review.reply_posted'
  // Staff (2)
  | 'staff.created'
  | 'staff.scan_rejected_wrong_ally'
  // Aura (4)
  | 'aura.qualified'
  | 'aura.draft_created'
  | 'aura.no_service_found'
  | 'aura.hallucination_blocked'
  // Concierge (8)
  | 'concierge.request_received'
  | 'concierge.request_reviewed'
  | 'concierge.request_approved'
  | 'concierge.payment_link_sent'
  | 'concierge.request_paid'
  | 'concierge.pending_verification'
  | 'concierge.action_approved'
  | 'concierge.action_rejected'
  // Experience / Subbooking / Guide (5)
  | 'experience.created'
  | 'experience.published'
  | 'subbooking.created'
  | 'subbooking.cancelled_cascade'
  | 'guide.assigned'
  // Allergies & Preorder (3)
  | 'allergy.flagged'
  | 'preorder.created'
  | 'preorder.ready'
  // Profile & Auth (4)
  | 'profile.theme_updated'
  | 'auth.role_assigned'
  | 'auth.login_failed'
  | 'account.mode_switched';

export type ExcludedPhase23OddEventName =
  | 'wallet.oxxo_code_generated'
  | 'wallet.oxxo_paid'
  | 'wallet.oxxo_expired'
  | 'wallet.spei_pending'
  | 'wallet.spei_confirmed'
  | 'wallet.toll_topup'
  | 'wallet.fuel_qr_paid';

export interface StructuredOddLogInput {
  event: OddEventName | string;
  actorUid?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

export interface OddLogFilter {
  event?: string;
  actorUid?: string;
  entityId?: string;
  from?: string;
  to?: string;
}
