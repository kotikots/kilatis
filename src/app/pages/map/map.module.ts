// ============================================================
// src/app/pages/map/map.module.ts
// NgModule for the Market Map tab.
// ============================================================

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { MapRoutingModule } from './map-routing.module';
import { MapPage } from './map.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MapRoutingModule
  ],
  declarations: [MapPage]
})
export class MapPageModule {}
