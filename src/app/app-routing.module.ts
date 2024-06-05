import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { GeeComponent } from './google-ee/gee/gee.component';
import { Neo4jComponent } from './google-ee/neo4j/neo4j.component';


const routes: Routes = [
  {
    path: '',
    redirectTo: 'google-earth-engine',
    pathMatch: 'full'
  },
  { path: 'google-earth-engine', component: GeeComponent },
  { path: 'neo4j', component: Neo4jComponent }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
