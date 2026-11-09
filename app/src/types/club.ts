export type ClubReservationType =
  | 'mesa_con_botellas'
  | 'mesa_sin_botellas'
  | 'solo_entrada';

export type DrinkCategory =
  | 'botellas'
  | 'cocteleria'
  | 'cerveza'
  | 'sin_alcohol'
  | 'otros';

export interface ClubDrinkItem {
  id: string;
  clubId: string;
  nombre: string;
  categoria: DrinkCategory;
  precioMXN: number;
  foto: string;
  descripcion?: string;
  disponible: boolean;
}

export interface OrderItem {
  drinkId: string;
  nombre: string;
  cantidad: number;
  precioUnitarioMXN: number;
  subtotalMXN: number;
}

export type OrderState =
  | 'pendiente'
  | 'pagado'
  | 'preparando'
  | 'entregado'
  | 'cancelado';

export interface Order {
  id: string;
  bookingId: string;
  clubId: string;
  touristUserId: string;
  mesa?: string;
  items: OrderItem[];
  totalMXN: number;
  estado: OrderState;
  fecha: string;
}
