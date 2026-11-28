export type VerifiedReviewKind = 'servicio' | 'conductor' | 'pasajero';

export interface VerifiedReviewReply {
  authorUid: string;
  comment: string;
  createdAt: string;
}

export interface VerifiedReview {
  id: string;
  bookingId: string;
  allyId: string;
  authorUid: string;
  kind: VerifiedReviewKind;
  rating: number; // 1.0 - 5.0 stars
  comment: string;
  photos: string[];
  allyReply: VerifiedReviewReply | null;
  createdAt: string;
}
