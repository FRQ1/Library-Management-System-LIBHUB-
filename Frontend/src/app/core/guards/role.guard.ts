import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

// Factory - use as: canActivate: [roleGuard(['admin', 'librarian'])]
export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      router.navigate(['/login']);
      return false;
    }

    const role = auth.role();
    if (role && allowedRoles.includes(role)) {
      return true;
    }

    router.navigate(['/']);
    return false;
  };
};
