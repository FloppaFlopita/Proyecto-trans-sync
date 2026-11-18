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

  // Si no es admin (ej: link copiado en otro navegador o invitado)
  authService.abrirModalLogin(
    'Acceso restringido: Esta sección requiere inicio de sesión con perfil de Administrador.',
    state.url
  );
  return router.createUrlTree(['/reservas'], {
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

  authService.abrirModalLogin(
    'Acceso restringido: Esta sección requiere credenciales de Conductor.',
    state.url
  );
  return router.createUrlTree(['/reservas'], {
    queryParams: { auth_required: 'CONDUCTOR', returnUrl: state.url }
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

  authService.abrirModalLogin(
    'Por favor inicia sesión para acceder a esta sección.',
    state.url
  );
  return router.createUrlTree(['/reservas'], {
    queryParams: { auth_required: 'LOGIN', returnUrl: state.url }
  });
};
