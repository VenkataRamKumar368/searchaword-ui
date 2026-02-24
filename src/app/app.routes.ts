import { Routes } from '@angular/router';
import { authGuard } from './core/guard/auth.guard';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // =========================
  // LOGIN
  // =========================
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login')
        .then(m => m.LoginComponent)
  },

  // =========================
  // REGISTER (NEW)
  // =========================
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register')
        .then(m => m.RegisterComponent)
  },

  // =========================
  // PROTECTED SEARCH
  // =========================
  {
    path: 'search',
    loadComponent: () =>
      import('./features/search/search')
        .then(m => m.SearchComponent),
    canActivate: [authGuard]
  },

  // =========================
  // FALLBACK
  // =========================
  {
    path: '**',
    redirectTo: 'login'
  }

];