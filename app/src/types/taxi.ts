export type TripState =
  | 'solicitado'
  | 'aceptado'
  | 'en_camino'
  | 'completado'
  | 'cancelado';

export interface TripLocation {
  direccion: string;
  lat: number;
  lng: number;
  nombre?: string;
}

export interface VehicleInfo {
  modelo: string;
  color: string;
  icono: string;
  placas?: string;
}

export interface TripDriverInfo {
  id: string;
  nombre: string;
  telefono: string;
  vehiculo: VehicleInfo;
}

export interface Trip {
  id: string;
  touristId: string;
  touristNombre?: string;
  touristTelefono?: string;
  driverId?: string;
  driverInfo?: TripDriverInfo;
  origen: TripLocation;
  destino: TripLocation;
  estado: TripState;
  precio: number;
  whatsappThread?: string;
  driverLocation?: { lat: number; lng: number };
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  walletTxId?: string;
}

export interface TaxiUiConfig {
  silhouetteIcon: string;
  buttonIcon: string;
  mapMarkerIcon: string;
  vehicleDescription: string;
  theme: {
    background: string;
    accentGold: string;
    fontFamily: string;
    secondaryText: string;
  };
}
