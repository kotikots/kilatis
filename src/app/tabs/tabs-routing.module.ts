// ============================================================
// src/app/tabs/tabs-routing.module.ts
// Defines the child routes for the tab navigation.
// Each tab path lazy-loads its own NgModule to keep the initial
// bundle size small (only load a page when the user visits it).
// ============================================================

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { AdminGuard } from '../guards/admin.guard';

const routes: Routes = [
  {
    // Empty path because the parent route in app-routing.module.ts
    // already consumed the 'tabs' segment. This component is the
    // shell that holds the ion-tabs and ion-tab-bar.
    path: '',
    component: TabsPage,
    children: [
      {
        // Full URL will be: /tabs/dashboard
        path: 'dashboard',
        loadChildren: () =>
          import('../pages/dashboard/dashboard.module').then(m => m.DashboardPageModule)
      },
      {
        // Full URL will be: /tabs/map
        path: 'map',
        loadChildren: () =>
          import('../pages/map/map.module').then(m => m.MapPageModule)
      },
      {
        // Full URL will be: /tabs/watchlist
        path: 'watchlist',
        loadChildren: () =>
          import('../pages/watchlist/watchlist.module').then(m => m.WatchlistPageModule)
      },
      {
        // Full URL will be: /tabs/basket
        path: 'basket',
        loadChildren: () =>
          import('../pages/basket/basket.module').then(m => m.BasketPageModule)
      },
      {
        // Full URL will be: /tabs/recipes
        path: 'recipes',
        loadChildren: () =>
          import('../pages/recipes/recipes.module').then(m => m.RecipesPageModule)
      },
      {
        // Full URL will be: /tabs/compare
        path: 'compare',
        loadChildren: () =>
          import('../pages/compare/compare.module').then(m => m.ComparePageModule)
      },
      {
        // Full URL will be: /tabs/database
        // Protected: only admins with correct PIN can access
        path: 'database',
        canActivate: [AdminGuard],
        loadChildren: () =>
          import('../pages/database/database.module').then(m => m.DatabasePageModule)
      },
      {
        // Default child: redirect to dashboard
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsRoutingModule {}

