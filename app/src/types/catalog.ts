export type CatalogCategory =
  | 'Tours'
  | 'Restaurantes'
  | 'Eventos'
  | 'Taxi'
  | 'Playa'
  | 'Club'
  | 'Hotel';

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  'Tours',
  'Restaurantes',
  'Eventos',
  'Taxi',
  'Playa',
  'Club',
  'Hotel',
];

export type CategoryStatus = 'activa' | 'en_prospeccion' | 'oculta';

export type CentroConsumo =
  | 'alimentos_bebidas'
  | 'transportacion'
  | 'alojamiento'
  | 'xperience';

export const CENTROS_CONSUMO: CentroConsumo[] = [
  'alimentos_bebidas',
  'transportacion',
  'alojamiento',
  'xperience',
];

export interface Provider {
  id: string;
  userId: string;
  tipo: CentroConsumo;
  nombre: string;
  descripción: string;
  fotos: string[];
  activo: boolean;
}

export interface Service {
  id: string;
  providerId: string;
  categoría: CatalogCategory;
  centroConsumo: CentroConsumo;
  título: string;
  precioMXN: number;
  cupo?: number;
  horario?: string;
  fotos: string[];
  activo: boolean;
  centrosIncluidos?: CentroConsumo[];
  ratingFuegos?: number;
}

export interface Review {
  id: string;
  serviceId: string;
  userId: string;
  rating: number; // rating medido en fuegos 🔥 (1-5) — legacy
  texto: string;
  fecha: string;
}

export interface CategoryConfig {
  categoría: CatalogCategory;
  centroConsumo: CentroConsumo;
  estado: CategoryStatus;
}

// --- Borrador v3 / Documento Maestro v2.0 Verticals, Allies & Listings ---

export type AllyCategory = 'venue' | 'tour' | 'accommodation' | 'transport';

export type AllyStatus = 'pending_review' | 'active' | 'suspended';

export type TransportTier = 'hype_go' | 'hype_confort' | 'hype_pro';

export interface AllyLocation {
  lat: number;
  lng: number;
  address: string;
  approximate?: boolean;
}

export interface AllyRules {
  cancellation_policy?: string;
  house_rules?: string[];
  [key: string]: any;
}

export interface AllyProfile {
  business_name: string;
  avatar_url: string;
  description: string;
  location: AllyLocation;
  languages: string[];
  gallery_photos: string[];
  rules?: AllyRules;
}

export interface AllyPayoutConfig {
  payout_method: 'spei_manual' | 'stripe_connect';
  spei_clabe_last4?: string;
  spei_beneficiary_name?: string;
  stripe_account_id?: string;
  pending_payout_balance_mxn: number;
  driver_commission_pool_mxn: number;
}

export interface VenueMenuItem {
  id: string;
  name: string;
  category?: string;
  price_mxn: number;
  iva_included: boolean;
  image_url?: string;
  needs_confirmation?: boolean;
}

export interface VenueVerticalConfig {
  requires_mandatory_bottle: boolean;
  supports_allergies_alert: boolean;
  menu_items?: VenueMenuItem[];
  bar_360_bottles?: Array<{ id: string; name: string; price_mxn: number }>;
  tables?: Array<{ label: string; capacity: number }>;
  turns?: string[];
}

export interface TourVerticalConfig {
  departure_dock: string;
  schedule_slots: string[];
  capacity_per_slot: number;
  operational_checklist: string[];
}

export interface AccommodationVerticalConfig {
  price_per_night_mxn: number;
  check_in: string;
  check_out: string;
  aspectos: string[];
}

export interface TransportVerticalConfig {
  vehicle_tier: TransportTier;
  model_year?: number;
  verification_photos: string[];
  driver_color?: 'azul' | 'amarillo' | 'electrico' | 'vip';
}

export interface AllyVerticalConfig {
  venue?: VenueVerticalConfig;
  tour?: TourVerticalConfig;
  accommodation?: AccommodationVerticalConfig;
  transport?: TransportVerticalConfig;
}

export interface Ally {
  allyId: string;
  owner_uid: string;
  status: AllyStatus;
  ally_activated_at?: string;
  ally_category: AllyCategory;
  ally_subcategory: string;
  payout_config: AllyPayoutConfig;
  profile: AllyProfile;
  vertical_config: AllyVerticalConfig;
  staff_uids: string[];
  is_demo_example?: boolean;
}

export interface ListingPricedDate {
  date: string;
  priceMxn: number;
}

export interface ListingItineraryMoment {
  time: string;
  title: string;
  description?: string;
}

export type ListingStatus = 'en_progreso' | 'publicado' | 'pausado';

export interface Listing {
  id: string;
  allyId: string;
  owner_uid: string;
  category: AllyCategory;
  title: string;
  description: string;
  photos: string[];
  priceMxn: number;
  pricedDates: ListingPricedDate[];
  itineraryMoments: ListingItineraryMoment[];
  status: ListingStatus;
}
