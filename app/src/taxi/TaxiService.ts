import { User } from '../types/user';
import { WalletService } from '../wallet/WalletService';
import {
  Trip,
  TripLocation,
  TripState,
  TaxiUiConfig,
  VehicleInfo,
  TripDriverInfo,
} from '../types/taxi';
import { RBAC } from '../auth/rbac';
import { emitOddLog } from '../observability/oddLogger';
import { getFirebaseInstance } from '../firebase/config';

export const BOCHO_TAXI_ICON = 'icon/bocho-taxi-silhouette.png';

export const BOCHO_TAXI_VEHICLE: VehicleInfo = {
  modelo: 'Volkswagen Sedan (Bocho)',
  color: 'Azul con blanco (Acapulco clásico)',
  icono: BOCHO_TAXI_ICON,
  placas: 'A-744-HYP',
};

// Conductor piloto oficial confirmado (spec §14 Q2)
export const MARIO_TORRES_PILOT_DRIVER: TripDriverInfo = {
  id: 'driver-mario-torres',
  nombre: 'Mario Torres',
  telefono: '+527441112233',
  vehiculo: BOCHO_TAXI_VEHICLE,
};

export class TaxiService {
  private walletService: WalletService;
  private trips: Map<string, Trip> = new Map();
  private nextId = 1;

  constructor(walletService?: WalletService) {
    this.walletService = walletService || new WalletService();
  }

  // 1. Configuración de UI — Bocho Azul y Mapa tipo Uber (spec §2, §3, §6)
  getTaxiUiConfig(): TaxiUiConfig {
    return {
      silhouetteIcon: BOCHO_TAXI_ICON,
      buttonIcon: BOCHO_TAXI_ICON,
      mapMarkerIcon: BOCHO_TAXI_ICON,
      vehicleDescription: 'Bocho de taxi azul de Acapulco (blanco y azul)',
      theme: {
        background: '#000000', // Super AMOLED
        accentGold: '#d4af37',
        fontFamily: 'Montserrat',
        secondaryText: '#a9b1d6',
      },
    };
  }

  getPilotDriverInfo(): TripDriverInfo {
    return MARIO_TORRES_PILOT_DRIVER;
  }

  // 2. Solicitar Taxi y Pago Prepago con Wallet (spec §4 F4, §8, §10 T03-T04)
  requestTrip(
    touristUser: User,
    params: {
      origen: TripLocation;
      destino: TripLocation;
      precioMXN: number;
    }
  ): Trip {
    if (touristUser.rol !== 'turista' && touristUser.rol !== 'admin_hype') {
      throw new Error('Solo los turistas pueden solicitar un taxi');
    }

    if (params.precioMXN <= 0) {
      throw new Error('El precio del viaje debe ser mayor a 0 MXN');
    }

    const currentBalance = this.walletService.getBalance(touristUser.id);
    if (currentBalance < params.precioMXN) {
      emitOddLog('wallet.payment_rejected', {
        userId: touristUser.id,
        monto: params.precioMXN,
        saldoActual: currentBalance,
        motivo: 'saldo_insuficiente',
      });
      throw new Error('Saldo insuficiente — agrega dinero en tu Wallet');
    }

    // Retención / Débito prepago de la Wallet del turista (§4 F4, §8)
    this.walletService.setBalance(touristUser.id, currentBalance - params.precioMXN);

    const tripId = `trip_${Date.now()}_${this.nextId++}`;
    const newTrip: Trip = {
      id: tripId,
      touristId: touristUser.id,
      touristNombre: touristUser.nombre,
      touristTelefono: touristUser.telefono,
      origen: params.origen,
      destino: params.destino,
      estado: 'solicitado',
      precio: params.precioMXN,
      createdAt: new Date().toISOString(),
      walletTxId: `tx_trip_hold_${tripId}`,
    };

    this.trips.set(tripId, newTrip);

    const fb = getFirebaseInstance();
    fb.firestore.collection('trips').doc(tripId).set(newTrip);

    // ODD Observabilidad (§11)
    emitOddLog('trip.requested', {
      tripId,
      touristId: touristUser.id,
      origen: params.origen.direccion,
      destino: params.destino.direccion,
      precio: params.precioMXN,
    });

    return newTrip;
  }

  // 3. Aceptar Viaje por Taxista, Reparto 90/10 y Enlace de WhatsApp T12 (spec §4 F4, §8, §10 T12, §14 Q4)
  acceptTrip(driverUser: User, tripId: string): Trip {
    const canonical = RBAC.canonicalizeRole(driverUser.rol);
    if (canonical !== 'transportacion' && driverUser.rol !== 'admin_hype') {
      throw new Error('No autorizado: solo taxistas con rol transportacion pueden aceptar viajes');
    }

    const trip = this.trips.get(tripId);
    if (!trip) {
      throw new Error(`Viaje no encontrado: ${tripId}`);
    }

    if (trip.estado !== 'solicitado') {
      throw new Error(`El viaje no está disponible para aceptación (estado: ${trip.estado})`);
    }

    const vehicle =
      driverUser.id === MARIO_TORRES_PILOT_DRIVER.id
        ? MARIO_TORRES_PILOT_DRIVER.vehiculo
        : BOCHO_TAXI_VEHICLE;

    const driverInfo: TripDriverInfo = {
      id: driverUser.id,
      nombre: driverUser.nombre,
      telefono: driverUser.telefono,
      vehiculo: vehicle,
    };

    trip.driverId = driverUser.id;
    trip.driverInfo = driverInfo;
    trip.estado = 'aceptado';
    trip.acceptedAt = new Date().toISOString();

    // Reparto spec §8 y §14 Q4: 90% taxista, 10% comisión Hype
    const netoDriver = Math.round(trip.precio * 0.9 * 100) / 100;
    const comisionHype = Math.round(trip.precio * 0.1 * 100) / 100;

    const currentDriverBalance = this.walletService.getBalance(driverUser.id);
    this.walletService.setBalance(driverUser.id, currentDriverBalance + netoDriver);

    const currentHypeBalance = this.walletService.getHypeRevenueBalance();
    this.walletService.setBalance('admin_hype', currentHypeBalance + comisionHype);

    // Criterio T12 Taxi: enlace directo de seguimiento por WhatsApp con mensaje listo
    const cleanDriverPhone = driverUser.telefono.replace(/[^0-9]/g, '');
    const touristMsg =
      `¡Hola ${driverUser.nombre}! Soy ${trip.touristNombre || 'tu pasajero'} de Hype Taxi en Hype Xperience. ` +
      `Te escribo por mi viaje de taxi (ID: ${trip.id}) en tu ${vehicle.modelo}. ` +
      `Recogida: ${trip.origen.direccion}. Destino: ${trip.destino.direccion}.`;

    trip.whatsappThread = `https://wa.me/${cleanDriverPhone}?text=${encodeURIComponent(touristMsg)}`;

    this.trips.set(trip.id, trip);

    const fb = getFirebaseInstance();
    fb.firestore.collection('trips').doc(trip.id).set(trip);

    // ODD Observabilidad (§11)
    emitOddLog('trip.accepted', {
      tripId: trip.id,
      driverId: driverUser.id,
      touristId: trip.touristId,
      netoDriver,
      comisionHype,
    });

    return trip;
  }

  // Generar enlace WhatsApp para el taxista hacia el turista
  getWhatsAppLinkForDriver(driverUser: User, tripId: string): string {
    const trip = this.trips.get(tripId);
    if (!trip) {
      throw new Error(`Viaje no encontrado: ${tripId}`);
    }

    if (trip.driverId !== driverUser.id && driverUser.rol !== 'admin_hype') {
      throw new Error('No autorizado: este viaje no te pertenece');
    }

    const cleanPhone = (trip.touristTelefono || '').replace(/[^0-9]/g, '');
    const vehicle = trip.driverInfo?.vehiculo || BOCHO_TAXI_VEHICLE;
    const driverMsg =
      `¡Hola ${trip.touristNombre || 'pasajero'}! Soy tu chofer ${driverUser.nombre} de Hype Taxi en el ${vehicle.modelo}. ` +
      `Voy en camino a tu punto de recogida: ${trip.origen.direccion}. (Viaje: ${trip.id})`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(driverMsg)}`;
  }

  // 4. Telemetría y Movimiento en el Mapa tipo Uber (spec §2)
  updateDriverLocation(
    driverUser: User,
    tripId: string,
    coords: { lat: number; lng: number }
  ): Trip {
    const trip = this.trips.get(tripId);
    if (!trip) {
      throw new Error(`Viaje no encontrado: ${tripId}`);
    }

    if (trip.driverId !== driverUser.id && driverUser.rol !== 'admin_hype') {
      throw new Error('No autorizado: este viaje no te pertenece');
    }

    trip.driverLocation = coords;
    if (trip.estado === 'aceptado') {
      trip.estado = 'en_camino';
    }

    this.trips.set(trip.id, trip);

    const fb = getFirebaseInstance();
    fb.firestore.collection('trips').doc(trip.id).set(trip);

    // ODD Observabilidad (§11)
    emitOddLog('trip.location_updated', {
      tripId: trip.id,
      lat: coords.lat,
      lng: coords.lng,
      estado: trip.estado,
    });

    return trip;
  }

  // 5. Privacidad y Aislamiento de Viajes (RBAC spec §3)
  getAvailableTrips(driverUser: User): Trip[] {
    const canonical = RBAC.canonicalizeRole(driverUser.rol);
    if (canonical !== 'transportacion' && driverUser.rol !== 'admin_hype') {
      throw new Error('No autorizado');
    }

    return Array.from(this.trips.values()).filter(
      (t) => t.estado === 'solicitado' && !t.driverId
    );
  }

  getDriverTrips(driverUser: User): Trip[] {
    const canonical = RBAC.canonicalizeRole(driverUser.rol);
    if (canonical !== 'transportacion' && driverUser.rol !== 'admin_hype') {
      throw new Error('No autorizado');
    }

    // Regla spec §3: un taxista NO puede ver viajes de otros taxistas
    return Array.from(this.trips.values()).filter((t) => t.driverId === driverUser.id);
  }

  getTouristTrips(touristUser: User): Trip[] {
    return Array.from(this.trips.values()).filter((t) => t.touristId === touristUser.id);
  }

  getTripById(tripId: string): Trip | null {
    return this.trips.get(tripId) || null;
  }

  // 6. Completar Viaje (spec §7)
  completeTrip(driverUser: User, tripId: string): Trip {
    const trip = this.trips.get(tripId);
    if (!trip) {
      throw new Error(`Viaje no encontrado: ${tripId}`);
    }

    if (trip.driverId !== driverUser.id && driverUser.rol !== 'admin_hype') {
      throw new Error('No autorizado: este viaje no te pertenece');
    }

    trip.estado = 'completado';
    trip.completedAt = new Date().toISOString();

    this.trips.set(trip.id, trip);

    const fb = getFirebaseInstance();
    fb.firestore.collection('trips').doc(trip.id).set(trip);

    // ODD Observabilidad (§11)
    emitOddLog('trip.completed', {
      tripId: trip.id,
      driverId: driverUser.id,
      touristId: trip.touristId,
      completedAt: trip.completedAt,
    });

    return trip;
  }

  // 7. Cancelar Viaje con Reembolso si no ha sido aceptado
  cancelTrip(user: User, tripId: string, motivo?: string): Trip {
    const trip = this.trips.get(tripId);
    if (!trip) {
      throw new Error(`Viaje no encontrado: ${tripId}`);
    }

    const isAuthorized =
      trip.touristId === user.id ||
      trip.driverId === user.id ||
      user.rol === 'admin_hype';

    if (!isAuthorized) {
      throw new Error('No autorizado para cancelar este viaje');
    }

    if (trip.estado === 'completado' || trip.estado === 'cancelado') {
      throw new Error(`No se puede cancelar un viaje con estado: ${trip.estado}`);
    }

    // Reembolso al turista si el viaje se cancela antes de ser aceptado
    if (trip.estado === 'solicitado') {
      const touristBal = this.walletService.getBalance(trip.touristId);
      this.walletService.setBalance(trip.touristId, touristBal + trip.precio);
    }

    trip.estado = 'cancelado';
    trip.cancelledAt = new Date().toISOString();
    trip.cancelReason = motivo || 'Cancelado por el usuario';

    this.trips.set(trip.id, trip);

    const fb = getFirebaseInstance();
    fb.firestore.collection('trips').doc(trip.id).set(trip);

    // ODD Observabilidad (§11)
    emitOddLog('trip.cancelled', {
      tripId: trip.id,
      cancelledBy: user.id,
      motivo: trip.cancelReason,
    });

    return trip;
  }
}
