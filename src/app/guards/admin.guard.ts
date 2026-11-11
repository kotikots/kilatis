// ============================================================
// src/app/guards/admin.guard.ts
// Route guard that blocks access to /tabs/database unless
// the user has an active admin session. If not, it shows the
// PIN prompt and only proceeds on success.
// ============================================================

import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AdminService } from '../services/admin.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  private adminService = inject(AdminService);
  private router = inject(Router);

  async canActivate(): Promise<boolean> {
    if (this.adminService.isAdmin) {
      return true;
    }

    // Show the PIN prompt; if the user authenticates, allow navigation
    const success = await this.adminService.promptLogin();
    if (!success) {
      this.router.navigate(['/tabs/dashboard']);
      return false;
    }
    return true;
  }
}

