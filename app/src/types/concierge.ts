import { CatalogCategory, CentroConsumo, Service } from './catalog';

export interface ConciergeQueryOptions {
  maxPriceMXN?: number;
  category?: CatalogCategory;
  centroConsumo?: CentroConsumo;
}

export interface ConciergeResponse {
  reply: string;
  recommendedServices: Service[];
  escalatedToHumanHost: boolean;
  humanHostContact?: string;
  requestedCategory?: CatalogCategory;
}

export interface ConciergeXperiencePackage {
  id: string;
  title: string;
  classification: 'xperience';
  centrosIncluidos: CentroConsumo[];
  services: Service[];
  totalPrecioMXN: number;
}

export interface ConciergeBottomBarConfig {
  isConciergeTextBox: boolean;
  floatsOverFeed: boolean;
  changesScreenOnExpand: boolean;
  leftButtons: readonly string[];
  topRightButtons: readonly string[];
  taxiButtonIcon: string;
  theme: {
    background: string;
    surface: string;
    accentGold: string;
    fontFamily: string;
    textPrimary: string;
  };
}
