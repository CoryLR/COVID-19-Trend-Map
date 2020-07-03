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
  countyGeoJSON: any; /* GeoJSON Object format,  */
  countyDataLookup: {
    [FIPS_f00000: string]: number[][] /* [[count, rate, acceleration] (x tN)] (non-normalized) */
  };
  weekDefinitions: {
    list: string[],
    lookup: { [timeStop_tN: string]: string }
  };
  latestTimeStop: { name: string, num: number }; /* Latest data available */
  currentTimeStop: { name: string, num: number };
  stateFipsLookup: { [StateFips_AA: string]: { name: string, abbr: string } } = this.getStateFipsLookup();

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.map = this.initializeMap();
    this.getData();
    console.log("test")

    /* TODO: Animation
      - Use setInterval
      - Possible time-range options: Previous month, 3 months, all data
      - Idea for smooth animations: Do it The Prestige style with 2 layers fading back and forth

    */

  }

  getData() {
    const url = '/api/getData';
    const body = {};
    this.http.post(url, body).subscribe((response: any) => {
      this.weekDefinitions = response.weekdefinitions;
      this.countyDataLookup = response.datalookup;
      this.latestTimeStop = {
        name: Object.keys(this.weekDefinitions.lookup).slice(-1)[0],
        num: this.weekDefinitions.list.length - 1
      }
      this.currentTimeStop = {
        name: this.latestTimeStop.name,
        num: this.latestTimeStop.num
      }
      console.log("this.weekDefinitions", this.weekDefinitions);
      console.log("this.countyDataLookup", this.countyDataLookup);

      this.updateMapData(response.geojson);
    });
  }

  initializeMap() {
    const map = L.map('map').setView([40, -98.5], 4);

    /* openStreetMap as backup basemap */
    const OpenStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {});
    map.addLayer(OpenStreetMap);
    
    map.attributionControl.setPrefix('');
    map.attributionControl.addAttribution('Cartographer: Cory Leigh Rahman');
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
      let value = feature.properties["t22"][1];
      switch (true) {
        case (value > 50): accelerationStyle.fillColor = "#990000"; return accelerationStyle;
        case (value > 25): accelerationStyle.fillColor = "#ef6548"; return accelerationStyle;
        case (value > 0): accelerationStyle.fillColor = "#fef0d9"; return accelerationStyle;
        case (value == 0): accelerationStyle.fillColor = "lightgray"; return accelerationStyle;
        case (value >= -25): accelerationStyle.fillColor = "#c6dbef"; return accelerationStyle;
        case (value >= -50): accelerationStyle.fillColor = "#4292c6"; return accelerationStyle;
        case (value < -50): accelerationStyle.fillColor = "#084594"; return accelerationStyle;
        default: return accelerationStyle;
      }
    }

    console.log("TESTING", this.countyDataLookup[`f40001`][this.latestTimeStop.num][0])
    let onEachFeature = (feature: any, layer: any) => {
      // TODO: if this feature has a property named popupContent, update popupContent, otherwise .bindPopup

      const countyData = this.countyDataLookup[`f${feature.properties.FIPS}`][this.latestTimeStop.num]
      const stateName = this.stateFipsLookup[feature.properties.FIPS.substr(0, 2)].name
      layer.bindPopup(`
      <strong>${feature.properties.NAME}</strong>, ${stateName}
      <br>Cumulative Cases: <strong>${this.styleNum(countyData[0])}</strong>
      <br>New This Week: <strong>${this.styleNum(countyData[1])}</strong>
      <br>Acceleration: <strong>${this.styleNum(countyData[2])}</strong>
      `);
      /* TODO:  - Use Math.abs() for Acceleration and use "more/less new cases than previous week"
                - Make Acceleration dynamic if 0, e.g. "Weeks since last new case: 2"  */
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

  styleNum(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  getStateFipsLookup() {
    return { "01": { "name": "Alabama", "abbr": "AL" }, "02": { "name": "Alaska", "abbr": "AK" }, "03": { "name": "American Samoa", "abbr": "AS" }, "04": { "name": "Arizona", "abbr": "AZ" }, "05": { "name": "Arkansas", "abbr": "AR" }, "06": { "name": "California", "abbr": "CA" }, "07": { "name": "Canal Zone", "abbr": "CZ" }, "08": { "name": "Colorado", "abbr": "CO" }, "09": { "name": "Connecticut", "abbr": "CT" }, "10": { "name": "Delaware", "abbr": "DE" }, "11": { "name": "District Of Columbia", "abbr": "DC" }, "12": { "name": "Florida", "abbr": "FL" }, "13": { "name": "Georgia", "abbr": "GA" }, "14": { "name": "Guam", "abbr": "GU" }, "15": { "name": "Hawaii", "abbr": "HI" }, "16": { "name": "Idaho", "abbr": "ID" }, "17": { "name": "Illinois", "abbr": "IL" }, "18": { "name": "Indiana", "abbr": "IN" }, "19": { "name": "Iowa", "abbr": "IA" }, "20": { "name": "Kansas", "abbr": "KS" }, "21": { "name": "Kentucky", "abbr": "KY" }, "22": { "name": "Louisiana", "abbr": "LA" }, "23": { "name": "Maine", "abbr": "ME" }, "24": { "name": "Maryland", "abbr": "MD" }, "25": { "name": "Massachusetts", "abbr": "MA" }, "26": { "name": "Michigan", "abbr": "MI" }, "27": { "name": "Minnesota", "abbr": "MN" }, "28": { "name": "Mississippi", "abbr": "MS" }, "29": { "name": "Missouri", "abbr": "MO" }, "30": { "name": "Montana", "abbr": "MT" }, "31": { "name": "Nebraska", "abbr": "NE" }, "32": { "name": "Nevada", "abbr": "NV" }, "33": { "name": "New Hampshire", "abbr": "NH" }, "34": { "name": "New Jersey", "abbr": "NJ" }, "35": { "name": "New Mexico", "abbr": "NM" }, "36": { "name": "New York", "abbr": "NY" }, "37": { "name": "North Carolina", "abbr": "NC" }, "38": { "name": "North Dakota", "abbr": "ND" }, "39": { "name": "Ohio", "abbr": "OH" }, "40": { "name": "Oklahoma", "abbr": "OK" }, "41": { "name": "Oregon", "abbr": "OR" }, "42": { "name": "Pennsylvania", "abbr": "PA" }, "43": { "name": "Puerto Rico", "abbr": "PR" }, "44": { "name": "Rhode Island", "abbr": "RI" }, "45": { "name": "South Carolina", "abbr": "SC" }, "46": { "name": "South Dakota", "abbr": "SD" }, "47": { "name": "Tennessee", "abbr": "TN" }, "48": { "name": "Texas", "abbr": "TX" }, "49": { "name": "Utah", "abbr": "UT" }, "50": { "name": "Vermont", "abbr": "VT" }, "51": { "name": "Virginia", "abbr": "VA" }, "52": { "name": "Virgin Islands", "abbr": "VI" }, "53": { "name": "Washington", "abbr": "WA" }, "54": { "name": "West Virginia", "abbr": "WV" }, "55": { "name": "Wisconsin", "abbr": "WI" }, "56": { "name": "Wyoming", "abbr": "WY" }, "72": { "name": "Puerto Rico", "abbr": "PR" } }
  }

}
