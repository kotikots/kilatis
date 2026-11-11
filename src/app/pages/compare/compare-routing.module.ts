import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ComparePage } from './compare.page';

const routes: Routes = [
  { path: '', component: ComparePage }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ComparePageRoutingModule {}

