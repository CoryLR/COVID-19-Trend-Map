import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { trigger, state, style, animate, transition, } from '@angular/animations';

import * as L from 'leaflet';
import * as GeoSearch from 'leaflet-geosearch';
import * as leafletPip from '@mapbox/leaflet-pip'

@Component({
  selector: 'app-trend-map',
  templateUrl: './trend-map.component.html',
  styleUrls: ['./trend-map.component.scss'],
  animations: [
    trigger('panelOpenClosed', getPanelTransitions()),
    trigger('mapMinMax', getMapTransitions())
  ]
})
export class TrendMapComponent implements OnInit {

  map: any;
  infoPanelOpen: boolean = false;
  countyGeoJSON: any; /* GeoJSON Object format,  */
  countyDataLookup: {
    [FIPS_f00000: string]: number[][] /* [ [count, rate, acceleration] (x#) ] (non-normalized) */
  };
  weekDefinitions: {
    list: string[], lookup: { [timeStop_tN: string]: string }
  };
  latestTimeStop: { name: string, num: number }; /* Latest data available */
  currentTimeStop: { name: string, num: number };
  stateFipsLookup: { [StateFips_00: string]: { name: string, abbr: string } } = this.getStateFipsLookup();
  lastSelectedLayer: any;
  choroplethOrigin: string = "rate";// rate, acceleration, deaths

  // panelContent: { title?: string, subtitle?: string, rate?: number, acceleration?: number, cumulative?: number, accWordMoreLess?: string, accWordAccelDecel?: string, accWordAndBut?: string, } = { };
  panelContent: any = {};

  constructor(private http: HttpClient, private titleService: Title, private metaService: Meta) { }

  ngOnInit(): void {
    this.titleService.setTitle("COVID-19 Trend Map");
    this.metaService.addTags([
      { name: 'keywords', content: 'COVID-19, Coronavirus, Trend, JHU, Johns Hopkins' },
      { name: 'description', content: 'See COVID-19 trends where you live.' },
      // {name: 'robots', content: 'index, follow'},
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=0' }
    ]);
    this.map = this.initializeMap();
    this.getData();

    /* TODO: Animation
      - Use setInterval
      - Possible time-range options: Previous month, 3 months, all data
      - Idea for smooth animations: Do it The Prestige style with 2 layers fading back and forth

    */

    /* TODO: Use Leaflet's map.locate() to get the user's location and give it a URL scheme command */

    /* TODO: Add JHU's attribution, something like "All COVID-19 information is calculated from the COVID-19 Data Repository by the Center for Systems Science and Engineering (CSSE) at Johns Hopkins University" */

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
      console.log("this.countyDataLookup['31041']", this.countyDataLookup['31041']);
      console.log("this.countyDataLookup['08009']", this.countyDataLookup['08009']);
      console.log("response.geojson", response.geojson)

      this.updateMapData(response.geojson);

      // console.log("!! this.latestTimeStop", this.latestTimeStop);
      // console.log("!! this.currentTimeStop", this.currentTimeStop);
      // console.log("!! this.weekDefinitions", this.weekDefinitions);
      // console.log("this.weekDefinitions.lookup[this.currentTimeStop.name]", this.weekDefinitions.lookup[this.currentTimeStop.name]);
    });

  }

  initializeMap() {
    const map = L.map('map', {
      maxZoom: 14,
      minZoom: 3,
      maxBounds: L.latLngBounds([[80, -230], [-15, 15]]),
      zoomControl: false,
    })

    map.setView([40, -98.5], 4); /* TODO: Maybe use fitBounds with padding to account for panel size */

    L.control.zoom({
      position: 'topright'
    }).addTo(map);

    /* Basemaps */
    // const OpenStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {});
    // const Stamen_TonerLite = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', { ext: 'png' });
    // const Stamen_TonerHybrid = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-hybrid/{z}/{x}/{y}{r}.{ext}', { ext: 'png' });
    const CartoDB_PositronNoLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {});
    map.addLayer(CartoDB_PositronNoLabels);
    map.attributionControl.setPrefix('');
    map.attributionControl.addAttribution('Cartographer: Cory Leigh Rahman');
    var Stamen_TonerHybrid = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-hybrid/{z}/{x}/{y}{r}.{ext}', {
      // attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: 'abcd',
      minZoom: 0,
      maxZoom: 20,
      ext: 'png'
    });

    map.on('zoomend', () => {
      const zoomLevel = this.map.getZoom();
      if (zoomLevel >= 6) {
        if (!this.map.hasLayer(Stamen_TonerHybrid)) {
          this.map.addLayer(Stamen_TonerHybrid);
          this.countyGeoJSON.setStyle({ fillOpacity: 0.5 });
        }
      } else {
        if (this.map.hasLayer(Stamen_TonerHybrid)) {
          this.map.removeLayer(Stamen_TonerHybrid)
          this.countyGeoJSON.setStyle({ fillOpacity: 0.9 });
        }
      }
    });

    /* This is the default Leaflet Control and is somewhat customizable */

    const geoSearch = new GeoSearch.GeoSearchControl({
      provider: new GeoSearch.OpenStreetMapProvider(),
      style: "bar",
      showMarker: false,
      showPopup: false,
      autoClose: true,
      searchLabel: "Search for your County, Town, or City",
      classNames: { container: "geosearch-container", button: "geosearch-button", /* resetButton: "geosearch-resetButton", */ msgbox: "geosearch-msgbox", form: "geosearch-form", input: "geosearch-input" },
      retainZoomLevel: true,
      autoCompleteDelay: 500,
    });
    map.addControl(geoSearch);
    map.on('geosearch/showlocation', (place) => { this.locationSelected(place) });

    return map;
  }

  locationSelected(place) {
    const locationInfo = place.location.label.split(", ");
    const topLevelLocation = locationInfo.slice(-1);
    const secondLevelLocation = locationInfo.slice(-2)[0];
    console.log("place", place);
    console.log("locationInfo", locationInfo);
    try {
      this.map.closePopup();
      this.lastSelectedLayer.setStyle({ weight: 0/* , color: "white" */ });
    } catch (e) { }
    if (topLevelLocation == "United States of America") {
      if (locationInfo.length > 2) {
        /* Testing */
        let matchedLayer = leafletPip.pointInLayer([place.location.x, place.location.y], this.countyGeoJSON, true)[0];
        // console.log("matchedLayer", matchedLayer);
        // console.log("matchedLayer.getBounds()", matchedLayer.getBounds());

        /* Update Map */
        this.map.flyToBounds(matchedLayer.getBounds().pad(1)/* , { duration: 1.5 } */);
        this.map.once('zoomend', () => {
          matchedLayer.bringToFront();
          matchedLayer.setStyle({ weight: 6/* , color: "black" */ });
          const popupText = `<strong>${locationInfo[0]}, </strong>${locationInfo.slice(1, -1).join(", ")}`
          this.map.openPopup(popupText, [place.location.y, place.location.x])
          // matchedLayer.openPopup(); // This is for opening the normal click-popup
          setTimeout(() => {
            this.infoPanelOpen = true;
          }, 250)
        });

        /* Update Info Panel */
        // title: "Natchitoches", subtitle: "Louisiana", rate: 20,
        // acceleration: 10, cumulative: 300, accWord: "more",

        const countyData = this.countyDataLookup[`${matchedLayer.feature.properties.FIPS}`][this.latestTimeStop.num]

        let cumulative: number = countyData[0];
        let rate: number = countyData[1];
        let acceleration: number = countyData[2];

        this.panelContent.title = matchedLayer.feature.properties.NAME;
        this.panelContent.subtitle = this.stateFipsLookup[matchedLayer.feature.properties.FIPS.substr(0, 2)].name;
        this.panelContent.rate = this.styleNum(rate);
        this.panelContent.acceleration = acceleration < 0 ? `-${this.styleNum(Math.abs(acceleration))}` : this.styleNum(Math.abs(acceleration));
        this.panelContent.cumulative = this.styleNum(cumulative);
        this.panelContent.date = this.weekDefinitions.lookup[this.currentTimeStop.name];

        // {{panelContent.title}} is reporting new cases of COVID-19 this week {{panelContent.accWordAndBut}} the number of new cases is {{panelContent.accWordAccelDecel}}.

        // let summaryString = `${this.panelContent.title} is reporting`;
        // if (rate > 0) {
        //   summaryString += " new cases of COVID-19 this week";
        //   summaryString += acceleration >= 0 ? " and" : " but";
        //   summaryString += " the number of new cases is";
        //   summaryString += acceleration > 0 ? " accelerating."
        //     : acceleration == 0 ? "steady." : " decelerating."
        // } else {
        //   summaryString += "no new cases of COVID-19 this week.";
        // }

        this.panelContent.summary = `${this.panelContent.title} is reporting <strong>${this.panelContent.rate} new cases</strong> of COVID-19 over the past week ${acceleration >= 0 || rate == 0 ? "and" : "but"} the rate of ${rate > 0 ? "" : "no"} new cases is <strong>${acceleration > 0 ? "accelerating." : acceleration == 0 ? "steady." : "decelerating."}</strong>`;



        // this.panelContent.accWordMoreLess = countyData[2] > 0 ? "more" : "less";
        // this.panelContent.accWordAccelDecel = countyData[2] > 0 ? "accelerating" : "decelerating";
        // this.panelContent.accWordAndBut = countyData[2] > 0 ? "and" : "but";

        this.lastSelectedLayer = matchedLayer;
        /* TODO: Exception for Alaska and places within */
      } else {
        this.map.flyToBounds(place.location.bounds);
      }
    } else if (locationInfo.length == 1 && topLevelLocation == "United States") {
      this.map.flyTo([40, -98.5], 4/* , { duration: 1.5 } */);
    } else {
      const currentView = this.map.getBounds();
      alert("Location not found in the U.S.");
      setTimeout(() => {
        this.map.fitBounds(currentView);
      }, 50)
    }
    setTimeout(() => {
      /* Fix bug where the map needs to be clicked twice to show a popup */
      this.eventFire(document.getElementById('map'), 'click');
    }, 200);
  }

  updateMapData(geojson) {

    // console.log("TESTING", this.countyDataLookup[`40001`][this.latestTimeStop.num][0])
    let onEachFeature = (feature: any, layer: any) => {
      // TODO: if this feature has a property named popupContent, update popupContent, otherwise .bindPopup

      const countyData = this.countyDataLookup[`${feature.properties.FIPS}`][this.latestTimeStop.num]
      const stateName = this.stateFipsLookup[feature.properties.FIPS.substr(0, 2)].name
      layer.bindPopup(`
      <strong>${feature.properties.NAME}</strong>, ${stateName} [<em>${feature.properties.FIPS}</em>]
      <br>New This Week: <strong>${this.styleNum(countyData[1])}</strong> (${feature.properties[this.currentTimeStop.name][0]} per 100k)
      <br>Acceleration: <strong>${this.styleNum(countyData[2])}</strong> (${feature.properties[this.currentTimeStop.name][1]} per 100k)
      <br>Cumulative Cases: <strong>${this.styleNum(countyData[0])}</strong>
      `);
      /* TODO:  - Use Math.abs() for Acceleration and use "more/less new cases than previous week"
                - Make Acceleration dynamic if 0, e.g. "Weeks since last new case: 2"  */
    }

    const countyStyle = {
      // radius: 8,
      fillColor: "transparent",
      color: "black", /* This is the focus color */
      weight: 0, /* Weight gets toggled to focus a particular region */
      opacity: 1,
      fillOpacity: 0.9
    };

    let styleFunction: any;
    if (this.choroplethOrigin === "rate") {
      styleFunction = this.getRateStyleFunction(countyStyle);
    } else if (this.choroplethOrigin === "acceleration") {
      styleFunction = this.getAccelerationStyleFunction(countyStyle);
    } else {
      styleFunction = this.getRateStyleFunction(countyStyle);
    }

    this.countyGeoJSON = L.geoJSON(geojson, {
      smoothFactor: 0.6,
      style: styleFunction,
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

  closePanel() {
    this.infoPanelOpen = false;
    this.lastSelectedLayer.setStyle({ weight: 0/* , color: "white" */ });
    // setTimeout(() => {
    // this.map.invalidateSize();
    // }, 750)
  }

  styleNum(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  getAccelerationStyleFunction(style) {
    return (feature) => {
      const timeStopData = this.countyDataLookup[feature.properties.FIPS][this.currentTimeStop.num]
      const value = timeStopData[4];// 4 = pop-normalized acceleration
      switch (true) {
        case (value > 200): style.fillColor = "#5e0000"; return style;
        case (value > 50): style.fillColor = "#990000"; return style;
        case (value > 25): style.fillColor = "#d4644d"; return style;
        case (value > 0): style.fillColor = "#fef0d9"; return style;
        case (value == 0): style.fillColor = "lightgray"; return style;
        case (value >= -25): style.fillColor = "#cddcea"; return style;
        case (value >= -50): style.fillColor = "#90a1ad"; return style;
        case (value < -50): style.fillColor = "#434d5b"; return style;
        default: return style;
      }
    }
  }
  getRateStyleFunction(style) {
    return (feature) => {
      const timeStopData = this.countyDataLookup[feature.properties.FIPS][this.currentTimeStop.num]
      const value = timeStopData[3];// 3 = pop-normalized rate
      switch (true) {
        case (value > 400): style.fillColor = "hsl(0, 100%, 17%)"; return style;
        case (value > 200): style.fillColor = "hsl(0, 64%, 34%)"; return style;
        case (value > 100): style.fillColor = "hsl(0, 43%, 52%)"; return style;
        case (value > 50): style.fillColor = "hsl(15, 57%, 75%)"; return style;
        case (value > 0): style.fillColor = "hsl(30, 62%, 93%)"; return style;
        case (value <= 0): style.fillColor = "hsl(0, 0%, 95%)"; return style;
        default: return style;
      }
    }
  }

  getStateFipsLookup() {
    return { "01": { "name": "Alabama", "abbr": "AL" }, "02": { "name": "Alaska", "abbr": "AK" }, "03": { "name": "American Samoa", "abbr": "AS" }, "04": { "name": "Arizona", "abbr": "AZ" }, "05": { "name": "Arkansas", "abbr": "AR" }, "06": { "name": "California", "abbr": "CA" }, "07": { "name": "Canal Zone", "abbr": "CZ" }, "08": { "name": "Colorado", "abbr": "CO" }, "09": { "name": "Connecticut", "abbr": "CT" }, "10": { "name": "Delaware", "abbr": "DE" }, "11": { "name": "District of Columbia", "abbr": "DC" }, "12": { "name": "Florida", "abbr": "FL" }, "13": { "name": "Georgia", "abbr": "GA" }, "14": { "name": "Guam", "abbr": "GU" }, "15": { "name": "Hawaii", "abbr": "HI" }, "16": { "name": "Idaho", "abbr": "ID" }, "17": { "name": "Illinois", "abbr": "IL" }, "18": { "name": "Indiana", "abbr": "IN" }, "19": { "name": "Iowa", "abbr": "IA" }, "20": { "name": "Kansas", "abbr": "KS" }, "21": { "name": "Kentucky", "abbr": "KY" }, "22": { "name": "Louisiana", "abbr": "LA" }, "23": { "name": "Maine", "abbr": "ME" }, "24": { "name": "Maryland", "abbr": "MD" }, "25": { "name": "Massachusetts", "abbr": "MA" }, "26": { "name": "Michigan", "abbr": "MI" }, "27": { "name": "Minnesota", "abbr": "MN" }, "28": { "name": "Mississippi", "abbr": "MS" }, "29": { "name": "Missouri", "abbr": "MO" }, "30": { "name": "Montana", "abbr": "MT" }, "31": { "name": "Nebraska", "abbr": "NE" }, "32": { "name": "Nevada", "abbr": "NV" }, "33": { "name": "New Hampshire", "abbr": "NH" }, "34": { "name": "New Jersey", "abbr": "NJ" }, "35": { "name": "New Mexico", "abbr": "NM" }, "36": { "name": "New York", "abbr": "NY" }, "37": { "name": "North Carolina", "abbr": "NC" }, "38": { "name": "North Dakota", "abbr": "ND" }, "39": { "name": "Ohio", "abbr": "OH" }, "40": { "name": "Oklahoma", "abbr": "OK" }, "41": { "name": "Oregon", "abbr": "OR" }, "42": { "name": "Pennsylvania", "abbr": "PA" }, "43": { "name": "Puerto Rico", "abbr": "PR" }, "44": { "name": "Rhode Island", "abbr": "RI" }, "45": { "name": "South Carolina", "abbr": "SC" }, "46": { "name": "South Dakota", "abbr": "SD" }, "47": { "name": "Tennessee", "abbr": "TN" }, "48": { "name": "Texas", "abbr": "TX" }, "49": { "name": "Utah", "abbr": "UT" }, "50": { "name": "Vermont", "abbr": "VT" }, "51": { "name": "Virginia", "abbr": "VA" }, "52": { "name": "Virgin Islands", "abbr": "VI" }, "53": { "name": "Washington", "abbr": "WA" }, "54": { "name": "West Virginia", "abbr": "WV" }, "55": { "name": "Wisconsin", "abbr": "WI" }, "56": { "name": "Wyoming", "abbr": "WY" }, "72": { "name": "Puerto Rico", "abbr": "PR" } }
  }

  eventFire(el, etype) {
    if (el.fireEvent) {
      el.fireEvent('on' + etype);
    } else {
      var evObj = document.createEvent('Events');
      evObj.initEvent(etype, true, false);
      el.dispatchEvent(evObj);
    }
  }

}

function getPanelTransitions() {
  return [
    state('open', style({
      left: '0',
    })),
    state('closed', style({
      left: '-300px',
    })),
    transition('open => closed', [
      animate('0.25s')
    ]),
    transition('closed => open', [
      animate('0.25s')
    ]),
  ]
}

function getMapTransitions() {
  return [
    state('max', style({
      left: '0',
      width: '100%',
    })),
    state('min', style({
      left: '280px',
      width: 'calc( 100% - 280px )',
    })),
    transition('max => min', [
      animate('0.25s')
    ]),
    transition('min => max', [
      animate('0.25s')
    ]),
  ]
}
