import { User } from '../types/user';
import { CalendarEntry } from '../types/booking';
import {
  CalendarViewMode,
  CalendarControlsConfig,
  CalendarFloatingState,
} from '../types/calendar';
import { TouristService } from '../tourist/TouristService';
import { CatalogManager } from '../catalog/CatalogManager';

export const CALENDAR_COLORS = {
  reservaDorado: '#d4af37',
  eventoAzul: '#46578f',
} as const;

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const MONTH_SHORT = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

export class FeedCalendarService {
  private touristService: TouristService;
  private catalog: CatalogManager;
  private viewMode: CalendarViewMode = 'semanal';
  private currentDate: Date = new Date();
  private isFloatingOpen: boolean = false;

  constructor(touristService: TouristService, catalog: CatalogManager) {
    this.touristService = touristService;
    this.catalog = catalog;
  }

  // Criterio T10: Solo disponible en vista Feed (spec §2, §10 T10)
  isCalendarAvailableInView(viewName: string): boolean {
    return viewName === 'Feed';
  }

  getCalendarEntries(user: User, viewName: string): CalendarEntry[] {
    if (!this.isCalendarAvailableInView(viewName)) {
      throw new Error('El calendario solo está disponible en la vista Feed');
    }

    return this.touristService.getTouristCalendarEntries(user);
  }

  // Navegación y estado flotante (spec §5c)
  openFloatingCalendar(): void {
    this.isFloatingOpen = true;
  }

  closeFloatingCalendar(): void {
    this.isFloatingOpen = false;
  }

  getFloatingState(): CalendarFloatingState {
    return {
      isOpen: this.isFloatingOpen,
      viewMode: this.viewMode,
      currentDate: this.currentDate.toISOString(),
    };
  }

  // Modos Semanal y Mensual (spec §6)
  getViewMode(): CalendarViewMode {
    return this.viewMode;
  }

  setViewMode(mode: CalendarViewMode): void {
    this.viewMode = mode;
  }

  toggleViewMode(): CalendarViewMode {
    this.viewMode = this.viewMode === 'semanal' ? 'mensual' : 'semanal';
    return this.viewMode;
  }

  setCurrentDate(date: Date): void {
    this.currentDate = new Date(date.getTime());
  }

  getCurrentDate(): Date {
    return new Date(this.currentDate.getTime());
  }

  navigateNext(): void {
    if (this.viewMode === 'semanal') {
      const nextWeek = new Date(this.currentDate.getTime());
      nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
      this.currentDate = nextWeek;
    } else {
      const nextMonth = new Date(this.currentDate.getTime());
      nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
      this.currentDate = nextMonth;
    }
  }

  navigatePrevious(): void {
    if (this.viewMode === 'semanal') {
      const prevWeek = new Date(this.currentDate.getTime());
      prevWeek.setUTCDate(prevWeek.getUTCDate() - 7);
      this.currentDate = prevWeek;
    } else {
      const prevMonth = new Date(this.currentDate.getTime());
      prevMonth.setUTCMonth(prevMonth.getUTCMonth() - 1);
      this.currentDate = prevMonth;
    }
  }

  // En semana solo día y mes (ej. "14 Nov"); en mes solo mes actual (ej. "Noviembre 2026")
  getHeaderText(): string {
    const day = this.currentDate.getUTCDate();
    const monthIndex = this.currentDate.getUTCMonth();
    const year = this.currentDate.getUTCFullYear();

    if (this.viewMode === 'semanal') {
      return `${day} ${MONTH_SHORT[monthIndex]}`;
    }

    return `${MONTH_NAMES[monthIndex]} ${year}`;
  }

  getControlsConfig(): CalendarControlsConfig {
    return {
      arrowToggleVertical: '⬆️',
      arrowPrevious: '⬅️',
      arrowNext: '➡️',
      buttonShape: 'circular',
      hasTextButtonsMesSemana: false,
      hasSharedViewLegend: false,
    };
  }
}
