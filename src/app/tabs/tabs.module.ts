// ============================================================
// src/app/tabs/tabs.module.ts
// NgModule that declares the TabsPage component and sets up
// the routing for all tabs via TabsRoutingModule.
// ============================================================

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { TabsPage } from './tabs.page';
import { TabsRoutingModule } from './tabs-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TabsRoutingModule
  ],
  declarations: [TabsPage]
})
export class TabsPageModule {}
