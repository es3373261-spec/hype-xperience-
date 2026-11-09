import { FeedCalendarService, CALENDAR_COLORS } from '../calendar/FeedCalendarService';
import { FloatingProfileService, THEME_PALETTES } from '../profile/FloatingProfileService';
import { CatalogManager } from '../catalog/CatalogManager';
import { TouristService } from '../tourist/TouristService';
import { WalletService } from '../wallet/WalletService';
import { User } from '../types/user';
import { initializeFirebase } from '../firebase/config';
import { clearOddLogs, getOddLogs } from '../observability/oddLogger';

describe('T-08: Calendario Feed semanal / mensual + Perfil flotante (spec §2, §3, §4 F1, §5c, §6, §7, §10 T10, T11)', () => {
  let catalog: CatalogManager;
  let walletService: WalletService;
  let touristService: TouristService;
  let calendarService: FeedCalendarService;
  let profileService: FloatingProfileService;

  const mockTourist: User = {
    id: 'u-tourist-elena',
    nombre: 'Elena Turista',
    email: 'elena@hype.com',
    telefono: '+527449998877',
    rol: 'turista',
    tema: 'oscuro', // Por defecto oscuro Super AMOLED
    bank: { clabeLast4: '7788', titular: 'Elena Turista' },
    socialLinks: { whatsapp: '+527449998877', instagram: '@elena_acapulco' },
  };

  beforeEach(() => {
    initializeFirebase({ useMocks: true });
    clearOddLogs();
    catalog = new CatalogManager();
    catalog.seedPilotProviders({
      rulosUserId: 'u-rulos-pilot',
      oneByProUserId: 'u-onebypro-pilot',
    });
    walletService = new WalletService();
    touristService = new TouristService(catalog, walletService);
    calendarService = new FeedCalendarService(touristService, catalog);
    profileService = new FloatingProfileService();
  });

  describe('1. Criterio T10: Calendario en Feed (spec §2, §4 F1 paso 6, §5c, §6, §10 T10)', () => {
    test('T10 Calendario: dado turista con reserva y evento, en Feed la reserva se ve dorada y el evento azul', () => {
      // Activar piloto y crear reserva pagada
      const feed = touristService.exploreFeed();
      const service = feed[0].service;

      touristService.setTouristWalletBalance(mockTourist.id, 1000);
      const booking = touristService.createBooking(mockTourist, service.id, '2026-11-14');
      touristService.payBookingWithWallet(mockTourist, booking.id);

      // Obtener entradas de calendario en Feed
      const entries = calendarService.getCalendarEntries(mockTourist, 'Feed');

      expect(entries.length).toBeGreaterThanOrEqual(2);

      // Reserva pagada -> Dorada #d4af37
      const reservationEntry = entries.find((e) => e.tipo === 'reserva');
      expect(reservationEntry).toBeDefined();
      expect(reservationEntry?.colorHex).toBe(CALENDAR_COLORS.reservaDorado); // #d4af37
      expect(reservationEntry?.colorHex).toBe('#d4af37');

      // Evento próximo (One By Pro / Ronnie Acapulco) -> Azul #46578f
      const eventEntry = entries.find((e) => e.tipo === 'evento');
      expect(eventEntry).toBeDefined();
      expect(eventEntry?.colorHex).toBe(CALENDAR_COLORS.eventoAzul); // #46578f
      expect(eventEntry?.colorHex).toBe('#46578f');
    });

    test('T10 Calendario: fuera de Feed NO hay calendario disponible', () => {
      expect(calendarService.isCalendarAvailableInView('Feed')).toBe(true);
      expect(calendarService.isCalendarAvailableInView('Explorar')).toBe(false);
      expect(calendarService.isCalendarAvailableInView('Tickets')).toBe(false);
      expect(calendarService.isCalendarAvailableInView('Wallet')).toBe(false);
      expect(calendarService.isCalendarAvailableInView('Concierge')).toBe(false);

      expect(() => {
        calendarService.getCalendarEntries(mockTourist, 'Explorar');
      }).toThrow('El calendario solo está disponible en la vista Feed');
    });

    test('el calendario se despliega como tarjeta flotante sobre el Feed (spec §5c)', () => {
      const state = calendarService.getFloatingState();
      expect(state.isOpen).toBe(false);

      calendarService.openFloatingCalendar();
      expect(calendarService.getFloatingState().isOpen).toBe(true);

      calendarService.closeFloatingCalendar();
      expect(calendarService.getFloatingState().isOpen).toBe(false);
    });
  });

  describe('2. Calendario simplificado: Navegación semanal / mensual con botones circulares (spec §6)', () => {
    test('conmuta entre vista semanal y mensual con flecha vertical ⬆️', () => {
      // Vista inicial es semanal
      expect(calendarService.getViewMode()).toBe('semanal');

      // Presionar ⬆️ conmuta a mensual
      calendarService.toggleViewMode();
      expect(calendarService.getViewMode()).toBe('mensual');

      // Presionar ⬆️ de nuevo regresa a semanal
      calendarService.toggleViewMode();
      expect(calendarService.getViewMode()).toBe('semanal');
    });

    test('en vista semanal solo se muestra el día y el mes (sin rango de fechas largo)', () => {
      calendarService.setViewMode('semanal');
      calendarService.setCurrentDate(new Date('2026-11-14T12:00:00Z'));

      const headerText = calendarService.getHeaderText();
      // Debe ser conciso: solo día y mes, ej. "14 Nov"
      expect(headerText).toBe('14 Nov');
      expect(headerText).not.toContain('Semana de');
      expect(headerText).not.toContain('a');
    });

    test('en vista mensual solo se muestra el mes actual cambiando (sin leyenda de vista compartida)', () => {
      calendarService.setViewMode('mensual');
      calendarService.setCurrentDate(new Date('2026-11-14T12:00:00Z'));

      const headerText = calendarService.getHeaderText();
      expect(headerText).toBe('Noviembre 2026');
      expect(headerText).not.toContain('vista compartida');

      // Botón circular ➡️ avanza un mes
      calendarService.navigateNext();
      expect(calendarService.getHeaderText()).toBe('Diciembre 2026');

      // Botón circular ⬅️ retrocede
      calendarService.navigatePrevious();
      expect(calendarService.getHeaderText()).toBe('Noviembre 2026');
    });

    test('la UI no incluye botones de texto "Mes" ni "Semana", usa botones circulares con flechas (spec §6)', () => {
      const controls = calendarService.getControlsConfig();
      expect(controls.hasTextButtonsMesSemana).toBe(false);
      expect(controls.hasSharedViewLegend).toBe(false);
      expect(controls.arrowToggleVertical).toBe('⬆️');
      expect(controls.arrowPrevious).toBe('⬅️');
      expect(controls.arrowNext).toBe('➡️');
      expect(controls.buttonShape).toBe('circular');
    });
  });

  describe('3. Criterio T11: Perfil flotante y Persistencia de Tema (spec §2, §6, §7, §10 T11)', () => {
    test('Perfil está arriba a la derecha y abre tarjeta flotante con datos y roles (spec §2, §6)', () => {
      const headerConfig = profileService.getHeaderPositionConfig();
      expect(headerConfig.position).toBe('top-right');
      expect(headerConfig.showsAvatar).toBe(true);
      expect(headerConfig.showsRole).toBe(true);

      const cardState = profileService.openProfileCard(mockTourist);
      expect(cardState.isOpen).toBe(true);
      expect(cardState.user.nombre).toBe('Elena Turista');
      expect(cardState.user.rol).toBe('turista');
      // La CLABE completa nunca se expone (spec §7)
      expect(cardState.user.bank.clabeLast4).toBe('7788');
      expect(cardState.user.bank.clabeFull).toBeUndefined();
    });

    test('T11 Tema: dado cambio a claro en Perfil, el tema persiste al reabrir', async () => {
      // Estado inicial es oscuro Super AMOLED
      expect(mockTourist.tema).toBe('oscuro');
      expect(profileService.getThemePalette('oscuro').background).toBe('#000000');

      // Usuario cambia a tema claro en Perfil
      const updatedUser = await profileService.updateUserTheme(mockTourist, 'claro');
      expect(updatedUser.tema).toBe('claro');

      // T11: Al reabrir / consultar el perfil nuevamente, el tema persiste
      const persistedUser = await profileService.getUserProfile(mockTourist.id);
      expect(persistedUser?.tema).toBe('claro');

      // Paleta en modo claro: fondo claro #f5f2ea, texto oscuro #1a1b26
      const lightPalette = profileService.getThemePalette(persistedUser!.tema);
      expect(lightPalette.background).toBe('#f5f2ea');
      expect(lightPalette.cardBackground).toBe('#ffffff');
      expect(lightPalette.textPrimary).toBe('#1a1b26');
      expect(lightPalette.accentGold).toBe('#d4af37');

      // ODD observabilidad
      const themeLogs = getOddLogs('profile.theme_updated');
      expect(themeLogs.length).toBe(1);
      expect(themeLogs[0].payload.newTheme).toBe('claro');
    });

    test('el tema oscuro tipo Super AMOLED respeta los tokens del design-system.md', () => {
      const darkPalette = profileService.getThemePalette('oscuro');
      expect(darkPalette.background).toBe('#000000'); // Negro puro Super AMOLED
      expect(darkPalette.cardBackground).toBe('#080808'); // Superficie negro muy oscuro
      expect(darkPalette.elevatedSurface).toBe('#0a0a0a'); // Elevado negro muy oscuro
      expect(darkPalette.textPrimary).toBe('#ffffff'); // Blanco puro
      expect(darkPalette.textSecondary).toBe('#a9b1d6'); // Gris claro secundario
      expect(darkPalette.accentGold).toBe('#d4af37'); // Dorado intacto
      expect(darkPalette.blueMaleta).toBe('#46578f'); // Azul maleta Hype
      expect(darkPalette.fontFamily).toBe('Montserrat'); // Montserrat para todo
    });
  });
});
