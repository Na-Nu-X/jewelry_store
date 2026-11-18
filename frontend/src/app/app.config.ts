import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeSk from '@angular/common/locales/sk';
import {
  ActivatedRouteSnapshot,
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';

import { routes } from './app.routes';
import { BrandTitleStrategy } from './core/services/title.strategy';

registerLocaleData(localeSk);

/** Identifies the rendered page: deepest route config plus its path params. */
function leafKey(snapshot: ActivatedRouteSnapshot): string {
  let leaf = snapshot;
  while (leaf.firstChild) leaf = leaf.firstChild;
  return `${leaf.routeConfig?.path ?? ''}|${JSON.stringify(leaf.params)}`;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ({ transition, from, to }) => {
          // Filter / sort changes only touch query params – no page transition for those.
          // (Angular logs the resulting AbortError in dev mode only.)
          if (leafKey(from) === leafKey(to)) transition.skipTransition();
        },
      }),
    ),
    provideHttpClient(withFetch()),
    { provide: TitleStrategy, useClass: BrandTitleStrategy },
    { provide: LOCALE_ID, useValue: 'sk' },
  ],
};
