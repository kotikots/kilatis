// ============================================================
// src/app/app.module.ts
// The root NgModule — the entry point of the entire Angular app.
//
// Key additions from the default scaffold:
//  - HttpClientModule: enables Angular's HttpClient service
//    (required for DataService to fetch the JSON files)
//  - provideHttpClient: modern functional provider for Angular 15+
// ============================================================

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular/lazy';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      animated: false,
      rippleEffect: false
    }),
    AppRoutingModule
  ],
  providers: [
    // Use Ionic's route reuse strategy for proper tab navigation
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    // Provide HttpClient globally so any service can inject it
    provideHttpClient()
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
