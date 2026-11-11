import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { Commodity } from '../../models/commodity.model';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  standalone: false
})
export class LandingPage implements OnInit {
  private router = inject(Router);
  public dataService = inject(DataService);

  marketsCount = 33;
  commoditiesCount = 156;
  featuredCommodities: Commodity[] = [];
  todayDate: string = '';

  ngOnInit() {
    this.todayDate = new Date().toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    this.dataService.getCommodities().subscribe({
      next: (data) => {
        if (data && data.length) {
          this.commoditiesCount = data.length;
          this.featuredCommodities = data.slice(0, 3);
        }
      },
      error: (err) => console.error('Failed to load commodities for landing page', err)
    });

    this.dataService.getMarkets().subscribe({
      next: (data) => {
        if (data && data.length) {
          this.marketsCount = data.length;
        }
      },
      error: (err) => console.error('Failed to load markets for landing page', err)
    });
  }

  enterSystem(targetRoute: string = '/tabs/dashboard') {
    this.router.navigateByUrl(targetRoute);
  }
}
