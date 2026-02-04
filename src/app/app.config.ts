import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, withJsonpSupport } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { appRoutes } from './app.routes';
import { noctuaConfig } from './noctua-config';
import { NOCTUA_CONFIG, NoctuaConfigService } from '@noctua/services/config.service';
import { NoctuaMatchMediaService } from '@noctua/services/match-media.service';
import { NoctuaSplashScreenService } from '@noctua/services/splash-screen.service';
import { StartupService } from './startup.service';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faAngleDoubleDown,
  faAngleDoubleLeft,
  faAngleDoubleRight,
  faAngleDoubleUp,
  faAngleLeft,
  faAngleRight,
  faArrowDown,
  faArrowLeft,
  faArrowUp,
  faBars,
  faCalendarAlt,
  faCalendarDay,
  faCalendarWeek,
  faCaretDown,
  faCaretRight,
  faChartBar,
  faCheck,
  faChevronDown,
  faChevronRight,
  faClipboardList,
  faClone,
  faCog,
  faComment,
  faCommentAlt,
  faCopy,
  faEdit,
  faEllipsisV,
  faExclamationCircle,
  faExclamationTriangle,
  faHistory,
  faInfo,
  faInfoCircle,
  faLevelDownAlt,
  faLevelUpAlt,
  faLink,
  faList,
  faListAlt,
  faPalette,
  faPaw,
  faPen,
  faPlus,
  faPlusSquare,
  faSave,
  faSearch,
  faSearchMinus,
  faSearchPlus,
  faShoppingBasket,
  faSitemap,
  faSortAlphaDown,
  faSortAlphaDownAlt,
  faTable,
  faTasks,
  faTimes,
  faTrash,
  faUndo,
  faUser,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { faBell, faCheckCircle, faTimesCircle, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { faGithub, faFacebook, faTwitter } from '@fortawesome/free-brands-svg-icons';

function initializeApp(startupService: StartupService) {
  return () => startupService.loadData();
}

function initializeFontAwesome(library: FaIconLibrary) {
  return () => {
    library.addIcons(
      faArrowDown,
      faArrowLeft,
      faArrowUp,
      faAngleDoubleDown,
      faAngleDoubleLeft,
      faAngleDoubleRight,
      faAngleDoubleUp,
      faAngleLeft,
      faAngleRight,
      faBars,
      faBell,
      faCalendarAlt,
      faCalendarDay,
      faCalendarWeek,
      faCaretDown,
      faCaretRight,
      faChartBar,
      faCheck,
      faCheckCircle,
      faChevronDown,
      faChevronRight,
      faClipboardList,
      faClone,
      faCog,
      faComment,
      faCommentAlt,
      faCopy,
      faEdit,
      faEllipsisV,
      faExclamationCircle,
      faExclamationTriangle,
      faFacebook,
      faGithub,
      faHistory,
      faInfo,
      faInfoCircle,
      faLevelDownAlt,
      faLevelUpAlt,
      faLink,
      faList,
      faListAlt,
      faPalette,
      faPaw,
      faPen,
      faPlus,
      faPlusSquare,
      faSave,
      faSearch,
      faSearchMinus,
      faSearchPlus,
      faShoppingBasket,
      faSitemap,
      faSortAlphaDown,
      faSortAlphaDownAlt,
      faTable,
      faTasks,
      faTimes,
      faTimesCircle,
      faTrash,
      faTrashAlt,
      faTwitter,
      faUndo,
      faUser,
      faUsers,
    );
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    // Router
    provideRouter(appRoutes, withComponentInputBinding()),

    // HTTP Client
    provideHttpClient(withInterceptorsFromDi(), withJsonpSupport()),

    // Animations
    provideAnimations(),

    // Noctua Config
    { provide: NOCTUA_CONFIG, useValue: noctuaConfig },

    // Core services
    NoctuaConfigService,
    NoctuaMatchMediaService,
    NoctuaSplashScreenService,

    // Startup service and initializer
    StartupService,
    provideAppInitializer(() => {
      const initializerFn = initializeApp(inject(StartupService));
      return initializerFn();
    }),

    // FontAwesome icons initializer
    provideAppInitializer(() => {
      const initializerFn = initializeFontAwesome(inject(FaIconLibrary));
      return initializerFn();
    }),
  ]
};
