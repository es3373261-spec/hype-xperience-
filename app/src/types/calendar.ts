export type CalendarViewMode = 'semanal' | 'mensual';

export interface CalendarControlsConfig {
  arrowToggleVertical: '⬆️';
  arrowPrevious: '⬅️';
  arrowNext: '➡️';
  buttonShape: 'circular';
  hasTextButtonsMesSemana: false;
  hasSharedViewLegend: false;
}

export interface CalendarFloatingState {
  isOpen: boolean;
  viewMode: CalendarViewMode;
  currentDate: string;
}
