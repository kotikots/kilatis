import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { Commodity, Market, BasketItem } from '../../models/commodity.model';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-basket',
  templateUrl: './basket.page.html',
  styleUrls: ['./basket.page.scss'],
  standalone: false
})
export class BasketPage implements OnInit {
  allCommodities: Commodity[] = [];
  allMarkets: Market[] = [];
  basket: BasketItem[] = [];

  // Commodity search
  searchQuery = '';
  searchResults: Commodity[] = [];
  showSearchResults = false;

  // Market selector
  marketSearch = '';
  marketResults: Market[] = [];
  showMarketResults = false;
  selectedMarket: Market | null = null;

  // Budget management
  budget = 0;
  budgetInput = '';

  constructor(
    private dataService: DataService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadData();
    this.listenToBasketUpdates();
    this.listenToSelectedMarket();
  }

  ionViewWillEnter() {
    const sharedMarket = this.dataService.getSelectedMarket();
    if (sharedMarket) {
      this.selectedMarket = sharedMarket;
      this.marketSearch = sharedMarket.name;
    }
    this.basket = this.dataService.getBasket();
    this.refreshBasketPrices();
  }

  listenToBasketUpdates() {
    this.dataService.basket$.subscribe(items => {
      this.basket = items || [];
    });
  }

  listenToSelectedMarket() {
    this.dataService.selectedMarket$.subscribe(market => {
      if (market) {
        this.selectedMarket = market;
        this.marketSearch = market.name;
        this.refreshBasketPrices();
      }
    });
  }

  loadData() {
    this.dataService.getCommodities().subscribe(c => {
      this.allCommodities = c;
      this.refreshBasketPrices();
    });
    this.dataService.getMarkets().subscribe(m => {
      this.allMarkets = m;
    });
  }

  loadBasket() {
    this.basket = this.dataService.getBasket();
    this.refreshBasketPrices();
  }

  saveBasket() {
    this.dataService.saveBasket(this.basket);
  }

  // === COMMODITY SEARCH ===
  onCommoditySearch() {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.searchResults = [];
      this.showSearchResults = false;
      return;
    }
    this.searchResults = this.allCommodities
      .filter(c => c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
      .slice(0, 8);
    this.showSearchResults = true;
  }

  addToBasket(commodity: Commodity) {
    this.dataService.addToBasket(commodity, this.selectedMarket);
    this.showSearchResults = false;
    this.searchQuery = '';
    this.showToast(`Idinagdag ang ${commodity.name} sa basket`);
  }

  removeItem(index: number) {
    this.dataService.removeFromBasket(index);
  }

  updateQuantity(item: BasketItem, delta: number) {
    this.dataService.updateBasketItemQuantity(item.commodityId, delta);
  }

  // === MARKET SEARCH ===
  onMarketSearch() {
    const q = this.marketSearch.trim().toLowerCase();
    if (!q) {
      this.marketResults = [];
      this.showMarketResults = false;
      return;
    }
    this.marketResults = this.allMarkets
      .filter(m => m.name.toLowerCase().includes(q) || m.address.toLowerCase().includes(q))
      .slice(0, 6);
    this.showMarketResults = true;
  }

  selectMarket(market: Market) {
    this.selectedMarket = market;
    this.marketSearch = market.name;
    this.showMarketResults = false;
    this.dataService.setSelectedMarket(market);
    this.refreshBasketPrices();
  }

  clearMarket() {
    this.selectedMarket = null;
    this.marketSearch = '';
    this.showMarketResults = false;
    this.dataService.setSelectedMarket(null);
    this.refreshBasketPrices();
  }

  refreshBasketPrices() {
    if (!this.allCommodities || this.allCommodities.length === 0 || !this.basket || this.basket.length === 0) return;
    this.basket.forEach(item => {
      const commodity = this.allCommodities.find(c => c.id === item.commodityId);
      if (commodity) {
        item.pricePerUnit = this.selectedMarket
          ? this.dataService.getMarketPrice(commodity, this.selectedMarket).price
          : commodity.suggestedRetailPrice;
      }
    });
    this.saveBasket();
  }

  // === CALCULATIONS ===
  getItemTotal(item: BasketItem): number {
    return (item.pricePerUnit || 0) * item.quantity;
  }

  getGrandTotal(): number {
    return this.basket.reduce((sum, item) => sum + this.getItemTotal(item), 0);
  }

  getBudgetDiff(): number {
    return this.budget - this.getGrandTotal();
  }

  onBudgetChange() {
    this.budget = parseFloat(this.budgetInput) || 0;
  }

  // === ACTIONS ===
  async clearBasket() {
    const alert = await this.alertCtrl.create({
      header: 'Linisin ang Basket?',
      message: 'Sigurado ka bang nais mong tanggalin ang lahat ng laman ng iyong basket?',
      buttons: [
        { text: 'Kanselahin', role: 'cancel' },
        {
          text: 'Linisin',
          role: 'destructive',
          handler: () => {
            this.dataService.clearBasket();
          }
        }
      ]
    });
    await alert.present();
  }

  async showToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 1800,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  hideSearch() {
    setTimeout(() => {
      this.showSearchResults = false;
      this.showMarketResults = false;
    }, 250);
  }
}

