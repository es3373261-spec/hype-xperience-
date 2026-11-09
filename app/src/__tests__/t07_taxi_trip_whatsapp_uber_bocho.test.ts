import { TaxiService, BOCHO_TAXI_ICON, BOCHO_TAXI_VEHICLE } from '../taxi/TaxiService';
import { CatalogManager } from '../catalog/CatalogManager';
import { WalletService } from '../wallet/WalletService';
import { User } from '../types/user';
import { Trip, TripLocation } from '../types/taxi';
import { getOddLogs, clearOddLogs } from '../observability/oddLogger';
import { initializeFirebase } from '../firebase/config';

describe('T-07: Taxi — viaje + WhatsApp, mapa tipo Uber, bocho azul (spec §2, §3, §4 F4, §7, §8, §10 T12, §14 Q2)', () => {
  let catalog: CatalogManager;
  let walletService: WalletService;
  let taxiService: TaxiService;

  // Turista
  const touristUser: User = {
    id: 'u-tourist-carlos',
    nombre: 'Carlos Turista',
    email: 'carlos@turista.com',
    telefono: '+527449876543',
    rol: 'turista',
    tema: 'oscuro',
    bank: { clabeLast4: '1122', titular: 'Carlos Turista' },
    socialLinks: { whatsapp: '+527449876543' },
  };

  // Taxista piloto oficial Mario Torres (spec §14 Q2)
  const marioTorresDriver: User = {
    id: 'driver-mario-torres',
    nombre: 'Mario Torres',
    email: 'mario.torres@taxiacapulco.com',
    telefono: '+527441112233',
    rol: 'transportacion',
    tema: 'oscuro',
    bank: { clabeLast4: '3344', titular: 'Mario Torres' },
    socialLinks: { whatsapp: '+527441112233' },
  };

  // Otro taxista para probar aislamiento de viajes entre chóferes
  const anotherDriver: User = {
    id: 'driver-juan-perez',
    nombre: 'Juan Pérez',
    email: 'juan.perez@taxi.com',
    telefono: '+527445556677',
    rol: 'transportacion',
    tema: 'oscuro',
    bank: { clabeLast4: '5566', titular: 'Juan Pérez' },
    socialLinks: { whatsapp: '+527445556677' },
  };

  const origenCICI: TripLocation = {
    direccion: 'Playa CICI Acapulco, Costa Azul',
    lat: 16.84911,
    lng: -99.85405,
    nombre: "Acceso CICI / Mariscos Rulo's",
  };

  const destinoRonnie: TripLocation = {
    direccion: 'Av. Costera Miguel Alemán, Ronnie Acapulco',
    lat: 16.8582,
    lng: -99.8631,
    nombre: 'Ronnie Acapulco',
  };

  beforeEach(() => {
    initializeFirebase({ useMocks: true });
    clearOddLogs();
    catalog = new CatalogManager();
    walletService = new WalletService();
    taxiService = new TaxiService(walletService);
  });

  describe('1. Iconografía y Estilo Bocho Azul tipo Uber (spec §2, §3, §6)', () => {
    test('el botón de taxi y el marcador del mapa usan la silueta del bocho azul de Acapulco', () => {
      const config = taxiService.getTaxiUiConfig();

      expect(config.silhouetteIcon).toBe('icon/bocho-taxi-silhouette.png');
      expect(config.buttonIcon).toBe(BOCHO_TAXI_ICON);
      expect(config.mapMarkerIcon).toBe(BOCHO_TAXI_ICON);
      expect(config.vehicleDescription).toBe('Bocho de taxi azul de Acapulco (blanco y azul)');
      expect(config.theme.background).toBe('#000000'); // Super AMOLED
      expect(config.theme.accentGold).toBe('#d4af37');
      expect(config.theme.fontFamily).toBe('Montserrat');
    });

    test('los datos del vehículo piloto corresponden a Mario Torres con bocho azul (spec §14 Q2)', () => {
      const pilotDriver = taxiService.getPilotDriverInfo();
      expect(pilotDriver.nombre).toBe('Mario Torres');
      expect(pilotDriver.vehiculo.modelo).toContain('Bocho');
      expect(pilotDriver.vehiculo.color.toLowerCase()).toContain('azul');
      expect(pilotDriver.vehiculo.icono).toBe('icon/bocho-taxi-silhouette.png');
    });
  });

  describe('2. Solicitud y Pago Prepago con Wallet (spec §4 F4, §8, §10 T03-T04, §14 Q4)', () => {
    test('rechaza la solicitud de taxi si el turista no tiene saldo suficiente en su Wallet', () => {
      walletService.setBalance(touristUser.id, 50); // Saldo insuficiente para viaje de $180 MXN

      expect(() => {
        taxiService.requestTrip(touristUser, {
          origen: origenCICI,
          destino: destinoRonnie,
          precioMXN: 180,
        });
      }).toThrow('Saldo insuficiente — agrega dinero en tu Wallet');

      const rejectedLogs = getOddLogs('wallet.payment_rejected');
      expect(rejectedLogs.length).toBeGreaterThanOrEqual(1);
    });

    test('al solicitar con saldo suficiente, descuenta el viaje y genera Trip en estado solicitado', () => {
      walletService.setBalance(touristUser.id, 500);

      const trip = taxiService.requestTrip(touristUser, {
        origen: origenCICI,
        destino: destinoRonnie,
        precioMXN: 200,
      });

      expect(trip.id).toBeDefined();
      expect(trip.touristId).toBe(touristUser.id);
      expect(trip.precio).toBe(200);
      expect(trip.estado).toBe('solicitado');
      expect(trip.origen.direccion).toBe(origenCICI.direccion);
      expect(trip.destino.direccion).toBe(destinoRonnie.direccion);

      // El pago prepago se retiene de la Wallet del turista
      expect(walletService.getBalance(touristUser.id)).toBe(300);

      const reqLogs = getOddLogs('trip.requested');
      expect(reqLogs.length).toBe(1);
      expect(reqLogs[0].payload.tripId).toBe(trip.id);
    });
  });

  describe('3. Aceptación del Viaje por Taxista y Reparto 90% / 10% (spec §4 F4, §8, §14 Q4)', () => {
    test('un taxista con rol transportacion acepta el viaje y se reparte 90% taxista / 10% Hype', () => {
      walletService.setBalance(touristUser.id, 1000);
      const trip = taxiService.requestTrip(touristUser, {
        origen: origenCICI,
        destino: destinoRonnie,
        precioMXN: 500,
      });

      const acceptedTrip = taxiService.acceptTrip(marioTorresDriver, trip.id);

      expect(acceptedTrip.estado).toBe('aceptado');
      expect(acceptedTrip.driverId).toBe(marioTorresDriver.id);
      expect(acceptedTrip.driverInfo?.nombre).toBe('Mario Torres');

      // Reparto spec §8 y §14 Q4: 90% prestador ($450) y 10% Hype ($50)
      expect(walletService.getBalance(marioTorresDriver.id)).toBe(450);
      expect(walletService.getHypeRevenueBalance()).toBe(50);

      const acceptLogs = getOddLogs('trip.accepted');
      expect(acceptLogs.length).toBe(1);
      expect(acceptLogs[0].payload.tripId).toBe(trip.id);
      expect(acceptLogs[0].payload.driverId).toBe(marioTorresDriver.id);
    });

    test('un usuario con rol turista no puede aceptar viajes de taxi (RBAC spec §3)', () => {
      walletService.setBalance(touristUser.id, 300);
      const trip = taxiService.requestTrip(touristUser, {
        origen: origenCICI,
        destino: destinoRonnie,
        precioMXN: 150,
      });

      expect(() => {
        taxiService.acceptTrip(touristUser, trip.id);
      }).toThrow('No autorizado: solo taxistas con rol transportacion pueden aceptar viajes');
    });
  });

  describe('4. Criterio T12: Enlace de Seguimiento por WhatsApp (spec §4 F4, §10 T12)', () => {
    test('T12 Taxi: dado viaje aceptado, entonces aparece el enlace de seguimiento por WhatsApp', () => {
      walletService.setBalance(touristUser.id, 500);
      const trip = taxiService.requestTrip(touristUser, {
        origen: origenCICI,
        destino: destinoRonnie,
        precioMXN: 200,
      });

      // Antes de aceptar, no hay thread o enlace con taxista asignado
      expect(trip.whatsappThread).toBeUndefined();

      const acceptedTrip = taxiService.acceptTrip(marioTorresDriver, trip.id);

      // T12 verificado: aparece el enlace listo de WhatsApp
      expect(acceptedTrip.whatsappThread).toBeDefined();
      expect(acceptedTrip.whatsappThread).toContain('https://wa.me/527441112233');

      // El mensaje predefinido incluye datos de identificación del viaje y del bocho azul
      const decodedThread = decodeURIComponent(acceptedTrip.whatsappThread!);
      expect(decodedThread).toContain('Hype Taxi');
      expect(decodedThread).toContain(acceptedTrip.id);
      expect(decodedThread).toContain('Mario Torres');
      expect(decodedThread).toContain('Bocho');
      expect(decodedThread).toContain(origenCICI.direccion);
      expect(decodedThread).toContain(destinoRonnie.direccion);
    });

    test('genera también el enlace de WhatsApp para que el taxista contacte al turista', () => {
      walletService.setBalance(touristUser.id, 500);
      const trip = taxiService.requestTrip(touristUser, {
        origen: origenCICI,
        destino: destinoRonnie,
        precioMXN: 200,
      });
      taxiService.acceptTrip(marioTorresDriver, trip.id);

      const driverToTouristUrl = taxiService.getWhatsAppLinkForDriver(marioTorresDriver, trip.id);
      expect(driverToTouristUrl).toContain('https://wa.me/527449876543');
      const decoded = decodeURIComponent(driverToTouristUrl);
      expect(decoded).toContain('Carlos Turista');
      expect(decoded).toContain(trip.id);
    });
  });

  describe('5. Telemetría y Mapa tipo Uber: Bocho en movimiento (spec §2, §3)', () => {
    test('el taxista actualiza la ubicación y se refleja el movimiento del bocho en tiempo real', () => {
      walletService.setBalance(touristUser.id, 500);
      const trip = taxiService.requestTrip(touristUser, {
        origen: origenCICI,
        destino: destinoRonnie,
        precioMXN: 200,
      });
      taxiService.acceptTrip(marioTorresDriver, trip.id);

      // Simulación de movimiento del bocho
      const updatedTrip = taxiService.updateDriverLocation(marioTorresDriver, trip.id, {
        lat: 16.852,
        lng: -99.858,
      });

      expect(updatedTrip.driverLocation).toEqual({ lat: 16.852, lng: -99.858 });
      expect(updatedTrip.estado).toBe('en_camino');

      const locLogs = getOddLogs('trip.location_updated');
      expect(locLogs.length).toBe(1);
      expect(locLogs[0].payload.tripId).toBe(trip.id);
      expect(locLogs[0].payload.lat).toBe(16.852);
    });

    test('un taxista no puede mover la ubicación de un viaje de otro taxista', () => {
      walletService.setBalance(touristUser.id, 500);
      const trip = taxiService.requestTrip(touristUser, {
        origen: origenCICI,
        destino: destinoRonnie,
        precioMXN: 200,
      });
      taxiService.acceptTrip(marioTorresDriver, trip.id);

      expect(() => {
        taxiService.updateDriverLocation(anotherDriver, trip.id, { lat: 16.855, lng: -99.86 });
      }).toThrow('No autorizado: este viaje no te pertenece');
    });
  });

  describe('6. Aislamiento y Privacidad de Viajes (RBAC spec §3)', () => {
    test('un taxista NO puede ver viajes asignados a otros taxistas', () => {
      walletService.setBalance(touristUser.id, 1000);

      // Viaje 1 asignado a Mario Torres
      const trip1 = taxiService.requestTrip(touristUser, {
        origen: origenCICI,
        destino: destinoRonnie,
        precioMXN: 200,
      });
      taxiService.acceptTrip(marioTorresDriver, trip1.id);

      // Viaje 2 asignado a Juan Pérez
      const trip2 = taxiService.requestTrip(touristUser, {
        origen: origenCICI,
        destino: destinoRonnie,
        precioMXN: 250,
      });
      taxiService.acceptTrip(anotherDriver, trip2.id);

      // Mario Torres solo ve trip1
      const marioTrips = taxiService.getDriverTrips(marioTorresDriver);
      expect(marioTrips.length).toBe(1);
      expect(marioTrips[0].id).toBe(trip1.id);

      // Juan Pérez solo ve trip2
      const juanTrips = taxiService.getDriverTrips(anotherDriver);
      expect(juanTrips.length).toBe(1);
      expect(juanTrips[0].id).toBe(trip2.id);
    });

    test('los taxistas pueden ver los viajes disponibles sin asignar', () => {
      walletService.setBalance(touristUser.id, 500);
      const trip = taxiService.requestTrip(touristUser, {
        origen: origenCICI,
        destino: destinoRonnie,
        precioMXN: 200,
      });

      const available = taxiService.getAvailableTrips(marioTorresDriver);
      expect(available.length).toBe(1);
      expect(available[0].id).toBe(trip.id);
    });
  });

  describe('7. Finalización y Cancelación con Reembolso (spec §7, §8)', () => {
    test('completar el viaje actualiza el estado a completado y emite log ODD', () => {
      walletService.setBalance(touristUser.id, 500);
      const trip = taxiService.requestTrip(touristUser, {
        origen: origenCICI,
        destino: destinoRonnie,
        precioMXN: 200,
      });
      taxiService.acceptTrip(marioTorresDriver, trip.id);

      const completed = taxiService.completeTrip(marioTorresDriver, trip.id);
      expect(completed.estado).toBe('completado');
      expect(completed.completedAt).toBeDefined();

      const completeLogs = getOddLogs('trip.completed');
      expect(completeLogs.length).toBe(1);
      expect(completeLogs[0].payload.tripId).toBe(trip.id);
    });

    test('cancelar viaje antes de ser aceptado reembolsa el 100% al turista', () => {
      walletService.setBalance(touristUser.id, 500);
      const trip = taxiService.requestTrip(touristUser, {
        origen: origenCICI,
        destino: destinoRonnie,
        precioMXN: 200,
      });

      expect(walletService.getBalance(touristUser.id)).toBe(300);

      const cancelled = taxiService.cancelTrip(touristUser, trip.id, 'Cambio de planes');
      expect(cancelled.estado).toBe('cancelado');

      // Reembolso completo
      expect(walletService.getBalance(touristUser.id)).toBe(500);

      const cancelLogs = getOddLogs('trip.cancelled');
      expect(cancelLogs.length).toBe(1);
      expect(cancelLogs[0].payload.tripId).toBe(trip.id);
      expect(cancelLogs[0].payload.motivo).toBe('Cambio de planes');
    });
  });
});
