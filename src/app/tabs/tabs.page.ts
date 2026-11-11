// ============================================================
// src/app/tabs/tabs.page.ts
// The shell component for the tabs layout.
// Exposes isAdmin so the template can show/hide the Database tab.
// ============================================================

import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage {
  adminService = inject(AdminService);
  private router = inject(Router);

  get isAdmin(): boolean {
    return this.adminService.isAdmin;
  }

  async onAdminTabClick() {
    const success = await this.adminService.promptLogin();
    if (success) {
      this.router.navigate(['/tabs/database']);
    }
  }
}

