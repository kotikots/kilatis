// ============================================================
// src/app/pages/watchlist/watchlist.page.ts
// Controller for the Watchlist tab.
//
// Features:
//  - Loads the user's saved items from localStorage on each visit
//  - Allows the user to remove items (with haptic feedback)
//  - Shows a "deal found" badge if any market is at or below target
//  - Shows a helpful empty state when the list is empty
// ============================================================

import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular/lazy';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { DataService, DEFAULT_MARKETS } from '../../services/data.service';
import { WatchlistItem, Market } from '../../models/commodity.model';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.page.html',
  styleUrls: ['./watchlist.page.scss'],
  standalone: false,
})
export class WatchlistPage implements OnInit {

  // The list of saved WatchlistItem objects from localStorage
  watchlist: WatchlistItem[] = [];

  // Markets list used to resolve market IDs to human-readable names
  markets: Market[] = [...DEFAULT_MARKETS];
  private marketNameMap: Map<number, string> = new Map();

  constructor(
    private dataService: DataService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.initMarketMap();
    this.loadMarkets();
  }

  // ----------------------------------------------------------------
  // ionViewWillEnter fires EVERY TIME the tab becomes active.
  // We use this (instead of ngOnInit) so the list refreshes
  // whenever the user adds an item from the Dashboard tab.
  // ----------------------------------------------------------------
  ionViewWillEnter() {
    this.loadWatchlist();
    this.loadMarkets();
  }

  private initMarketMap() {
    this.markets.forEach(m => this.marketNameMap.set(Number(m.id), m.name));
  }

  private loadMarkets() {
    this.dataService.getMarkets().subscribe({
      next: (markets) => {
        if (markets && markets.length > 0) {
          this.markets = markets;
          markets.forEach(m => this.marketNameMap.set(Number(m.id), m.name));
        }
      }
    });
  }

  // ----------------------------------------------------------------
  // Resolves a market ID into its friendly market name.
  // Fallbacks gracefully to "Palengke {id}".
  // ----------------------------------------------------------------
  getMarketName(marketId: number): string {
    const id = Number(marketId);
    if (this.marketNameMap.has(id)) {
      return this.marketNameMap.get(id)!;
    }
    const found = this.markets.find(m => Number(m.id) === id);
    if (found) {
      this.marketNameMap.set(id, found.name);
      return found.name;
    }
    return `Palengke ${marketId}`;
  }

  // ----------------------------------------------------------------
  // Reads the watchlist from localStorage via the DataService.
  // ----------------------------------------------------------------
  loadWatchlist() {
    this.watchlist = this.dataService.getWatchlist();
  }

  // ----------------------------------------------------------------
  // Checks if any market's current price is at or below the user's
  // target price. This highlights "deal found" opportunities.
  //
  // @param item  The WatchlistItem to check
  // ----------------------------------------------------------------
  hasDeal(item: WatchlistItem): boolean {
    return item.commodity.prices.some(p => p.price <= item.targetPrice);
  }

  // ----------------------------------------------------------------
  // Gets the best (lowest) current price across all markets
  // for the commodity in a watchlist item.
  // ----------------------------------------------------------------
  getBestCurrentPrice(item: WatchlistItem): number {
    return this.dataService.getLowestPrice(item.commodity);
  }

  // ----------------------------------------------------------------
  // Shows a confirmation alert before removing an item, then
  // removes it from localStorage and refreshes the list.
  // Triggers haptic feedback on confirmation.
  // ----------------------------------------------------------------
  async confirmRemove(item: WatchlistItem) {
    const alert = await this.alertCtrl.create({
      header: 'Remove from Watchlist',
      message: `Remove "${item.commodity.name}" from your watchlist?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Remove',
          role: 'destructive',
          handler: async () => {
            this.dataService.removeFromWatchlist(item.commodity.id);
            this.loadWatchlist(); // Reload the updated list
            await this.triggerHaptic();
            this.showToast(`${item.commodity.name} removed.`, 'medium');
          }
        }
      ]
    });
    await alert.present();
  }

  // ----------------------------------------------------------------
  // Removes ALL items from the watchlist after a confirmation.
  // ----------------------------------------------------------------
  async clearAll() {
    if (this.watchlist.length === 0) return;

    const alert = await this.alertCtrl.create({
      header: 'Clear Watchlist',
      message: 'Are you sure you want to remove all watched items?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Clear All',
          role: 'destructive',
          handler: () => {
            // Remove each item individually
            this.watchlist.forEach(item => {
              this.dataService.removeFromWatchlist(item.commodity.id);
            });
            this.loadWatchlist();
            this.showToast('Watchlist cleared.', 'medium');
          }
        }
      ]
    });
    await alert.present();
  }

  // ----------------------------------------------------------------
  // Capacitor Haptics: medium vibration for feedback on removal
  // ----------------------------------------------------------------
  async triggerHaptic() {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      console.warn('Haptics not available');
    }
  }

  // ----------------------------------------------------------------
  // Helper: displays a brief toast notification
  // ----------------------------------------------------------------
  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
