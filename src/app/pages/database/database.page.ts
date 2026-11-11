import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, AlertController } from '@ionic/angular/lazy';
import { DataService, DEFAULT_COMMODITIES, DEFAULT_MARKETS } from '../../services/data.service';
import { AdminService } from '../../services/admin.service';
import { Commodity, Market } from '../../models/commodity.model';

@Component({
  selector: 'app-database',
  templateUrl: './database.page.html',
  styleUrls: ['./database.page.scss'],
  standalone: false
})
export class DatabasePage implements OnInit {
  private dataService = inject(DataService);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  adminService = inject(AdminService);
  private router = inject(Router);

  commodities: Commodity[] = [...DEFAULT_COMMODITIES];
  markets: Market[] = [...DEFAULT_MARKETS];
  /** markets currently selected for comparison – start with the first two */
  selectedMarkets: Market[] = [];
  isLoading = false;
  isCustom = false;

  // Staged import preview
  stagedCommodities: Commodity[] | null = null;
  importFileName = '';
  importErrorMessage = '';

  // Online Web Sync
  onlineFeedUrl = 'assets/data/commodities.json';
  isSyncing = false;

  /** Admin logout — clears session and returns to dashboard */
  logout(): void {
    this.adminService.logout();
    this.router.navigate(['/tabs/dashboard']);
  }

  ngOnInit() {
    this.loadData();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  loadData() {
    this.isCustom = this.dataService.hasCustomDatabase();

    this.dataService.getCommodities().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.commodities = data;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load commodities in DatabasePage:', err);
        this.isLoading = false;
      }
    });

    this.dataService.getMarkets().subscribe({
      next: (markets) => {
        if (markets && markets.length > 0) {
          this.markets = markets;
        }
        // Initialise comparison with first two markets
        this.initSelectedMarkets();
      },
      error: (err) => {
        console.error('Failed to load markets in DatabasePage:', err);
      }
    });
  }

  /** Initialise the selectedMarkets array with the first two markets */
  private initSelectedMarkets(): void {
    this.selectedMarkets = this.markets.slice(0, 2);
  }

  /** Add the next market (if any) to the comparison list */
  addMarket(): void {
    const existingIds = new Set(this.selectedMarkets.map(m => m.id));
    const nextMarket = this.markets.find(m => !existingIds.has(m.id));
    if (nextMarket) {
      this.selectedMarkets.push(nextMarket);
    } else {
      // optional toast feedback when no more markets are available
      this.toastCtrl.create({
        message: 'All markets are already selected.',
        duration: 2000,
        color: 'warning',
        position: 'bottom'
      }).then(t => t.present());
    }
  }


  // File Upload Handler
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.importFileName = file.name;
    this.importErrorMessage = '';
    this.stagedCommodities = null;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const text = reader.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name) {
            this.stagedCommodities = parsed;
          } else {
            throw new Error('Invalid JSON format. Expected an array of commodities.');
          }
        } else {
          // Parse CSV
          const parsed = this.dataService.parseCommoditiesCSV(text);
          if (parsed.length > 0) {
            this.stagedCommodities = parsed;
          } else {
            throw new Error('Could not parse valid commodity rows from CSV file.');
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to read file';
        this.importErrorMessage = message;
      }
    };

    reader.readAsText(file);
  }

  // Apply Staged Database
  async applyStagedData() {
    if (!this.stagedCommodities || this.stagedCommodities.length === 0) return;

    this.dataService.saveCustomCommodities(this.stagedCommodities);
    this.commodities = this.stagedCommodities;
    this.stagedCommodities = null;
    this.importFileName = '';
    this.isCustom = true;

    const toast = await this.toastCtrl.create({
      message: `Database updated! Loaded ${this.commodities.length} commodities.`,
      duration: 3000,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
  }

  // Reset to Baseline
  async confirmReset() {
    const alert = await this.alertCtrl.create({
      header: 'Reset to Official Baseline?',
      message: 'This will restore the default DA/DTI Bantay Presyo dataset and remove custom uploads.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reset',
          role: 'destructive',
          handler: async () => {
            this.dataService.resetToDefaultData();
            this.loadData();
            const toast = await this.toastCtrl.create({
              message: 'Database restored to official baseline.',
              duration: 2500,
              color: 'primary',
              position: 'bottom'
            });
            await toast.present();
          }
        }
      ]
    });
    await alert.present();
  }

  // Export to CSV
  downloadCSV() {
    console.log('downloadCSV clicked, commodities count:', this.commodities.length);
    const commoditiesToExport = (this.commodities && this.commodities.length > 0)
      ? this.commodities
      : [];

    const csvContent = this.dataService.exportToCSV(commoditiesToExport);
    this.triggerDownload(csvContent, 'palengke_bantay_presyo.csv', 'text/csv;charset=utf-8;');
  }

  // Export to JSON
  downloadJSON() {
    console.log('downloadJSON clicked, commodities count:', this.commodities.length);
    const jsonContent = JSON.stringify(this.commodities || [], null, 2);
    this.triggerDownload(jsonContent, 'palengke_commodities.json', 'application/json;charset=utf-8;');
  }

  private triggerDownload(content: string, filename: string, mimeType: string) {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 200);
    } catch (e) {
      console.error('Download error:', e);
    }
  }

  getTotalPricePoints(): number {
    return this.commodities.reduce((acc, c) => acc + (c.prices ? c.prices.length : 0), 0);
  }

  // Sync from Online Web Feed
  syncFromWeb() {
    this.isSyncing = true;
    this.dataService.syncOnlinePrices(this.onlineFeedUrl.trim()).subscribe({
      next: (items) => {
        this.commodities = items;
        this.isCustom = true;
        this.isSyncing = false;
        this.showToast(`✅ Successfully synced ${items.length} commodities from online feed!`, 'success');
      },
      error: (err) => {
        this.isSyncing = false;
        this.showToast('Failed to fetch from online feed. Please check the URL.', 'danger');
      }
    });
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'bottom',
      icon: color === 'success' ? 'checkmark-circle-outline' : 'information-circle-outline'
    });
    await toast.present();
  }
}

