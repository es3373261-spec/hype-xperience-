import { CatalogManager } from '../catalog/CatalogManager';
import {
  CatalogCategory,
  CategoryStatus,
  CentroConsumo,
  Provider,
  Service,
  CATALOG_CATEGORIES,
  CENTROS_CONSUMO,
} from '../types/catalog';
import { User } from '../types/user';
import { initializeFirebase } from '../firebase/config';

describe('T-03: Dynamic Catalog & Provider Onboarding (spec §3, §5, §5b, §7, §12, §14 Q2)', () => {
  let catalog: CatalogManager;

  const adminUser: User = {
    id: 'admin-01',
    nombre: 'Admin Hype',
    email: 'admin@hype.com',
    telefono: '7441112233',
    rol: 'admin_hype',
    tema: 'oscuro',
    bank: { clabeLast4: '0000', titular: 'Admin Hype' },
  };

  const rulosUser: User = {
    id: 'user-rulos',
    nombre: "Raul Rulo's",
    email: 'rulos@mariscos.com',
    telefono: '7442223344',
    rol: 'alimentos_bebidas',
    tema: 'oscuro',
    bank: { clabeLast4: '1111', titular: 'Raul Rulos' },
  };

  const oneByProUser: User = {
    id: 'user-onebypro',
    nombre: 'Pedro One By Pro',
    email: 'onebypro@hype.com',
    telefono: '7443334455',
    rol: 'xperience',
    tema: 'oscuro',
    bank: { clabeLast4: '2222', titular: 'Pedro Xperience' },
  };

  const touristUser: User = {
    id: 'user-tourist',
    nombre: 'Carlos Turista',
    email: 'carlos@turista.com',
    telefono: '7444445566',
    rol: 'turista',
    tema: 'oscuro',
    bank: { clabeLast4: '3333', titular: 'Carlos Turista' },
  };

  beforeEach(() => {
    initializeFirebase({ useMocks: true });
    catalog = new CatalogManager();
  });

  describe('Taxonomía y Categorías (§5, §5b)', () => {
    it('define exactamente las 7 categorías de catálogo y los 4 centros de consumo', () => {
      const expectedCategories: CatalogCategory[] = [
        'Tours',
        'Restaurantes',
        'Eventos',
        'Taxi',
        'Playa',
        'Club',
        'Hotel',
      ];
      expect(CATALOG_CATEGORIES).toHaveLength(7);
      expect(CATALOG_CATEGORIES).toEqual(expect.arrayContaining(expectedCategories));

      const expectedCentros: CentroConsumo[] = [
        'alimentos_bebidas',
        'transportacion',
        'alojamiento',
        'xperience',
      ];
      expect(CENTROS_CONSUMO).toHaveLength(4);
      expect(CENTROS_CONSUMO).toEqual(expect.arrayContaining(expectedCentros));
    });

    it('Clasificación (§5b): servicio de un solo tipo va a su centro; paquete de 2+ centros es Xperience', () => {
      // 1 solo tipo: Alimentos y bebidas
      const singleMeal = catalog.classifyService({
        categoria: 'Restaurantes',
        centrosIncluidos: ['alimentos_bebidas'],
      });
      expect(singleMeal).toBe('alimentos_bebidas');

      // 1 solo tipo: Transportación
      const singleTaxi = catalog.classifyService({
        categoria: 'Taxi',
        centrosIncluidos: ['transportacion'],
      });
      expect(singleTaxi).toBe('transportacion');

      // Evento especial o tour -> Xperience
      const tourService = catalog.classifyService({
        categoria: 'Tours',
        isSpecialEventOrTour: true,
      });
      expect(tourService).toBe('xperience');

      // Paquete que combina 2 o más centros de consumo -> Xperience
      const packageService = catalog.classifyService({
        categoria: 'Tours',
        centrosIncluidos: ['alojamiento', 'transportacion', 'alimentos_bebidas'],
      });
      expect(packageService).toBe('xperience');
    });

    it('Reseñas (§5b): se miden con símbolo de fuego 🔥 y no con estrellas ⭐', () => {
      const reviewText = catalog.formatRating(4);
      expect(reviewText).toBe('🔥🔥🔥🔥');
      expect(reviewText).not.toContain('⭐');
      expect(reviewText).not.toContain('★');
    });
  });

  describe('Dynamic Catalog & Category Toggles (§5)', () => {
    it('Toggle prohibido por test: encender una categoría sin proveedores activos es rechazado con error', () => {
      // Hotel no tiene proveedores activos en el inicio
      expect(() => {
        catalog.setCategoryStatus(adminUser, 'Hotel', 'activa');
      }).toThrow(/sin al menos un proveedor activo/i);
    });

    it('Admin conserva la opción de poner en prospección una categoría sin proveedores activos', () => {
      catalog.setCategoryStatus(adminUser, 'Hotel', 'en_prospeccion');
      expect(catalog.getCategoryStatus('Hotel')).toBe('en_prospeccion');

      catalog.setCategoryStatus(adminUser, 'Hotel', 'oculta');
      expect(catalog.getCategoryStatus('Hotel')).toBe('oculta');
    });

    it('T02: dada categoría Hotel sin proveedor activo, NO aparece en el Feed del turista', () => {
      // Configuramos Hotel como 'en_prospeccion'
      catalog.setCategoryStatus(adminUser, 'Hotel', 'en_prospeccion');

      const touristCategories = catalog.getActiveCategoriesForTourist();
      expect(touristCategories).not.toContain('Hotel');

      const touristFeed = catalog.getTouristFeed();
      const hasHotel = touristFeed.some((item) => item.service.categoría === 'Hotel');
      expect(hasHotel).toBe(false);
    });

    it('T09: dado catálogo sin hotel, Aura Concierge NO recomienda hoteles', () => {
      const recommendations = catalog.recommendConciergeServices('Hotel');
      expect(recommendations).toHaveLength(0);
      expect(catalog.canConciergeRecommend('Hotel')).toBe(false);
    });
  });

  describe('Provider Onboarding & Service Management (§3, §5, §7)', () => {
    it('Onboarding por Admin Hype: crea proveedor activo y permite activar su categoría', () => {
      const provider = catalog.onboardProvider(adminUser, {
        userId: rulosUser.id,
        tipo: 'alimentos_bebidas',
        nombre: "Mariscos Rulo's",
        descripción: 'Restaurante Bar en la playa, en el acceso del CICI Acapulco',
        fotos: ['https://hype.app/photos/rulos.jpg'],
        activo: true,
      });

      expect(provider.id).toBeDefined();
      expect(provider.activo).toBe(true);

      // Con proveedor activo en Restaurantes, ahora sí se puede activar la categoría
      catalog.setCategoryStatus(adminUser, 'Restaurantes', 'activa');
      expect(catalog.getCategoryStatus('Restaurantes')).toBe('activa');
    });

    it('Dada desactivación de un proveedor, sus servicios no se muestran en el Feed del turista', () => {
      const provider = catalog.onboardProvider(adminUser, {
        userId: rulosUser.id,
        tipo: 'alimentos_bebidas',
        nombre: "Mariscos Rulo's",
        descripción: 'Restaurante Bar',
        fotos: ['https://hype.app/photos/rulos.jpg'],
        activo: true,
      });

      catalog.setCategoryStatus(adminUser, 'Restaurantes', 'activa');

      const service = catalog.createService(rulosUser, {
        providerId: provider.id,
        categoría: 'Restaurantes',
        título: 'Ceviche de pez vela',
        precioMXN: 250,
        cupo: 50,
        horario: '10:00 - 19:00',
        fotos: ['https://hype.app/photos/ceviche.jpg'],
        activo: true,
      });

      // El servicio aparece en el feed del turista
      let feed = catalog.getTouristFeed();
      expect(feed.map((f) => f.service.id)).toContain(service.id);

      // Desactivamos el proveedor
      catalog.updateProvider(adminUser, provider.id, { activo: false });

      // Ahora ya no debe aparecer en el feed
      feed = catalog.getTouristFeed();
      expect(feed.map((f) => f.service.id)).not.toContain(service.id);
    });

    it('Aislamiento de proveedores: un prestador solo puede ver y editar su propio catálogo', () => {
      const providerRulos = catalog.onboardProvider(adminUser, {
        userId: rulosUser.id,
        tipo: 'alimentos_bebidas',
        nombre: "Mariscos Rulo's",
        descripción: 'Restaurante',
        fotos: [],
        activo: true,
      });

      const providerOneByPro = catalog.onboardProvider(adminUser, {
        userId: oneByProUser.id,
        tipo: 'xperience',
        nombre: 'One By Pro',
        descripción: 'Productora',
        fotos: [],
        activo: true,
      });

      const serviceRulos = catalog.createService(rulosUser, {
        providerId: providerRulos.id,
        categoría: 'Restaurantes',
        título: 'Papas a la francesa',
        precioMXN: 150,
        fotos: [],
        activo: true,
      });

      // Rulos ve su catálogo
      const rulosCatalog = catalog.getProviderServices(rulosUser, providerRulos.id);
      expect(rulosCatalog.map((s) => s.id)).toContain(serviceRulos.id);

      // OneByPro NO puede editar el servicio de Rulos
      expect(() => {
        catalog.updateService(oneByProUser, serviceRulos.id, { precioMXN: 999 });
      }).toThrow(/no autorizado/i);

      // Turista no puede crear servicios ni acceder a panel de edición
      expect(() => {
        catalog.createService(touristUser, {
          providerId: providerRulos.id,
          categoría: 'Restaurantes',
          título: 'Servicio falso',
          precioMXN: 100,
          fotos: [],
          activo: true,
        });
      }).toThrow(/no autorizado/i);
    });
  });

  describe('Seed de Pilotos Reales (§14 Q2, providers/mariscos-rulos-menu.md, §5d)', () => {
    it('Siembra exactamente a Mariscos Rulos y One By Pro con datos reales y precios reales', () => {
      catalog.seedPilotProviders({
        rulosUserId: rulosUser.id,
        oneByProUserId: oneByProUser.id,
      });

      // Validar Mariscos Rulo's
      const rulos = catalog.getProviderByName("Mariscos Rulo's");
      expect(rulos).toBeDefined();
      expect(rulos?.tipo).toBe('alimentos_bebidas');
      expect(rulos?.activo).toBe(true);

      const rulosServices = catalog.getServicesByProviderId(rulos!.id);
      expect(rulosServices.length).toBeGreaterThanOrEqual(3);

      const ceviche = rulosServices.find((s) => s.título === 'Ceviche de pez vela');
      expect(ceviche).toBeDefined();
      expect(ceviche?.precioMXN).toBe(250);

      const mariscada = rulosServices.find((s) => s.título === 'Mariscada Grande');
      expect(mariscada).toBeDefined();
      expect(mariscada?.precioMXN).toBe(1700);

      // Validar One By Pro (§5d: Ronnie Acapulco 14 y 15 nov 2026, $350 cover)
      const oneByPro = catalog.getProviderByName('One By Pro');
      expect(oneByPro).toBeDefined();
      expect(oneByPro?.tipo).toBe('xperience');
      expect(oneByPro?.activo).toBe(true);

      const obpServices = catalog.getServicesByProviderId(oneByPro!.id);
      const ronnieEvent = obpServices.find((s) => s.título.includes('Ronnie Acapulco'));
      expect(ronnieEvent).toBeDefined();
      expect(ronnieEvent?.precioMXN).toBe(350);
      expect(ronnieEvent?.horario).toMatch(/14.*15.*noviembre.*2026/i);
    });
  });
});
