import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { DatabaseRoutingModule } from './database-routing.module';
import { DatabasePage } from './database.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DatabaseRoutingModule
  ],
  declarations: [DatabasePage]
})
export class DatabasePageModule {}

