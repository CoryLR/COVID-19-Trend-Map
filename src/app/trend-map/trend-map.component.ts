import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';

@Component({
  selector: 'app-trend-map',
  templateUrl: './trend-map.component.html',
  styleUrls: ['./trend-map.component.scss']
})
export class TrendMapComponent implements OnInit {

  map: any;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    // this.getData();
    this.map = this.initializeMap();
  }

  getData() {
    const url = '/api/getData';
    const body = { };
    this.http.post(url, body).subscribe((data: any) => {
      console.log(url, data);
    });
  }

  initializeMap() {
    const map = L.map('map', {
      attributionControl: false,
    }).setView([40, -98.5], 4);

    /* openStreetMap as backup basemap */
    const OpenStreetMap =  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { });
    map.addLayer(OpenStreetMap);
    return map;
  }

}
