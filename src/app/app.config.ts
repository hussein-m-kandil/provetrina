import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { routes, RouteTitleStrategy } from './app.routes';

import { providePrimeNG } from 'primeng/config';
import { primengConfig } from './primeng.config';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { retryingInterceptor } from './retrying-interceptor';
import { initColorScheme } from './color-scheme';
import { authInterceptor } from './accounts';

export const interceptors = [authInterceptor, retryingInterceptor];

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: TitleStrategy, useClass: RouteTitleStrategy },
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors(interceptors)),
    provideAppInitializer(initColorScheme),
    provideBrowserGlobalErrorListeners(),
    providePrimeNG(primengConfig),
  ],
};
