import {
  Ally,
  AllyCategory,
  AllyPayoutConfig,
  AllyProfile,
  AllyVerticalConfig,
  CatalogCategory,
  CategoryStatus,
  CentroConsumo,
  Listing,
  ListingItineraryMoment,
  ListingPricedDate,
  Provider,
  Service,
  TransportTier,
  VenueMenuItem,
  VenueVerticalConfig,
  CATALOG_CATEGORIES,
} from '../types/catalog';
import { User, UserAccount } from '../types/user';
import { getFirebaseInstance } from '../firebase/config';
import { emitOddLog } from '../observability/oddLogger';

export const DEMO_PRESERVED_ANOMALIES = {
  alejandroValdesBalanceMxn: 52520,
} as const;

export const MARISCOS_RULOS_MENU_ITEMS: VenueMenuItem[] = [
  // Para picar (8)
  { id: 'rulos_01', category: 'Para picar', name: 'Ceviche de pez vela', price_mxn: 250, iva_included: true },
  { id: 'rulos_02', category: 'Para picar', name: 'Coctel de camarón o caracol', price_mxn: 280, iva_included: true },
  { id: 'rulos_03', category: 'Para picar', name: 'Campechana', price_mxn: 300, iva_included: true },
  { id: 'rulos_04', category: 'Para picar', name: 'Tiritas de pescado al aguachile', price_mxn: 270, iva_included: true },
  { id: 'rulos_05', category: 'Para picar', name: 'Camarones al aguachile', price_mxn: 400, iva_included: true },
  { id: 'rulos_06', category: 'Para picar', name: 'Tostadas de camarón', price_mxn: 280, iva_included: true },
  { id: 'rulos_07', category: 'Para picar', name: 'Totopos con guacamole (gourmet)', price_mxn: 180, iva_included: true },
  { id: 'rulos_08', category: 'Para picar', name: 'Papas a la francesa', price_mxn: 150, iva_included: true },
  // Desayunos (4)
  { id: 'rulos_09', category: 'Desayunos', name: 'Huevos al gusto (con frijoles y ensalada)', price_mxn: 200, iva_included: true },
  { id: 'rulos_10', category: 'Desayunos', name: 'Chilaquiles (pollo, cecina o huevo)', price_mxn: 250, iva_included: true },
  { id: 'rulos_11', category: 'Desayunos', name: 'Café (verde, rojo)', price_mxn: 60, iva_included: true },
  { id: 'rulos_12', category: 'Desayunos', name: 'Jugo de naranja', price_mxn: 100, iva_included: true },
  // Mariscos (16)
  { id: 'rulos_13', category: 'Mariscos', name: 'Mojarra Grande (al ajo o frita)', price_mxn: 350, iva_included: true },
  { id: 'rulos_14', category: 'Mariscos', name: 'Mojarra Grande (a la diabla)', price_mxn: 380, iva_included: true },
  { id: 'rulos_15', category: 'Mariscos', name: 'Mojarra Mediana (al ajo o frita)', price_mxn: 300, iva_included: true },
  { id: 'rulos_16', category: 'Mariscos', name: 'Mojarra Mediana (a la diabla)', price_mxn: 330, iva_included: true },
  { id: 'rulos_17', category: 'Mariscos', name: 'Filete de pescado', price_mxn: 250, iva_included: true },
  { id: 'rulos_18', category: 'Mariscos', name: 'Milanesa de pollo empanizada', price_mxn: 250, iva_included: true },
  { id: 'rulos_19', category: 'Mariscos', name: 'Camarones al gusto (12 pza.)', price_mxn: 360, iva_included: true },
  { id: 'rulos_20', category: 'Mariscos', name: 'Camarones rellenos (12 pza.)', price_mxn: 420, iva_included: true },
  { id: 'rulos_21', category: 'Mariscos', name: 'Mariscada Grande', price_mxn: 1700, iva_included: true },
  { id: 'rulos_22', category: 'Mariscos', name: 'Mariscada Mediana', price_mxn: 1400, iva_included: true },
  { id: 'rulos_23', category: 'Mariscos', name: 'Mariscada chica', price_mxn: 1000, iva_included: true },
  { id: 'rulos_24', category: 'Mariscos', name: 'Molcajete de Mariscos', price_mxn: 850, iva_included: true },
  { id: 'rulos_25', category: 'Mariscos', name: 'Pulpo al gusto', price_mxn: 370, iva_included: true },
  { id: 'rulos_26', category: 'Mariscos', name: 'Quesadillas de Camarón', price_mxn: 280, iva_included: true },
  { id: 'rulos_27', category: 'Mariscos', name: 'Sopes (3 pza.), pescadillas y quesadillas (4 pza.)', price_mxn: 140, iva_included: true },
  { id: 'rulos_28', category: 'Mariscos', name: 'Hamburguesa', price_mxn: 180, iva_included: true },
  // Bebidas (24 — 3 con needs_confirmation)
  { id: 'rulos_29', category: 'Bebidas', name: 'Agua 600 ml', price_mxn: 25, iva_included: true },
  { id: 'rulos_30', category: 'Bebidas', name: 'Agua 1 lt', price_mxn: 35, iva_included: true },
  { id: 'rulos_31', category: 'Bebidas', name: 'Agua 1 1/2 lt', price_mxn: 45, iva_included: true },
  { id: 'rulos_32', category: 'Bebidas', name: 'Soda 600 ml', price_mxn: 45, iva_included: true },
  { id: 'rulos_33', category: 'Bebidas', name: 'Coco Nat', price_mxn: 120, iva_included: true },
  { id: 'rulos_34', category: 'Bebidas', name: 'Coco Rulo', price_mxn: 180, iva_included: true },
  { id: 'rulos_35', category: 'Bebidas', name: 'Limonada y naranjada', price_mxn: 100, iva_included: true },
  { id: 'rulos_36', category: 'Bebidas', name: 'Conga', price_mxn: 120, iva_included: true, needs_confirmation: true },
  { id: 'rulos_37', category: 'Bebidas', name: 'Suero', price_mxn: 120, iva_included: true, needs_confirmation: true },
  { id: 'rulos_38', category: 'Bebidas', name: 'Piña colada Nat', price_mxn: 120, iva_included: true },
  { id: 'rulos_39', category: 'Bebidas', name: 'Piña colada Pre', price_mxn: 150, iva_included: true, needs_confirmation: true },
  { id: 'rulos_40', category: 'Bebidas', name: 'Media de seda', price_mxn: 150, iva_included: true },
  { id: 'rulos_41', category: 'Bebidas', name: 'Cuba', price_mxn: 150, iva_included: true },
  { id: 'rulos_42', category: 'Bebidas', name: 'Margarita', price_mxn: 150, iva_included: true },
  { id: 'rulos_43', category: 'Bebidas', name: 'Bull', price_mxn: 150, iva_included: true },
  { id: 'rulos_44', category: 'Bebidas', name: 'Sex on the beach', price_mxn: 150, iva_included: true },
  { id: 'rulos_45', category: 'Bebidas', name: 'Azulito', price_mxn: 200, iva_included: true },
  { id: 'rulos_46', category: 'Bebidas', name: 'Limonada brasileña', price_mxn: 200, iva_included: true },
  { id: 'rulos_47', category: 'Bebidas', name: 'Corona y Victoria de vidrio', price_mxn: 60, iva_included: true },
  { id: 'rulos_48', category: 'Bebidas', name: 'Latón Corona y Victoria', price_mxn: 70, iva_included: true },
  { id: 'rulos_49', category: 'Bebidas', name: 'Michelada, sal y limón', price_mxn: 130, iva_included: true },
  { id: 'rulos_50', category: 'Bebidas', name: 'Michelada cubana', price_mxn: 150, iva_included: true },
  { id: 'rulos_51', category: 'Bebidas', name: 'Cubetazo 6 cervezas', price_mxn: 270, iva_included: true },
  { id: 'rulos_52', category: 'Bebidas', name: 'Cubetazo 10 cervezas', price_mxn: 450, iva_included: true },
];

export interface AllyCommissionInfo {
  rate: number;
  netRate: number;
  isPromoActive: boolean;
  daysSinceActivation: number;
}

export function calculateAllyCommissionInfo(
  allyActivatedAt: string,
  referenceDate: Date = new Date()
): AllyCommissionInfo {
  const activatedMs = new Date(allyActivatedAt).getTime();
  const diffMs = Math.max(0, referenceDate.getTime() - activatedMs);
  const daysSinceActivation = diffMs / (1000 * 60 * 60 * 24);
  const isPromoActive = daysSinceActivation < 30;
  const rate = isPromoActive ? 0.05 : 0.1;
  return {
    rate,
    netRate: Number((1 - rate).toFixed(2)),
    isPromoActive,
    daysSinceActivation,
  };
}

export interface RegisterAllyInput {
  ally_category: AllyCategory;
  ally_subcategory: string;
  profile: AllyProfile;
  payout_config: AllyPayoutConfig;
  vertical_config: AllyVerticalConfig;
}

export interface CreateListingInput {
  allyId: string;
  category: AllyCategory;
  title: string;
  description: string;
  photos: string[];
  priceMxn: number;
  pricedDates?: ListingPricedDate[];
  itineraryMoments?: ListingItineraryMoment[];
}

export interface UpdateAllyOfferInput {
  profile?: Partial<AllyProfile>;
  priceMxn?: number;
  menu_items?: VenueMenuItem[];
}

const ALLY_TO_CATALOG_CATEGORY: Record<AllyCategory, CatalogCategory> = {
  venue: 'Restaurantes',
  tour: 'Tours',
  accommodation: 'Hotel',
  transport: 'Taxi',
};

export class CatalogManager {
  private providers: Map<string, Provider> = new Map();
  private services: Map<string, Service> = new Map();
  private categoryStatuses: Map<CatalogCategory, CategoryStatus> = new Map();
  private allies: Map<string, Ally> = new Map();
  private listings: Map<string, Listing> = new Map();
  private nextId = 1;

  constructor() {
    for (const cat of CATALOG_CATEGORIES) {
      this.categoryStatuses.set(cat, 'oculta');
    }
  }

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

  classifyService(params: {
    categoria?: CatalogCategory;
    centrosIncluidos?: CentroConsumo[];
    isSpecialEventOrTour?: boolean;
  }): CentroConsumo {
    if (params.centrosIncluidos && params.centrosIncluidos.length >= 2) {
      return 'xperience';
    }

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

  formatRating(rating: number): string {
    const clamped = Math.max(1, Math.min(5, Math.round(rating)));
    return '🔥'.repeat(clamped);
  }

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
      id: provider.id,
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

  setCategoryStatus(adminUser: User, category: CatalogCategory, status: CategoryStatus): void {
    if (adminUser.rol !== 'admin_hype') {
      throw new Error('No autorizado: solo Admin Hype puede cambiar el estado de las categorías');
    }

    if (status === 'activa') {
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
    const active = new Set<CatalogCategory>();
    for (const [category, status] of this.categoryStatuses.entries()) {
      if (status === 'activa' && this.hasActiveProviderForCategory(category)) {
        active.add(category);
      }
    }
    for (const ally of this.allies.values()) {
      if (ally.status === 'active') {
        active.add(ALLY_TO_CATALOG_CATEGORY[ally.ally_category]);
      }
    }
    return Array.from(active);
  }

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

  recommendConciergeServices(category: CatalogCategory): Service[] {
    const feedItems = this.getTouristFeed({ category });
    return feedItems.map((item) => item.service);
  }

  canConciergeRecommend(category: CatalogCategory): boolean {
    const services = this.recommendConciergeServices(category);
    return services.length > 0;
  }

  // --- Borrador v3 / Maestro v2.0 Allies, Verticals, Publication Gate & 24/7 Editor ---

  getVisibleCategories(): AllyCategory[] {
    const visible = new Set<AllyCategory>();
    for (const ally of this.allies.values()) {
      if (ally.status === 'active') {
        visible.add(ally.ally_category);
      }
    }
    return Array.from(visible);
  }

  getOnboardingSchema(vertical: AllyCategory): {
    vertical: AllyCategory;
    fields: string[];
    tierMultipliers?: Record<TransportTier, number>;
  } {
    switch (vertical) {
      case 'venue':
        return {
          vertical: 'venue',
          fields: [
            'menu_items',
            'supports_allergies_alert',
            'bar_360_bottles',
            'tables',
            'turns',
          ],
        };
      case 'tour':
        return {
          vertical: 'tour',
          fields: [
            'departure_dock',
            'schedule_slots',
            'capacity_per_slot',
            'operational_checklist',
          ],
        };
      case 'accommodation':
        return {
          vertical: 'accommodation',
          fields: ['price_per_night_mxn', 'check_in', 'check_out', 'aspectos'],
        };
      case 'transport':
        return {
          vertical: 'transport',
          fields: ['vehicle_tier', 'verification_photos'],
          tierMultipliers: {
            hype_go: 1.0,
            hype_confort: 1.25,
            hype_pro: 1.5,
          },
        };
    }
  }

  isBar360Visible(config: VenueVerticalConfig): boolean {
    return config.requires_mandatory_bottle === true;
  }

  validateVerticalConfig(
    vertical: AllyCategory,
    config: any
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (vertical === 'venue') {
      if (!config?.supports_allergies_alert) {
        errors.push('Venue requiere alerta de alergias activa (supports_allergies_alert)');
      }
      if (!Array.isArray(config?.menu_items) || config.menu_items.length === 0) {
        errors.push('Venue requiere al menos un platillo en menu_items');
      }
    } else if (vertical === 'tour') {
      if (!config?.departure_dock || String(config.departure_dock).trim() === '') {
        errors.push('Tour requiere muelle o punto de salida (departure_dock)');
      }
      if (!Array.isArray(config?.schedule_slots) || config.schedule_slots.length === 0) {
        errors.push('Tour requiere horarios disponibles (schedule_slots)');
      }
      if (typeof config?.capacity_per_slot !== 'number' || config.capacity_per_slot <= 0) {
        errors.push('Tour requiere capacidad por horario mayor a 0');
      }
      if (
        !Array.isArray(config?.operational_checklist) ||
        config.operational_checklist.length === 0
      ) {
        errors.push('Tour requiere checklist operativo (operational_checklist)');
      }
    } else if (vertical === 'accommodation') {
      if (typeof config?.price_per_night_mxn !== 'number' || config.price_per_night_mxn <= 0) {
        errors.push('Alojamiento requiere tarifa por noche mayor a 0');
      }
      if (!config?.check_in || !config?.check_out) {
        errors.push('Alojamiento requiere horarios de check-in y check-out');
      }
      if (Array.isArray(config?.aspectos) && config.aspectos.length > 2) {
        errors.push('Alojamiento permite máximo 2 aspectos destacados');
      }
    } else if (vertical === 'transport') {
      if (
        !Array.isArray(config?.verification_photos) ||
        config.verification_photos.length < 4
      ) {
        errors.push('Transporte requiere las 4 fotos obligatorias de verificación');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  canSelectTransportTier(tier: TransportTier, user: UserAccount): boolean {
    if (tier === 'hype_pro') {
      return user.concierge_access === true || user.is_vip === true;
    }
    return true;
  }

  async registerAlly(owner: UserAccount, input: RegisterAllyInput): Promise<Ally> {
    const allyId = `ally_${Date.now()}_${this.nextId++}`;
    const safePayout: AllyPayoutConfig = {
      payout_method: input.payout_config.payout_method,
      spei_clabe_last4: input.payout_config.spei_clabe_last4,
      spei_beneficiary_name: input.payout_config.spei_beneficiary_name,
      stripe_account_id: input.payout_config.stripe_account_id,
      pending_payout_balance_mxn: input.payout_config.pending_payout_balance_mxn || 0,
      driver_commission_pool_mxn: input.payout_config.driver_commission_pool_mxn || 0,
    };

    const ally: Ally = {
      allyId,
      owner_uid: owner.uid,
      status: 'pending_review',
      ally_category: input.ally_category,
      ally_subcategory: input.ally_subcategory,
      payout_config: safePayout,
      profile: input.profile,
      vertical_config: input.vertical_config,
      staff_uids: [],
    };

    this.allies.set(allyId, ally);
    const fb = getFirebaseInstance();
    await fb.firestore.collection('allies').doc(allyId).set(ally);

    emitOddLog({
      event: 'ally.created',
      actorUid: owner.uid,
      entityId: allyId,
      metadata: { category: ally.ally_category },
    });

    return ally;
  }

  async activateAlly(
    actor: UserAccount,
    allyId: string,
    activatedAtOverride?: string
  ): Promise<Ally> {
    if (!actor.concierge_access) {
      throw new Error('No autorizado: solo Concierge puede activar aliados');
    }

    const ally = this.allies.get(allyId);
    if (!ally) {
      throw new Error(`Aliado no encontrado: ${allyId}`);
    }

    const updated: Ally = {
      ...ally,
      status: 'active',
      ally_activated_at: activatedAtOverride || new Date().toISOString(),
    };

    this.allies.set(allyId, updated);
    const fb = getFirebaseInstance();
    await fb.firestore.collection('allies').doc(allyId).set(updated);

    emitOddLog({
      event: 'ally.activated',
      actorUid: actor.uid,
      entityId: allyId,
      metadata: { ally_activated_at: updated.ally_activated_at },
    });

    return updated;
  }

  getAllyByName(businessName: string): Ally | null {
    for (const ally of this.allies.values()) {
      if (ally.profile.business_name.toLowerCase() === businessName.toLowerCase()) {
        return ally;
      }
    }
    return null;
  }

  async createListing(owner: UserAccount, input: CreateListingInput): Promise<Listing> {
    const id = `lst_${Date.now()}_${this.nextId++}`;
    const listing: Listing = {
      id,
      allyId: input.allyId,
      owner_uid: owner.uid,
      category: input.category,
      title: input.title,
      description: input.description,
      photos: [...input.photos],
      priceMxn: input.priceMxn,
      pricedDates: input.pricedDates ? [...input.pricedDates] : [],
      itineraryMoments: input.itineraryMoments ? [...input.itineraryMoments] : [],
      status: 'en_progreso',
    };

    this.listings.set(id, listing);
    const fb = getFirebaseInstance();
    await fb.firestore.collection('listings').doc(id).set(listing);

    emitOddLog({
      event: 'listing.created',
      actorUid: owner.uid,
      entityId: id,
      metadata: { allyId: input.allyId, category: input.category },
    });

    return listing;
  }

  async publishListing(listingId: string): Promise<{
    published: boolean;
    status: Listing['status'];
    missing: string[];
  }> {
    const listing = this.listings.get(listingId);
    if (!listing) {
      throw new Error(`Anuncio no encontrado: ${listingId}`);
    }

    const missing: string[] = [];
    if (!listing.pricedDates || listing.pricedDates.length === 0) {
      missing.push('Disponibilidad: al menos una fecha con precio en el calendario');
    }
    if (
      listing.category === 'tour' &&
      (!listing.itineraryMoments || listing.itineraryMoments.length === 0)
    ) {
      missing.push('Itinerario: al menos un momento en el itinerario del tour');
    }

    if (missing.length > 0) {
      emitOddLog({
        event: 'listing.publish_blocked',
        actorUid: listing.owner_uid,
        entityId: listing.id,
        metadata: { missing },
      });
      return { published: false, status: 'en_progreso', missing };
    }

    const publishedListing: Listing = { ...listing, status: 'publicado' };
    this.listings.set(listingId, publishedListing);
    const fb = getFirebaseInstance();
    await fb.firestore.collection('listings').doc(listingId).set(publishedListing);

    emitOddLog({
      event: 'listing.published',
      actorUid: listing.owner_uid,
      entityId: listing.id,
      metadata: { allyId: listing.allyId },
    });

    return { published: true, status: 'publicado', missing: [] };
  }

  async updateAllyProfileAndOffer(
    actor: UserAccount,
    allyId: string,
    updates: UpdateAllyOfferInput
  ): Promise<Ally> {
    const ally = this.allies.get(allyId);
    if (!ally) {
      throw new Error(`Aliado no encontrado: ${allyId}`);
    }

    const isStaff = actor.roles.includes('staff') && !actor.concierge_access;
    if (isStaff || (!actor.concierge_access && ally.owner_uid !== actor.uid)) {
      throw new Error('No autorizado: solo el dueño del Aliado o Concierge puede editar la oferta');
    }

    const mergedProfile: AllyProfile = {
      ...ally.profile,
      ...(updates.profile || {}),
      rules: updates.profile?.rules
        ? { ...(ally.profile.rules || {}), ...updates.profile.rules }
        : ally.profile.rules,
    };

    const mergedVerticalConfig: AllyVerticalConfig = { ...ally.vertical_config };
    if (updates.menu_items) {
      mergedVerticalConfig.venue = {
        requires_mandatory_bottle: mergedVerticalConfig.venue?.requires_mandatory_bottle ?? false,
        supports_allergies_alert: mergedVerticalConfig.venue?.supports_allergies_alert ?? true,
        ...mergedVerticalConfig.venue,
        menu_items: [...updates.menu_items],
      };
    }

    const updatedAlly: Ally = {
      ...ally,
      profile: mergedProfile,
      vertical_config: mergedVerticalConfig,
    };

    this.allies.set(allyId, updatedAlly);
    const fb = getFirebaseInstance();
    await fb.firestore.collection('allies').doc(allyId).set(updatedAlly);

    if (typeof updates.priceMxn === 'number') {
      for (const [lid, l] of this.listings.entries()) {
        if (l.allyId === allyId) {
          const updatedListing: Listing = { ...l, priceMxn: updates.priceMxn };
          this.listings.set(lid, updatedListing);
          await fb.firestore.collection('listings').doc(lid).set(updatedListing);
        }
      }
    }

    emitOddLog({
      event: 'ally.profile_updated',
      actorUid: actor.uid,
      entityId: allyId,
      metadata: { updatedPrice: updates.priceMxn },
    });

    return updatedAlly;
  }

  getPublishedListings(): Listing[] {
    return Array.from(this.listings.values()).filter((l) => l.status === 'publicado');
  }

  // Semilla de pilotos reales (§17, providers/mariscos-rulos-menu.md)
  async seedPilotProviders(options: {
    rulosUserId: string;
    oneByProUserId: string;
    seedDemoAnomalyUser?: boolean;
  }): Promise<void> {
    const adminDummy: User = {
      id: 'admin_seed',
      nombre: 'Admin System',
      email: 'system@hype.com',
      telefono: '0000000000',
      rol: 'admin_hype',
      tema: 'oscuro',
      bank: { clabeLast4: '0000', titular: 'System' },
    };

    // --- Legacy seed (preserves T03-T10 tests) ---
    if (!this.getProviderByName("Mariscos Rulo's")) {
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
    }

    if (!this.getProviderByName('One By Pro')) {
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
    }

    this.setCategoryStatus(adminDummy, 'Restaurantes', 'activa');
    this.setCategoryStatus(adminDummy, 'Eventos', 'activa');

    // --- Borrador v3 Ally & Listing seed ---
    const systemConcierge: UserAccount = {
      uid: 'u_system_concierge',
      display_name: 'One Xperience',
      email: 'es3373261@gmail.com',
      phone: '7440000001',
      terms_accepted: true,
      account_status: 'active',
      roles: ['explorer', 'ally'],
      mode: 'viajero',
      concierge_access: true,
      allergies: [],
      theme: 'dark',
      wallet: {
        balance_mxn: 0,
        currency: 'MXN',
        is_closed_loop: true,
        updated_at: '2026-11-19T00:00:00Z',
      },
    };

    if (!this.getAllyByName("Mariscos Rulo's")) {
      const rulosOwner: UserAccount = {
        ...systemConcierge,
        uid: options.rulosUserId,
        display_name: "Raul Rulo's",
        email: 'rulos@mariscos.com',
        concierge_access: false,
      };
      const rulosAlly = await this.registerAlly(rulosOwner, {
        ally_category: 'venue',
        ally_subcategory: 'restaurante',
        profile: {
          business_name: "Mariscos Rulo's",
          avatar_url: 'assets/rulos_beach.jpg',
          description: 'Restaurante Bar en la playa, acceso CICI Acapulco.',
          location: {
            lat: 16.84911,
            lng: -99.85405,
            address: 'Playa, acceso CICI, Acapulco',
          },
          languages: ['es', 'en'],
          gallery_photos: ['assets/rulos_beach.jpg'],
        },
        payout_config: {
          payout_method: 'spei_manual',
          spei_clabe_last4: '4567',
          spei_beneficiary_name: 'Mariscos Rulos SA de CV',
          pending_payout_balance_mxn: 0,
          driver_commission_pool_mxn: 0,
        },
        vertical_config: {
          venue: {
            requires_mandatory_bottle: false,
            supports_allergies_alert: true,
            menu_items: MARISCOS_RULOS_MENU_ITEMS.map((m) => ({ ...m })),
            tables: [{ label: 'Palapa Playa 1', capacity: 6 }],
            turns: ['11:00', '14:00', '17:00'],
          },
        },
      });
      await this.activateAlly(systemConcierge, rulosAlly.allyId, '2026-09-01T00:00:00Z');
      const rulosListing = await this.createListing(rulosOwner, {
        allyId: rulosAlly.allyId,
        category: 'venue',
        title: "Mesa en la playa — Mariscos Rulo's",
        description: 'Restaurante bar en la playa, acceso CICI Acapulco',
        photos: ['assets/rulos_beach.jpg'],
        priceMxn: 250,
        pricedDates: [{ date: '2026-12-20', priceMxn: 250 }],
      });
      await this.publishListing(rulosListing.id);
    }

    if (!this.getAllyByName('One By Pro')) {
      const obpOwner: UserAccount = {
        ...systemConcierge,
        uid: options.oneByProUserId,
        display_name: 'One By Pro',
        email: 'onebypro@hype.com',
        concierge_access: false,
      };
      const obpAlly = await this.registerAlly(obpOwner, {
        ally_category: 'tour',
        ally_subcategory: 'eventos',
        profile: {
          business_name: 'One By Pro',
          avatar_url: 'marketing/flyer-ronnie-onebypro.png',
          description: 'Productora de eventos de Hype Xperience.',
          location: {
            lat: 16.8531,
            lng: -99.8236,
            address: 'Av. Costera Miguel Alemán, zona Dorada (aproximado)',
            approximate: true,
          },
          languages: ['es', 'en'],
          gallery_photos: ['marketing/flyer-ronnie-onebypro.png'],
        },
        payout_config: {
          payout_method: 'spei_manual',
          spei_clabe_last4: '2222',
          spei_beneficiary_name: 'One By Pro',
          pending_payout_balance_mxn: 0,
          driver_commission_pool_mxn: 0,
        },
        vertical_config: {
          tour: {
            departure_dock: 'Zona Dorada Acapulco',
            schedule_slots: ['22:00'],
            capacity_per_slot: 300,
            operational_checklist: ['ID oficial', 'QR de acceso'],
          },
        },
      });
      await this.activateAlly(systemConcierge, obpAlly.allyId, '2026-09-01T00:00:00Z');
      const obpListing = await this.createListing(obpOwner, {
        allyId: obpAlly.allyId,
        category: 'tour',
        title: 'Evento Especial One By Pro — Cover General',
        description: 'Referencia piloto One By Pro ($350 cover)',
        photos: ['marketing/flyer-ronnie-onebypro.png'],
        priceMxn: 350,
        pricedDates: [{ date: '2026-12-20', priceMxn: 350 }],
        itineraryMoments: [{ time: '22:00', title: 'Acceso general con QR' }],
      });
      await this.publishListing(obpListing.id);
    }

    // Preserve Alejandro Valdés $52,520 anomaly without overwriting if already present
    if (options.seedDemoAnomalyUser) {
      const fb = getFirebaseInstance();
      const existingSnap = await fb.firestore
        .collection('users')
        .where('display_name', '==', 'Alejandro Valdés')
        .get();
      if (existingSnap.empty) {
        const alejandro: UserAccount = {
          uid: 'u_alejandro_valdes',
          display_name: 'Alejandro Valdés',
          email: 'alejandro.valdes@demo.hype',
          phone: '7449990000',
          terms_accepted: true,
          account_status: 'active',
          roles: ['explorer'],
          mode: 'viajero',
          concierge_access: false,
          allergies: [],
          theme: 'dark',
          wallet: {
            balance_mxn: DEMO_PRESERVED_ANOMALIES.alejandroValdesBalanceMxn,
            currency: 'MXN',
            is_closed_loop: true,
            updated_at: '2026-11-19T00:00:00Z',
          },
        };
        await fb.firestore.collection('users').doc(alejandro.uid).set(alejandro);
      }
    }
  }
}
