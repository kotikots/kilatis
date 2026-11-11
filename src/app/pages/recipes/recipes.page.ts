import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { Commodity, Market, Recipe, BasketItem } from '../../models/commodity.model';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-recipes',
  templateUrl: './recipes.page.html',
  styleUrls: ['./recipes.page.scss'],
  standalone: false
})
export class RecipesPage implements OnInit {
  recipes: Recipe[] = [];
  allCommodities: Commodity[] = [];
  allMarkets: Market[] = [];

  // Market selector
  selectedMarket: Market | null = null;
  marketSearch = '';
  marketResults: Market[] = [];
  showMarketResults = false;

  // Selected recipe detail
  selectedRecipe: Recipe | null = null;
  servingsMultiplier = 1;

  // Filtering
  filterCategory = 'All';
  categories = ['All', 'Combos', 'Soup', 'Main Dish', 'Vegetables', 'Seafood', 'Egg Dish', 'Rice Dish'];
  searchQuery = '';

  constructor(
    private dataService: DataService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  loadData() {
    this.dataService.getRecipes().subscribe(r => {
      this.recipes = r;
    });
    this.dataService.getCommodities().subscribe(c => {
      this.allCommodities = c;
    });
    this.dataService.getMarkets().subscribe(m => {
      this.allMarkets = m;
      if (!this.selectedMarket) {
        const active = this.dataService.getSelectedMarket();
        if (active) {
          this.selectedMarket = active;
          this.marketSearch = active.name;
        } else {
          try {
            const saved = localStorage.getItem('kilatis_home_market');
            if (saved) {
              const parsed = JSON.parse(saved);
              const found = this.allMarkets.find(market => market.id === parsed.id || market.name === parsed.name);
              if (found) {
                this.selectedMarket = found;
                this.marketSearch = found.name;
              }
            }
          } catch (e) {}
        }
      }
    });
  }

  get filteredRecipes(): Recipe[] {
    return this.recipes.filter(r => {
      const matchCat = this.filterCategory === 'All' || r.category === this.filterCategory;
      const matchSearch = !this.searchQuery ||
        r.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }

  selectRecipe(recipe: Recipe) {
    this.selectedRecipe = recipe;
    this.servingsMultiplier = 1;
  }

  closeRecipe() {
    this.selectedRecipe = null;
  }

  // Market selection
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
  }

  clearMarket() {
    this.selectedMarket = null;
    this.marketSearch = '';
    this.showMarketResults = false;
  }

  hideMarketSearch() {
    setTimeout(() => {
      this.showMarketResults = false;
    }, 250);
  }

  // Commodity matching helper
  findCommodityForIngredient(name: string): Commodity | undefined {
    if (!this.allCommodities || this.allCommodities.length === 0) return undefined;
    const cleanTarget = name.toLowerCase().split('(')[0].trim();

    return this.allCommodities.find(c => {
      const cClean = c.name.toLowerCase();
      if (cClean.includes(cleanTarget) || cleanTarget.includes(cClean.split('(')[0].trim())) return true;
      const tokens = cleanTarget.split(/\s+/).filter(t => t.length > 2);
      if (tokens.length > 0 && tokens.every(t => cClean.includes(t))) return true;
      return false;
    });
  }

  getIngredientPrice(ingredientName: string): number {
    const commodity = this.findCommodityForIngredient(ingredientName);
    if (!commodity) return 60; // fallback standard unit price

    if (this.selectedMarket) {
      return this.dataService.getMarketPrice(commodity, this.selectedMarket).price;
    }
    return commodity.suggestedRetailPrice;
  }

  getIngredientTotal(quantity: number, ingredientName: string): number {
    const pricePerUnit = this.getIngredientPrice(ingredientName);
    return pricePerUnit * quantity * this.servingsMultiplier;
  }

  getRecipeTotalCost(recipe: Recipe): number {
    if (!recipe || !recipe.ingredients) return 0;
    return recipe.ingredients.reduce((sum, ing) => {
      return sum + this.getIngredientTotal(ing.quantity, ing.commodityName);
    }, 0);
  }

  getCostPerServing(recipe: Recipe): number {
    const total = this.getRecipeTotalCost(recipe);
    const count = (recipe.servings || 4) * this.servingsMultiplier;
    return count > 0 ? total / count : 0;
  }

  // Add all ingredients of recipe directly to basket
  async addAllToBasket(recipe: Recipe) {
    let basket: BasketItem[] = [];
    try {
      const saved = localStorage.getItem('palengke_basket');
      basket = saved ? JSON.parse(saved) : [];
    } catch {
      basket = [];
    }

    recipe.ingredients.forEach(ing => {
      const commodity = this.findCommodityForIngredient(ing.commodityName);
      const qtyToAdd = +(ing.quantity * this.servingsMultiplier).toFixed(2);

      if (commodity) {
        const existing = basket.find(b => b.commodityId === commodity.id);
        if (existing) {
          existing.quantity = +(existing.quantity + qtyToAdd).toFixed(2);
        } else {
          const resolvedPrice = this.selectedMarket
            ? this.dataService.getMarketPrice(commodity, this.selectedMarket).price
            : commodity.suggestedRetailPrice;

          basket.push({
            commodityId: commodity.id,
            commodityName: commodity.name,
            quantity: qtyToAdd,
            unit: ing.unit,
            icon: commodity.icon || 'basket-outline',
            pricePerUnit: resolvedPrice
          });
        }
      } else {
        // Fallback placeholder item
        basket.push({
          commodityId: 9000 + Math.floor(Math.random() * 900),
          commodityName: ing.commodityName,
          quantity: qtyToAdd,
          unit: ing.unit,
          icon: 'nutrition-outline',
          pricePerUnit: 60
        });
      }
    });

    this.dataService.saveBasket(basket);

    const toast = await this.toastCtrl.create({
      message: `Idinagdag ang sangkap ng ${recipe.name} sa Basket!`,
      duration: 2500,
      color: 'success',
      position: 'bottom',
      buttons: [
        {
          text: 'Pumunta sa Basket',
          handler: () => {
            this.router.navigate(['/tabs/basket']);
          }
        }
      ]
    });
    await toast.present();
  }
}

