import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { ComparePageRoutingModule } from './compare-routing.module';
import { ComparePage } from './compare.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ComparePageRoutingModule
  ],
  declarations: [ComparePage]
})
export class ComparePageModule {}
