// ============================================================
// src/app/pages/dashboard/dashboard.module.ts
// NgModule for the Dashboard (Prices) page.
// Declares the component and imports required modules.
// ============================================================

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardPage } from './dashboard.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DashboardRoutingModule
  ],
  declarations: [DashboardPage]
})
export class DashboardPageModule {}
