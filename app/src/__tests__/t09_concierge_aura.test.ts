import { ConciergeAuraService } from '../concierge/ConciergeAuraService';
import { CatalogManager } from '../catalog/CatalogManager';
import { User } from '../types/user';
import { Service } from '../types/catalog';
import { initializeFirebase } from '../firebase/config';
import { clearOddLogs, getOddLogs } from '../observability/oddLogger';

describe('T-09: Concierge Aura solo con catálogo real (spec §2, §4 F5, §5b, §5c, §6, §10 T09, §11, §12)', () => {
  let catalog: CatalogManager;
  let concierge: ConciergeAuraService;

  const touristUser: User = {
    id: 'u-tourist-sofia',
    nombre: 'Sofía Turista',
    email: 'sofia@hype.com',
    telefono: '+527441239876',
    rol: 'turista',
    tema: 'oscuro',
    bank: { clabeLast4: '4321', titular: 'Sofía Turista' },
  };

  const adminUser: User = {
    id: 'u-admin-hype',
    nombre: 'Pedro Admin',
    email: 'admin@hype.com',
    telefono: '+527440000000',
    rol: 'admin_hype',
    tema: 'oscuro',
    bank: { clabeLast4: '0000', titular: 'Admin Hype' },
  };

  const providerRulosUser: User = {
    id: 'u-rulos',
    nombre: 'Rulo Mariscos',
    email: 'rulos@hype.com',
    telefono: '+527441112222',
    rol: 'alimentos_bebidas',
    tema: 'oscuro',
    bank: { clabeLast4: '1111', titular: 'Rulo Mariscos' },
  };

  const providerOneByProUser: User = {
    id: 'u-onebypro',
    nombre: 'One By Pro',
    email: 'onebypro@hype.com',
    telefono: '+527443334444',
    rol: 'xperience',
    tema: 'oscuro',
    bank: { clabeLast4: '2222', titular: 'One By Pro' },
  };

  beforeEach(() => {
    initializeFirebase({ useMocks: true });
    clearOddLogs();
    catalog = new CatalogManager();
    catalog.seedPilotProviders({
      rulosUserId: providerRulosUser.id,
      oneByProUserId: providerOneByProUser.id,
    });
    concierge = new ConciergeAuraService(catalog);
  });

  describe('1. Criterio T09: Catálogo sin hotel — no recomienda hoteles y escala a host humano (spec §4 F5, §10 T09, §11)', () => {
    test('T09 Concierge: dado catálogo sin hotel activo, Aura NO recomienda hoteles, avisa al turista, escala a host humano y emite concierge.no_service_found', () => {
      // Verificamos que Hotel no está activo en el catálogo piloto
      expect(catalog.getCategoryStatus('Hotel')).not.toBe('activa');

      const response = concierge.askAura(touristUser, 'Hola Aura, busco reservar un hotel frente al mar para este fin de semana');

      // No recomienda ningún hotel ni inventa servicios
      expect(response.recommendedServices).toHaveLength(0);
      expect(response.recommendedServices.some((s) => s.categoría === 'Hotel')).toBe(false);

      // Escala a host humano según spec §4 F5
      expect(response.escalatedToHumanHost).toBe(true);
      expect(response.humanHostContact).toBeDefined();
      expect(response.reply).toContain('Sofía Turista');
      expect(response.reply.toLowerCase()).toContain('host humano');

      // Log ODD obligatorio: concierge.no_service_found (spec §11)
      const noServiceLogs = getOddLogs('concierge.no_service_found');
      expect(noServiceLogs.length).toBe(1);
      expect(noServiceLogs[0].payload.userId).toBe(touristUser.id);
      expect(noServiceLogs[0].payload.requestedCategory).toBe('Hotel');
      expect(noServiceLogs[0].payload.escalatedToHumanHost).toBe(true);
    });

    test('si el turista pide una actividad sin proveedor activo (ej. buceo o paracaídas), no la inventa y escala a host humano', () => {
      const response = concierge.askAura(touristUser, 'Quiero reservar salto en paracaídas hoy');

      expect(response.recommendedServices).toHaveLength(0);
      expect(response.escalatedToHumanHost).toBe(true);

      const noServiceLogs = getOddLogs('concierge.no_service_found');
      expect(noServiceLogs.length).toBe(1);
    });
  });

  describe('2. Recomendaciones Reales del Catálogo Activo y Perfil del Turista (spec §4 F5, §14 Q2)', () => {
    test('recomienda platillos reales de Mariscos Rulo\'s con precios exactos del catálogo cuando pide mariscos o restaurante', () => {
      const response = concierge.askAura(touristUser, 'Quiero comer mariscos o un ceviche en la playa');

      expect(response.escalatedToHumanHost).toBe(false);
      expect(response.recommendedServices.length).toBeGreaterThan(0);

      // Personalizado con datos del perfil del turista (spec §4 F5)
      expect(response.reply).toContain('Sofía Turista');

      // Todos los servicios recomendados existen en el catálogo activo con el mismo precio y cupo
      for (const rec of response.recommendedServices) {
        const realService = catalog.getServiceById(rec.id);
        expect(realService).not.toBeNull();
        expect(realService?.activo).toBe(true);
        expect(rec.precioMXN).toBe(realService?.precioMXN);
        expect(rec.cupo).toBe(realService?.cupo);
        expect(rec.categoría).toBe('Restaurantes');
      }

      expect(
        response.recommendedServices.some((s) => s.título === 'Ceviche de pez vela' && s.precioMXN === 250)
      ).toBe(true);
    });

    test('recomienda eventos reales de One By Pro ($350 cover, 14 y 15 nov 2026) cuando pregunta por eventos o fiesta', () => {
      const response = concierge.askAura(touristUser, '¿Qué eventos o fiestas hay este fin de semana en Ronnie?');

      expect(response.escalatedToHumanHost).toBe(false);
      expect(response.recommendedServices.length).toBeGreaterThan(0);
      expect(
        response.recommendedServices.every((s) => s.categoría === 'Eventos' && s.precioMXN === 350)
      ).toBe(true);
    });

    test('respeta requerimiento de presupuesto máximo del turista sin inventar descuentos ni precios', () => {
      const response = concierge.askAura(touristUser, 'Quiero comer en restaurante', {
        maxPriceMXN: 260,
      });

      expect(response.recommendedServices.length).toBeGreaterThan(0);
      expect(response.recommendedServices.every((s) => s.precioMXN <= 260)).toBe(true);
    });

    test('si un proveedor se desactiva en el catálogo, Aura deja inmediatamente de recomendar sus servicios', () => {
      const rulosProvider = catalog.getProviderByName("Mariscos Rulo's")!;
      catalog.updateProvider(adminUser, rulosProvider.id, { activo: false });

      const response = concierge.askAura(touristUser, 'Quiero comer mariscos en restaurante');

      expect(response.recommendedServices).toHaveLength(0);
      expect(response.escalatedToHumanHost).toBe(true);
    });
  });

  describe('3. Guardrail Anti-Alucinación: prohibido inventar servicios, precios o disponibilidad (spec §4 F5, §11)', () => {
    test('bloquea y emite alerta si se intenta validar un servicio inventado que no existe en el catálogo', () => {
      const fakeService: Service = {
        id: 'serv_inventado_999',
        providerId: 'prov_fantasma',
        categoría: 'Hotel',
        centroConsumo: 'alojamiento',
        título: 'Hotel Fantasma VIP Acapulco',
        precioMXN: 9999,
        cupo: 10,
        horario: '24 hrs',
        fotos: [],
        activo: true,
      };

      expect(() => {
        concierge.validateRecommendationsAgainstCatalog([fakeService]);
      }).toThrow('Error de Concierge: intento de recomendar un servicio inexistente o inactivo');

      const alertLogs = getOddLogs('concierge.hallucination_blocked');
      expect(alertLogs.length).toBe(1);
      expect(alertLogs[0].payload.serviceId).toBe('serv_inventado_999');
    });

    test('bloquea y emite alerta si un servicio recomendado tiene el precio o cupo alterado respecto al catálogo real', () => {
      const realService = catalog.getAllActiveServices()[0];
      const tamperedService: Service = {
        ...realService,
        precioMXN: realService.precioMXN - 100, // Precio alterado / inventado
      };

      expect(() => {
        concierge.validateRecommendationsAgainstCatalog([tamperedService]);
      }).toThrow('Error de Concierge: el precio o disponibilidad no coincide con el catálogo real');

      const alertLogs = getOddLogs('concierge.hallucination_blocked');
      expect(alertLogs.length).toBe(1);
      expect(alertLogs[0].payload.reason).toBe('price_or_availability_mismatch');
    });
  });

  describe('4. Armado de Paquetes Xperience combinando 2+ Centros de Consumo (spec §5b)', () => {
    test('arma una experiencia Xperience combinando servicios reales de 2+ centros de consumo activos', () => {
      const pkg = concierge.buildXperiencePackage(touristUser, [
        'alimentos_bebidas',
        'xperience',
      ]);

      expect(pkg).not.toBeNull();
      expect(pkg!.classification).toBe('xperience');
      expect(pkg!.centrosIncluidos.length).toBeGreaterThanOrEqual(2);
      expect(pkg!.services.length).toBe(2);

      // El precio total es la suma exacta de los precios reales del catálogo
      const expectedTotal = pkg!.services.reduce((acc, s) => acc + s.precioMXN, 0);
      expect(pkg!.totalPrecioMXN).toBe(expectedTotal);
    });
  });

  describe('5. Navegación Flotante del Turista y Diseño "Hype Night" (spec §2, §5c, §6)', () => {
    test('solo para el rol Turista la barra inferior es la caja de texto del Concierge AI con botones flotantes sobre el Feed', () => {
      const touristNav = concierge.getBottomBarConfig(touristUser);
      expect(touristNav.isConciergeTextBox).toBe(true);
      expect(touristNav.floatsOverFeed).toBe(true);
      expect(touristNav.changesScreenOnExpand).toBe(false);
      expect(touristNav.leftButtons).toEqual(['Feed', 'Explorar', 'Tickets', 'Calendario']);
      expect(touristNav.topRightButtons).toEqual(['Taxi', 'Wallet']);
      expect(touristNav.taxiButtonIcon).toBe('icon/bocho-taxi-silhouette.png');
      expect(touristNav.theme.background).toBe('#000000');
      expect(touristNav.theme.accentGold).toBe('#d4af37');
      expect(touristNav.theme.fontFamily).toBe('Montserrat');

      // Los demás roles conservan su barra inferior flotante normal (spec §2, §5c)
      const providerNav = concierge.getBottomBarConfig(providerRulosUser);
      expect(providerNav.isConciergeTextBox).toBe(false);
    });
  });
});
