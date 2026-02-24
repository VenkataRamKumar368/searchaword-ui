import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const router = inject(Router);
  const authService = inject(AuthService);
  const toast = inject(ToastService);

  const token = authService.getToken();

  let authReq = req;

  // ✅ Attach JWT
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error) => {

      // 🚨 GLOBAL 401 HANDLER
      if (error.status === 401) {

        // Prevent double logout loops
        if (authService.isLoggedIn()) {
          toast.error('Session expired. Please login again.');
          authService.logout();
        }
      }

      // 🚨 GLOBAL 403 HANDLER
      if (error.status === 403) {
        toast.error('Access denied.');
      }

      // 🚨 GLOBAL 500 HANDLER
      if (error.status >= 500) {
        toast.error('Server error. Please try again later.');
      }

      return throwError(() => error);
    })
  );
};