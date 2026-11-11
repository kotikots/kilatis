// ============================================================
// src/app/app-routing.module.ts
// Root routing module.
// Initial entry point is the Landing Page (/landing),
// which introduces the system and guides users into the
// full Tabs application (/tabs).
// ============================================================

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    // Entry landing page presented before entering the whole system
    path: 'landing',
    loadChildren: () => import('./pages/landing/landing.module').then(m => m.LandingPageModule)
  },
  {
    // Lazy-load the TabsPageModule, which contains the main app tabs (Prices, Markets, Watchlist)
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    // Root path directs new visitors to the landing page first
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full'
  },
  {
    // Wildcard redirect to the landing page
    path: '**',
    redirectTo: 'landing'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
