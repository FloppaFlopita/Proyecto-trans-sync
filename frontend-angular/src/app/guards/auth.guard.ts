import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para páginas exclusivas de Administrador (Dashboard, Flota, Pagos)
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  // Si no es admin (ej: link copiado en otro navegador o invitado), redirige a login
  return router.createUrlTree(['/login'], {
    queryParams: { auth_required: 'ADMIN', returnUrl: state.url }
  });
};

/**
 * Guard para páginas exclusivas de Conductor
 */
export const conductorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isConductor() || authService.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { auth_required: 'CONDUCTOR', returnUrl: state.url }
  });
};

/**
 * Guard para proteger el acceso a TODO el sistema:
 * Si copias el enlace en otro navegador y NO has iniciado sesión ni pulsado "Continuar sin cuenta",
 * te bota inmediatamente a la pantalla de /login.
 */
export const sessionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() || authService.isInvitado()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};

/**
 * Guard para páginas que exigen autenticación obligatoria
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { auth_required: 'LOGIN', returnUrl: state.url }
  });
};
