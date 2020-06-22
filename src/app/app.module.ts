import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TrendMapComponent } from './trend-map/trend-map.component';

@NgModule({
  declarations: [
    AppComponent,
    TrendMapComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
