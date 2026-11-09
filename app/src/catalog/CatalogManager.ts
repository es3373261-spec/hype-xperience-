import {
  CatalogCategory,
  CategoryStatus,
  CentroConsumo,
  Provider,
  Service,
  CATALOG_CATEGORIES,
} from '../types/catalog';
import { User } from '../types/user';
import { getFirebaseInstance } from '../firebase/config';

export class CatalogManager {
  private providers: Map<string, Provider> = new Map();
  private services: Map<string, Service> = new Map();
  private categoryStatuses: Map<CatalogCategory, CategoryStatus> = new Map();
  private nextId = 1;

  constructor() {
    // Inicializar estado de las 7 categorías: por defecto 'oculta'
    for (const cat of CATALOG_CATEGORIES) {
      this.categoryStatuses.set(cat, 'oculta');
    }
  }

  // Mapeo entre categoría y su centro de consumo base
  static getCategoryDefaultCentro(cat: CatalogCategory): CentroConsumo {
    switch (cat) {
      case 'Restaurantes':
      case 'Club':
        return 'alimentos_bebidas';
      case 'Taxi':
        return 'transportacion';
      case 'Hotel':
        return 'alojamiento';
      case 'Tours':
      case 'Eventos':
      case 'Playa':
        return 'xperience';
    }
  }

  // Regla de clasificación (§5b)
  classifyService(params: {
    categoria?: CatalogCategory;
    centrosIncluidos?: CentroConsumo[];
    isSpecialEventOrTour?: boolean;
  }): CentroConsumo {
    // Si combina 2 o más tipos de centro de consumo -> Xperience
    if (params.centrosIncluidos && params.centrosIncluidos.length >= 2) {
      return 'xperience';
    }

    // Si es un evento o tour especial -> Xperience
    if (
      params.isSpecialEventOrTour ||
      params.categoria === 'Tours' ||
      params.categoria === 'Eventos' ||
      params.categoria === 'Playa'
    ) {
      return 'xperience';
    }

    if (params.categoria) {
      return CatalogManager.getCategoryDefaultCentro(params.categoria);
    }

    if (params.centrosIncluidos && params.centrosIncluidos.length === 1) {
      return params.centrosIncluidos[0];
    }

    return 'alimentos_bebidas';
  }

  // Reseñas en fuegos 🔥 (§5b)
  formatRating(rating: number): string {
    const clamped = Math.max(1, Math.min(5, Math.round(rating)));
    return '🔥'.repeat(clamped);
  }

  // Onboarding de prestador por Admin Hype (§3, §5, §7)
  onboardProvider(adminUser: User, data: Omit<Provider, 'id'>): Provider {
    if (adminUser.rol !== 'admin_hype') {
      throw new Error('No autorizado: solo Admin Hype puede realizar onboarding de proveedores');
    }

    const id = `prov_${Date.now()}_${this.nextId++}`;
    const newProvider: Provider = {
      id,
      ...data,
    };

    this.providers.set(id, newProvider);

    const fb = getFirebaseInstance();
    fb.firestore.collection('providers').doc(id).set(newProvider);

    return newProvider;
  }

  updateProvider(user: User, providerId: string, updates: Partial<Provider>): Provider {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Proveedor no encontrado: ${providerId}`);
    }

    if (user.rol !== 'admin_hype' && provider.userId !== user.id) {
      throw new Error('No autorizado: no tienes permisos para editar este proveedor');
    }

    const updated: Provider = {
      ...provider,
      ...updates,
      id: provider.id, // ID inmutable
    };

    this.providers.set(providerId, updated);
    const fb = getFirebaseInstance();
    fb.firestore.collection('providers').doc(providerId).set(updated);

    return updated;
  }

  getProviderById(id: string): Provider | null {
    return this.providers.get(id) || null;
  }

  getProviderByName(nombre: string): Provider | null {
    for (const p of this.providers.values()) {
      if (p.nombre.toLowerCase() === nombre.toLowerCase()) {
        return p;
      }
    }
    return null;
  }

  getServiceById(id: string): Service | null {
    return this.services.get(id) || null;
  }

  getAllActiveServices(): Service[] {
    return Array.from(this.services.values()).filter((s) => s.activo);
  }

  getServicesByProviderId(providerId: string): Service[] {
    return Array.from(this.services.values()).filter((s) => s.providerId === providerId);
  }

  getProviderServices(user: User, providerId: string): Service[] {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Proveedor no encontrado: ${providerId}`);
    }

    if (user.rol !== 'admin_hype' && provider.userId !== user.id) {
      throw new Error('No autorizado: un prestador solo puede ver su propio catálogo');
    }

    return this.getServicesByProviderId(providerId);
  }

  // Crear servicio por el prestador o Admin
  createService(
    user: User,
    data: Omit<Service, 'id' | 'centroConsumo'> & { centroConsumo?: CentroConsumo }
  ): Service {
    const provider = this.providers.get(data.providerId);
    if (!provider) {
      throw new Error(`Proveedor no encontrado: ${data.providerId}`);
    }

    if (user.rol !== 'admin_hype' && provider.userId !== user.id) {
      throw new Error('No autorizado: no puedes agregar servicios al catálogo de otro proveedor');
    }

    const centroConsumo =
      data.centroConsumo ||
      this.classifyService({
        categoria: data.categoría,
        centrosIncluidos: data.centrosIncluidos,
      });

    const id = `serv_${Date.now()}_${this.nextId++}`;
    const newService: Service = {
      ...data,
      id,
      centroConsumo,
    };

    this.services.set(id, newService);

    const fb = getFirebaseInstance();
    fb.firestore.collection('services').doc(id).set(newService);

    return newService;
  }

  updateService(user: User, serviceId: string, updates: Partial<Service>): Service {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Servicio no encontrado: ${serviceId}`);
    }

    const provider = this.providers.get(service.providerId);
    if (!provider) {
      throw new Error(`Proveedor del servicio no encontrado: ${service.providerId}`);
    }

    if (user.rol !== 'admin_hype' && provider.userId !== user.id) {
      throw new Error('No autorizado: no tienes permisos para editar este servicio');
    }

    const updated: Service = {
      ...service,
      ...updates,
      id: service.id,
      providerId: service.providerId,
    };

    this.services.set(serviceId, updated);
    const fb = getFirebaseInstance();
    fb.firestore.collection('services').doc(serviceId).set(updated);

    return updated;
  }

  // Catálogo dinámico: control de estado de categoría (§5)
  setCategoryStatus(adminUser: User, category: CatalogCategory, status: CategoryStatus): void {
    if (adminUser.rol !== 'admin_hype') {
      throw new Error('No autorizado: solo Admin Hype puede cambiar el estado de las categorías');
    }

    if (status === 'activa') {
      // Regla de oro (§5): Encender una categoría sin proveedores activos está prohibido por test.
      const hasActive = this.hasActiveProviderForCategory(category);
      if (!hasActive) {
        throw new Error(
          `No se puede activar la categoría '${category}' sin al menos un proveedor activo.`
        );
      }
    }

    this.categoryStatuses.set(category, status);
  }

  getCategoryStatus(category: CatalogCategory): CategoryStatus {
    return this.categoryStatuses.get(category) || 'oculta';
  }

  hasActiveProviderForCategory(category: CatalogCategory): boolean {
    const defaultCentro = CatalogManager.getCategoryDefaultCentro(category);

    for (const provider of this.providers.values()) {
      if (provider.activo) {
        if (provider.tipo === defaultCentro) {
          return true;
        }
        // O si el proveedor tiene servicios activos asignados a esa categoría
        const providerServices = this.getServicesByProviderId(provider.id);
        const hasServiceInCat = providerServices.some(
          (s) => s.activo && s.categoría === category
        );
        if (hasServiceInCat) {
          return true;
        }
      }
    }
    return false;
  }

  getActiveCategoriesForTourist(): CatalogCategory[] {
    const active: CatalogCategory[] = [];
    for (const [category, status] of this.categoryStatuses.entries()) {
      if (status === 'activa' && this.hasActiveProviderForCategory(category)) {
        active.push(category);
      }
    }
    return active;
  }

  // Feed del turista (§5, §5b): solo categorías activas y servicios activos de proveedores activos
  getTouristFeed(filters?: {
    category?: CatalogCategory;
    centro?: CentroConsumo;
  }): Array<{ service: Service; provider: Provider }> {
    const feed: Array<{ service: Service; provider: Provider }> = [];

    for (const service of this.services.values()) {
      if (!service.activo) continue;

      const provider = this.providers.get(service.providerId);
      if (!provider || !provider.activo) continue;

      const catStatus = this.getCategoryStatus(service.categoría);
      if (catStatus !== 'activa') continue;

      if (filters?.category && service.categoría !== filters.category) {
        continue;
      }

      if (filters?.centro && service.centroConsumo !== filters.centro) {
        continue;
      }

      feed.push({ service, provider });
    }

    return feed;
  }

  // Recomendaciones Concierge Aura (§5, §10 T09): solo recomienda de catálogo activo real
  recommendConciergeServices(category: CatalogCategory): Service[] {
    const feedItems = this.getTouristFeed({ category });
    return feedItems.map((item) => item.service);
  }

  canConciergeRecommend(category: CatalogCategory): boolean {
    const services = this.recommendConciergeServices(category);
    return services.length > 0;
  }

  // Semilla de pilotos reales (§14 Q2, providers/mariscos-rulos-menu.md, §5d)
  seedPilotProviders(options: { rulosUserId: string; oneByProUserId: string }): void {
    const adminDummy: User = {
      id: 'admin_seed',
      nombre: 'Admin System',
      email: 'system@hype.com',
      telefono: '0000000000',
      rol: 'admin_hype',
      tema: 'oscuro',
      bank: { clabeLast4: '0000', titular: 'System' },
    };

    // 1. Piloto Alimentos y Bebidas: Mariscos Rulo's
    const rulos = this.onboardProvider(adminDummy, {
      userId: options.rulosUserId,
      tipo: 'alimentos_bebidas',
      nombre: "Mariscos Rulo's",
      descripción:
        'Restaurante Bar en la playa, en el acceso del CICI Acapulco (Privada Fragata Endeveur, Fracc. Costa Azul)',
      fotos: ['assets/rulos_beach.jpg'],
      activo: true,
    });

    const rulosServices = [
      {
        título: 'Ceviche de pez vela',
        precioMXN: 250,
        categoría: 'Restaurantes' as CatalogCategory,
        cupo: 40,
        horario: '10:00 - 19:00',
        fotos: ['assets/ceviche_vela.jpg'],
      },
      {
        título: 'Coctel de camarón o caracol',
        precioMXN: 280,
        categoría: 'Restaurantes' as CatalogCategory,
        cupo: 40,
        horario: '10:00 - 19:00',
        fotos: ['assets/coctel_camaron.jpg'],
      },
      {
        título: 'Camarones al aguachile',
        precioMXN: 400,
        categoría: 'Restaurantes' as CatalogCategory,
        cupo: 30,
        horario: '10:00 - 19:00',
        fotos: ['assets/aguachile.jpg'],
      },
      {
        título: 'Mojarra Grande (al ajo o frita)',
        precioMXN: 350,
        categoría: 'Restaurantes' as CatalogCategory,
        cupo: 30,
        horario: '10:00 - 19:00',
        fotos: ['assets/mojarra.jpg'],
      },
      {
        título: 'Mariscada Grande',
        precioMXN: 1700,
        categoría: 'Restaurantes' as CatalogCategory,
        cupo: 15,
        horario: '10:00 - 19:00',
        fotos: ['assets/mariscada.jpg'],
      },
      {
        título: 'Papas a la francesa',
        precioMXN: 150,
        categoría: 'Restaurantes' as CatalogCategory,
        cupo: 50,
        horario: '10:00 - 19:00',
        fotos: ['assets/papas.jpg'],
      },
    ];

    const rulosDummyUser: User = {
      id: options.rulosUserId,
      nombre: "Raul Rulo's",
      email: 'rulos@mariscos.com',
      telefono: '7442223344',
      rol: 'alimentos_bebidas',
      tema: 'oscuro',
      bank: { clabeLast4: '1111', titular: 'Raul Rulos' },
    };

    for (const s of rulosServices) {
      this.createService(rulosDummyUser, {
        providerId: rulos.id,
        título: s.título,
        precioMXN: s.precioMXN,
        categoría: s.categoría,
        cupo: s.cupo,
        horario: s.horario,
        fotos: s.fotos,
        activo: true,
      });
    }

    // 2. Piloto Xperience: One By Pro (Productora de eventos)
    const oneByPro = this.onboardProvider(adminDummy, {
      userId: options.oneByProUserId,
      tipo: 'xperience',
      nombre: 'One By Pro',
      descripción:
        'Productora de eventos y experiencias de Hype Xperience (eventos, festivales, mesas VIP)',
      fotos: ['marketing/flyer-ronnie-onebypro.png'],
      activo: true,
    });

    const oneByProDummyUser: User = {
      id: options.oneByProUserId,
      nombre: 'Pedro One By Pro',
      email: 'onebypro@hype.com',
      telefono: '7443334455',
      rol: 'xperience',
      tema: 'oscuro',
      bank: { clabeLast4: '2222', titular: 'Pedro Xperience' },
    };

    // Eventos 14 y 15 de noviembre de 2026 en Ronnie Acapulco ($350 cover)
    this.createService(oneByProDummyUser, {
      providerId: oneByPro.id,
      categoría: 'Eventos',
      título: 'Ronnie Acapulco — Evento Especial One By Pro',
      precioMXN: 350,
      cupo: 300,
      horario: 'Sábado 14 y domingo 15 de noviembre de 2026',
      fotos: ['marketing/flyer-ronnie-onebypro.png'],
      activo: true,
      centrosIncluidos: ['xperience', 'alimentos_bebidas'],
    });

    // Activar categorías con proveedores activos
    this.setCategoryStatus(adminDummy, 'Restaurantes', 'activa');
    this.setCategoryStatus(adminDummy, 'Eventos', 'activa');
  }
}
