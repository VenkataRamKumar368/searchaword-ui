import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection
} from '@angular/core';

import { provideRouter } from '@angular/router';

import {
  provideHttpClient,
  withInterceptors,
  withFetch
} from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [

    // 🌐 Router
    provideRouter(routes),

    // ⚡ Performance Optimization
    provideZoneChangeDetection({ eventCoalescing: true }),

    // 🧠 Global Error Handling
    provideBrowserGlobalErrorListeners(),

    // 🔐 HTTP Client with JWT Interceptor
    provideHttpClient(
      withFetch(), // Modern fetch-based backend
      withInterceptors([
        authInterceptor
      ])
    )

  ]
};