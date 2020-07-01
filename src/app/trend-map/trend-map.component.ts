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
  countyGeoJSON: any;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.map = this.initializeMap();
    this.getData();
  }

  getData() {
    const url = '/api/getData';
    const body = {};
    this.http.post(url, body).subscribe((response: any) => {
      console.log(url, response);
      this.updateMapData(response.geojson);
    });
  }

  initializeMap() {
    const map = L.map('map', {
      attributionControl: false,
    }).setView([40, -98.5], 4);

    /* openStreetMap as backup basemap */
    const OpenStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {});
    map.addLayer(OpenStreetMap);
    return map;
  }

  updateMapData(geojson) {

    const accelerationStyle = {
      // radius: 8,
      fillColor: "transparent",
      // color: "#000",
      weight: 0,
      opacity: 1,
      fillOpacity: 0.6
    };

    const setAccelerationStyle = (feature) => {
      let value = feature.properties["t21"][1];
      switch (true) {
        case (value > 50): accelerationStyle.fillColor = "#990000"; return accelerationStyle;
        case (value > 25): accelerationStyle.fillColor = "#ef6548"; return accelerationStyle;
        case (value > 0): accelerationStyle.fillColor = "#fef0d9"; return accelerationStyle;
        case (value == 0): return accelerationStyle;
        case (value >= -25): accelerationStyle.fillColor = "#c6dbef"; return accelerationStyle;
        case (value >= -50): accelerationStyle.fillColor = "#4292c6"; return accelerationStyle;
        case (value < -50): accelerationStyle.fillColor = "#084594"; return accelerationStyle;
        default: return accelerationStyle;
      }
    }

    let onEachFeature = (feature, layer) => {
      // does this feature have a property named popupContent?
      layer.bindPopup(`
      <strong>${feature.properties.NAME}</strong>
      <br>Rate: ${feature.properties["t21"][0]} cases (per 100k)
      <br>Acceleration: ${feature.properties["t21"][1]} cases (per 100k)
      `);
    }

    this.countyGeoJSON = L.geoJSON(geojson, {
      style: setAccelerationStyle,
      onEachFeature: onEachFeature
    });

    this.map.addLayer(this.countyGeoJSON);

    /* efficiently update GeoJSON style */
    // geojson_layer.eachLayer(function (layer) {  
    //   if(layer.feature.properties.NAME == 'feature 1') {    
    //     layer.setStyle({fillColor :'blue'}) 
    //   }
    // });

  }

}
