import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'reservas', pathMatch: 'full' },
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
        loadComponent: () => import('./pages/reservas/reservas').then(m => m.ReservasComponent)
      },
      {
        path: 'pagos',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/pagos/pagos').then(m => m.PagosComponent)
      },
      {
        path: 'rutas',
        loadComponent: () => import('./pages/rutas/rutas').then(m => m.RutasComponent)
      },
      {
        path: 'promociones',
        loadComponent: () => import('./pages/promociones/promociones').then(m => m.PromocionesComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'reservas' }
];
