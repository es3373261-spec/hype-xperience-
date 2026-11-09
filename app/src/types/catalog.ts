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
  rating: number; // rating medido en fuegos 🔥 (1-5)
  texto: string;
  fecha: string;
}

export interface CategoryConfig {
  categoría: CatalogCategory;
  centroConsumo: CentroConsumo;
  estado: CategoryStatus;
}
