import { CatalogManager } from '../catalog/CatalogManager';
import { CatalogCategory, CentroConsumo, Service } from '../types/catalog';
import {
  ConciergeBottomBarConfig,
  ConciergeQueryOptions,
  ConciergeResponse,
  ConciergeXperiencePackage,
} from '../types/concierge';
import { User } from '../types/user';
import { emitOddLog } from '../observability/oddLogger';
import { BOCHO_TAXI_ICON } from '../taxi/TaxiService';

export class ConciergeAuraService {
  private catalog: CatalogManager;
  private nextPkgId = 1;

  constructor(catalog: CatalogManager) {
    this.catalog = catalog;
  }

  private detectRequestedCategory(prompt: string): CatalogCategory | undefined {
    const normalized = prompt.toLowerCase();

    if (
      normalized.includes('hotel') ||
      normalized.includes('habitación') ||
      normalized.includes('habitacion') ||
      normalized.includes('hospedaje') ||
      normalized.includes('alojamiento') ||
      normalized.includes('dormir')
    ) {
      return 'Hotel';
    }

    if (
      normalized.includes('playa') &&
      (normalized.includes('jetski') ||
        normalized.includes('banana') ||
        normalized.includes('buceo') ||
        normalized.includes('paracaídas') ||
        normalized.includes('paracaidas'))
    ) {
      return 'Playa';
    }

    if (
      normalized.includes('paracaídas') ||
      normalized.includes('paracaidas') ||
      normalized.includes('buceo') ||
      normalized.includes('jetski') ||
      normalized.includes('banana')
    ) {
      return 'Playa';
    }

    if (
      normalized.includes('restaurante') ||
      normalized.includes('marisco') ||
      normalized.includes('ceviche') ||
      normalized.includes('comer') ||
      normalized.includes('comida') ||
      normalized.includes('pescado') ||
      normalized.includes('camarón') ||
      normalized.includes('camaron') ||
      normalized.includes('rulo')
    ) {
      return 'Restaurantes';
    }

    if (
      normalized.includes('evento') ||
      normalized.includes('fiesta') ||
      normalized.includes('ronnie') ||
      normalized.includes('festival') ||
      normalized.includes('one by pro')
    ) {
      return 'Eventos';
    }

    if (
      normalized.includes('club') ||
      normalized.includes('antro') ||
      normalized.includes('botella')
    ) {
      return 'Club';
    }

    if (
      normalized.includes('taxi') ||
      normalized.includes('bocho') ||
      normalized.includes('traslado')
    ) {
      return 'Taxi';
    }

    if (
      normalized.includes('tour') ||
      normalized.includes('paseo') ||
      normalized.includes('quebrada')
    ) {
      return 'Tours';
    }

    return undefined;
  }

  // Guardrail estricto anti-alucinación (spec §4 F5, §11 Alerta "Error de Concierge inventando un servicio")
  validateRecommendationsAgainstCatalog(services: Service[]): boolean {
    for (const candidate of services) {
      const realService = this.catalog.getServiceById(candidate.id);
      const provider = realService
        ? this.catalog.getProviderById(realService.providerId)
        : null;

      if (
        !realService ||
        !realService.activo ||
        !provider ||
        !provider.activo ||
        this.catalog.getCategoryStatus(realService.categoría) !== 'activa'
      ) {
        emitOddLog('concierge.hallucination_blocked', {
          serviceId: candidate.id,
          reason: 'service_not_found_or_inactive',
        });
        throw new Error(
          'Error de Concierge: intento de recomendar un servicio inexistente o inactivo'
        );
      }

      if (
        candidate.precioMXN !== realService.precioMXN ||
        candidate.cupo !== realService.cupo ||
        candidate.título !== realService.título
      ) {
        emitOddLog('concierge.hallucination_blocked', {
          serviceId: candidate.id,
          reason: 'price_or_availability_mismatch',
        });
        throw new Error(
          'Error de Concierge: el precio o disponibilidad no coincide con el catálogo real'
        );
      }
    }

    return true;
  }

  // Chat Concierge Aura solo con catálogo real (spec §4 F5, §5, §10 T09, §11)
  askAura(
    user: User,
    prompt: string,
    options?: ConciergeQueryOptions
  ): ConciergeResponse {
    const requestedCategory =
      options?.category || this.detectRequestedCategory(prompt);

    let feedItems = this.catalog.getTouristFeed({
      category: requestedCategory,
      centro: options?.centroConsumo,
    });

    if (options?.maxPriceMXN !== undefined) {
      feedItems = feedItems.filter(
        (item) => item.service.precioMXN <= options.maxPriceMXN!
      );
    }

    const candidateServices = feedItems.map((item) => item.service);

    // Validamos que todos los candidatos pertenezcan estrictamente al catálogo activo
    this.validateRecommendationsAgainstCatalog(candidateServices);

    // Si no hay servicio activo en el catálogo, no inventa nada: avisa y escala a host humano (§4 F5, §10 T09, §11)
    if (candidateServices.length === 0) {
      emitOddLog('concierge.no_service_found', {
        userId: user.id,
        query: prompt,
        requestedCategory: requestedCategory || 'general',
        escalatedToHumanHost: true,
      });

      const catLabel = requestedCategory ? ` en la categoría ${requestedCategory}` : '';
      return {
        reply:
          `Hola ${user.nombre}, por el momento no contamos con servicios activos disponibles${catLabel} ` +
          `en nuestro catálogo verificado. Nunca inventamos disponibilidad ni precios; te estoy conectando ` +
          `con un host humano de Hype Xperience para atender tu solicitud personalmente.`,
        recommendedServices: [],
        escalatedToHumanHost: true,
        humanHostContact:
          'https://wa.me/527440000000?text=Hola%20Host%20Humano%20Hype%20Xperience',
        requestedCategory,
      };
    }

    const summaryList = candidateServices
      .slice(0, 3)
      .map((s) => `${s.título} ($${s.precioMXN} MXN, horario ${s.horario})`)
      .join(', ');

    return {
      reply: `Hola ${user.nombre}, según tu perfil y el catálogo activo de Acapulco te recomiendo: ${summaryList}.`,
      recommendedServices: candidateServices,
      escalatedToHumanHost: false,
      requestedCategory,
    };
  }

  // Armado de paquete Xperience combinando 2+ centros de consumo con el Concierge (spec §5b)
  buildXperiencePackage(
    user: User,
    centros: CentroConsumo[]
  ): ConciergeXperiencePackage | null {
    const selectedServices: Service[] = [];
    const includedCentros: CentroConsumo[] = [];

    for (const centro of centros) {
      const feedForCentro = this.catalog.getTouristFeed({ centro });
      if (feedForCentro.length > 0) {
        selectedServices.push(feedForCentro[0].service);
        includedCentros.push(centro);
      }
    }

    if (selectedServices.length < 2) {
      emitOddLog('concierge.no_service_found', {
        userId: user.id,
        query: 'buildXperiencePackage',
        requestedCentros: centros,
        escalatedToHumanHost: true,
      });
      return null;
    }

    this.validateRecommendationsAgainstCatalog(selectedServices);

    const classification = this.catalog.classifyService({
      centrosIncluidos: includedCentros,
    });

    if (classification !== 'xperience') {
      return null;
    }

    const totalPrecioMXN = selectedServices.reduce(
      (sum, s) => sum + s.precioMXN,
      0
    );

    return {
      id: `pkg_xperience_${Date.now()}_${this.nextPkgId++}`,
      title: `Paquete Xperience para ${user.nombre}`,
      classification: 'xperience',
      centrosIncluidos: includedCentros,
      services: selectedServices,
      totalPrecioMXN,
    };
  }

  // Configuración de barra inferior del turista vs otros roles (spec §2, §5c, §6)
  getBottomBarConfig(user: User): ConciergeBottomBarConfig {
    const isTourist = user.rol === 'turista';
    return {
      isConciergeTextBox: isTourist,
      floatsOverFeed: true,
      changesScreenOnExpand: false,
      leftButtons: ['Feed', 'Explorar', 'Tickets', 'Calendario'] as const,
      topRightButtons: ['Taxi', 'Wallet'] as const,
      taxiButtonIcon: BOCHO_TAXI_ICON,
      theme: {
        background: '#000000', // Super AMOLED
        surface: '#0a0a0a',
        accentGold: '#d4af37',
        fontFamily: 'Montserrat',
        textPrimary: '#ffffff',
      },
    };
  }
}
