// ============================================================
// src/app/pages/watchlist/watchlist.module.ts
// ============================================================

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { WatchlistRoutingModule } from './watchlist-routing.module';
import { WatchlistPage } from './watchlist.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    WatchlistRoutingModule
  ],
  declarations: [WatchlistPage]
})
export class WatchlistPageModule {}
