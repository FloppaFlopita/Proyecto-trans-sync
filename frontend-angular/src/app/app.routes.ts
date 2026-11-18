import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { adminGuard, sessionGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent)
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [sessionGuard],
    children: [
      {
        path: 'dashboard',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'flota',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/flota/flota').then(m => m.FlotaComponent)
      },
      {
        path: 'reservas',
        canActivate: [sessionGuard],
        loadComponent: () => import('./pages/reservas/reservas').then(m => m.ReservasComponent)
      },
      {
        path: 'pagos',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/pagos/pagos').then(m => m.PagosComponent)
      },
      {
        path: 'rutas',
        canActivate: [sessionGuard],
        loadComponent: () => import('./pages/rutas/rutas').then(m => m.RutasComponent)
      },
      {
        path: 'promociones',
        canActivate: [sessionGuard],
        loadComponent: () => import('./pages/promociones/promociones').then(m => m.PromocionesComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
