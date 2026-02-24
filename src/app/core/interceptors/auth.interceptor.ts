import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const router = inject(Router);
  const authService = inject(AuthService);
  const toast = inject(ToastService);

  const token = authService.getToken();

  let authReq = req;

  // ✅ Only attach token for backend API calls (not auth endpoints)
  const isApiCall = req.url.startsWith(environment.apiBaseUrl);
  const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/register');

  if (token && isApiCall && !isAuthEndpoint) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error) => {

      switch (error.status) {

        // 🔐 401 - Unauthorized
        case 401:
          if (authService.isLoggedIn()) {
            toast.error('Session expired. Please login again.');
            authService.logout();
          }
          break;

        // 🚫 403 - Forbidden
        case 403:
          toast.error('Access denied.');
          break;

        // 💥 5xx - Server errors
        default:
          if (error.status >= 500) {
            toast.error('Server error. Please try again later.');
          }
      }

      return throwError(() => error);
    })
  );
};