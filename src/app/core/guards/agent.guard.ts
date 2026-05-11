import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

export const AgentGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.getCurrentUser();
    if (user?.roles?.includes('ROLE_USER_CLIENT_AGENT')) {
        return true;
    }

    router.navigate(['/dashboard']);
    return false;
};
