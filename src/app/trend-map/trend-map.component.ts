import { Component, ElementRef, OnInit, Renderer2, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { trigger, state, style, animate, transition, keyframes, } from '@angular/animations';
import { ActivatedRoute } from '@angular/router';

import * as L from 'leaflet';
import * as GeoSearch from 'leaflet-geosearch';
import * as leafletPip from '@mapbox/leaflet-pip'
/* TODO: Replace leaflet-pip's pointInLayer with leaflet-geometryutil's closestLayer (npm i leaflet-geometryutil) */
import { ChartDataSets, ChartOptions } from 'chart.js';
import { Color, Label } from 'ng2-charts';
import { faInfoCircle, faInfo, faFileMedicalAlt, faPlay, faPause, faArrowUp, faArrowDown, faChartLine, faTimesCircle, faCircle, faSearch } from '@fortawesome/free-solid-svg-icons';
import { faPlusSquare } from '@fortawesome/free-regular-svg-icons';

/* TODO: Contribute to @types/leaflet to fix these types */
export interface CustomTileLayerOptions extends L.TileLayerOptions {
  ext?: string;
}
export interface CustomGeoJSONOptions extends L.GeoJSONOptions {
  smoothFactor?: number;
  interactive?: boolean;
  dashArray?: string;
}

@Component({
  selector: 'app-trend-map',
  templateUrl: './trend-map.component.html',
  styleUrls: ['./trend-map.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('panelOpenClosed', getPanelTransitions()),
    // trigger('mapMinMax', getMapTransitions()),
    trigger('ngIfAnimation', getNgIfAnimation()),
    // trigger('layerInfoCollapseAnimation', getLayerInfoCollapseAnimation()),
  ]
})
export class TrendMapComponent implements OnInit {

  /* * Component Pseudo-Global Variables * */

  /* Map Data Control */
  map: any;
  countyGeoJSON: any; /* GeoJSON Object format,  */
  stateGeoJSON: any; /* GeoJSON Object format,  */
  nationalGeoJSON: any; /* GeoJSON Object format,  */
  countyLayerLookup: { [FIPS_00000: string]: any } = {};
  stateLayerLookup: { [FIPS_00: string]: any } = {};
  nationalLayerLookup: { [FIPS_0: string]: any } = {};
  lastSelectedLayer: any;
  choroplethDisplayAttribute: number = 3;// 3(rateNormalized), 4(accelerationNormalized), 5(streak)
  mapZoomedIn: boolean = false;
  layerSelection: any = {
    layer: "ccr",
    alias: "County Case Rate"
  }

  /* Component Coordination */
  countyDataLookup: { [FIPS_00000: string]: { name: string, data: number[][] } };
  stateDataLookup: { [FIPS_00: string]: { name: string, data: number[][] } };
  nationalDataLookup: { [FIPS_0: string]: { name: string, data: number[][] } };
  geoJsonCountyLookup: { [FIPS_00000: string]: any }; /* Contains references to each county in the GeoJSON layer */

  /* Temporal Coordination */
  latestTimeStop: { name: string, num: number }; /* Latest data available */
  currentTimeStop: { name: string, num: number };
  animationInterval: any;
  animationPaused: boolean = true;

  /* UI Text Content Control */
  panelContent: any = {};// panelContent: { title?: string, subtitle?: string, rate?: number, acceleration?: number, cumulative?: number, accWordMoreLess?: string, accWordAccelDecel?: string, accWordAndBut?: string, } = { };
  weekDefinitions: { list: string[], lookup: { [timeStop_tN: string]: string } };
  stateFipsLookup: { [StateFips_00: string]: { name: string, abbr: string } } = this.getStateFipsLookup();
  stateNameList: string[] = [];
  legendContent: any = {
    colorSchemeData: this.getLegendColorSchemeRateData(),
    layerDescription: "New COVID-19 Cases (7-day total per 100k people)"
  }
  legendColorSchemeData: any = this.getLegendColorSchemeRateData();
  legendLayerInfoOpen = true;

  /* Font Awesome Icons */
  faInfoCircle = faInfoCircle;
  faInfo = faInfo;
  faFileMedicalAlt = faFileMedicalAlt;
  faPlay = faPlay;
  faPause = faPause;
  faArrowUp = faArrowUp;
  faArrowDown = faArrowDown;
  faPlusSquare = faPlusSquare;
  faChartLine = faChartLine;
  faTimesCircle = faTimesCircle;
  faCircle = faCircle;
  faSearch = faSearch;

  /* State Control */
  infoPanelOpen: boolean = false;
  initialLoadingDone: boolean = false;

  /* Chart */
  statusReportChartConfig: any = {};
  verticalLinePlugin: any = this.getVerticalLinePlugin();

  /* Misc */
  window = window;
  windowWidth: number = 0;
  // windowWidth: any;

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.windowWidth = event.target.innerWidth;
  }
  
  constructor(private http: HttpClient, private titleService: Title, private metaService: Meta, private elementRef: ElementRef, private route: ActivatedRoute, renderer: Renderer2, /* private document: Document */) { }
  
  ngOnInit(): void {
    setTimeout(() => {
      
      this.windowWidth = window.innerWidth;
      this.titleService.setTitle("COVID-19-Watch");
      
      this.metaService.addTags([
        { name: 'keywords', content: 'COVID-19, Coronavirus, Trend, JHU, Johns Hopkins' },
        { name: 'description', content: 'See COVID-19 trends where you live.' },
        // {name: 'robots', content: 'index, follow'},
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=0' }
      ]);

      this.map = this.initializeMap();
      this.getData();

      for (let key in this.stateFipsLookup) {
        if (key in this.stateFipsLookup) {
          this.stateNameList.push(this.stateFipsLookup[key].name);
        }
      }


      /* TODO: Use Leaflet's map.locate() to get the user's location and give it a URL scheme command */

      /* TODO: Add JHU's attribution, something like "All COVID-19 information is calculated from the COVID-19 Data Repository by the Center for Systems Science and Engineering (CSSE) at Johns Hopkins University" */
    }, 0);
  }

  actOnUrlScheme() {
    this.route.queryParams
      .subscribe(params => {
        // console.log("URL params: ", params); // e.g. { fips: "51059" }
        if(params.fips) {
          const selectedLayer = params.fips.length === 2 ? this.stateLayerLookup[params.fips] : params.fips.length === 1 ? this.nationalLayerLookup[params.fips] : this.countyLayerLookup[params.fips];
          if (selectedLayer) {
            this.map.fitBounds(selectedLayer.getBounds().pad(1));
            this.openStatusReport(selectedLayer);  
          }
        }
      });
  }

  getData() {
    const url = '/api/getData';
    const body = {};
    this.http.post(url, body).subscribe((response: any) => {
      // console.log("Data Package:\n", response);
      this.weekDefinitions = response.weekDefinitions;
      this.countyDataLookup = response.county.dataLookup;
      this.stateDataLookup = response.state.dataLookup;
      this.nationalDataLookup = response.national.dataLookup;
      this.latestTimeStop = {
        name: Object.keys(this.weekDefinitions.lookup).slice(-1)[0],
        num: this.weekDefinitions.list.length - 1
      }
      this.currentTimeStop = {
        name: this.latestTimeStop.name,
        num: this.latestTimeStop.num
      }

      /* Useful for debugging */
      console.log("Data Source:", response.source);
      // console.log("Data Package:", response);
      // Good FIPS test-cases to log: 31041, 08009

      this.initMapData(response.county.geoJson, response.state.geoJson, response.national.geoJson);

      this.actOnUrlScheme();

    });

  }

  initializeMap() {
    const map = L.map('map', {
      maxZoom: 14,
      minZoom: 3,
      maxBounds: L.latLngBounds([[80, -230], [-50, 15]]),
      zoomControl: false,
    })

    if (this.windowWidth > 750) {
      map.setView([30, -98.5], 4);
    } else {
      map.setView([30, -96], 3);
    }

    L.control.zoom({
      position: 'topright'
    }).addTo(map);

    /* Basemaps */
    // const OpenStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {});
    // const Stamen_TonerLite = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', { ext: 'png' });
    // const Stamen_TonerHybrid = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-hybrid/{z}/{x}/{y}{r}.{ext}', { ext: 'png' });
    const CartoDB_PositronNoLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {});
    map.addLayer(CartoDB_PositronNoLabels);
    map.attributionControl.setPrefix('https://www.covid-19-watch.com');
    map.attributionControl.addAttribution("Cartographer: Cory Leigh Rahman | Data Source: Johns Hopkins CSSE");

    let Stamen_TonerHybrid_Options: CustomTileLayerOptions = {
      // attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: 'abcd',
      minZoom: 0,
      maxZoom: 20,
      ext: 'png'
    }
    var Stamen_TonerHybrid = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-hybrid/{z}/{x}/{y}{r}.{ext}', Stamen_TonerHybrid_Options);

    map.on('zoomend', () => {
      const zoomLevel = this.map.getZoom();
      /* TODO: Figure out how to efficiently deconflict state boundaries zoom change with cyan highlight */
      // if (zoomLevel >= 11) {
      //   this.stateGeoJSON.setStyle({
      //     weight: 0,
      //   })
      // } else if (zoomLevel >= 7) {
      //   this.stateGeoJSON.setStyle({
      //     color: "rgb(100, 100, 100)",
      //     weight: 4,
      //     dasharray: "2",
      //   })
      // } else {
      //     this.stateGeoJSON.setStyle({
      //       color: "rgb(50, 50, 50)",
      //       weight: 1,    
      //     })
      // }
      if (zoomLevel >= 6) {
        if (!this.map.hasLayer(Stamen_TonerHybrid)) {
          this.map.addLayer(Stamen_TonerHybrid);
          this.countyGeoJSON.setStyle({ fillOpacity: 0.6 });
          this.mapZoomedIn = true;
        }
      } else {
        if (this.map.hasLayer(Stamen_TonerHybrid)) {
          this.map.removeLayer(Stamen_TonerHybrid)
          this.countyGeoJSON.setStyle({ fillOpacity: 1 });
          this.mapZoomedIn = false;
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
      searchLabel: 'Search the U.S. | Local, State, USA',
      classNames: { container: "geosearch-container", button: "geosearch-button", /* resetButton: "geosearch-resetButton", */ msgbox: "geosearch-msgbox", form: "geosearch-form", input: "geosearch-input" },
      retainZoomLevel: true,
      autoCompleteDelay: 500,
    });
    map.addControl(geoSearch);
    map.on('geosearch/showlocation', (place) => { this.locationSearched(place) });

    /* Add popup click listener(s) */
    this.elementRef.nativeElement.querySelector('.leaflet-popup-pane')
      .addEventListener('click', (e) => {
        if (e.target.classList.contains("popup-status-report-btn-local")) {
          const popupFips = e.target.getAttribute('popup-fips');
          if (this.panelContent.fips !== popupFips || !this.infoPanelOpen) {
            const selectedLayer = this.countyLayerLookup[popupFips];
            this.openStatusReport(selectedLayer);
          }
        } else if (e.target.classList.contains("popup-status-report-btn-state")) {
          const popupFips = e.target.getAttribute('popup-fips').slice(0,2);
          if (this.panelContent.fips !== popupFips || !this.infoPanelOpen) {
            const selectedLayer = this.stateLayerLookup[popupFips];
            this.openStatusReport(selectedLayer);
          }
        }
      });

    return map;
  }

  locationSearched(place) {
    /* TODO: Add State support */
    const locationInfo = place.location.label.split(", ");
    const topLevelLocation = locationInfo.slice(-1);
    const secondLevelLocation = locationInfo.slice(-2)[0];
    try {
      this.closePanel();
      this.map.closePopup();
    } catch (e) { }
    if (topLevelLocation == "United States of America") {
      const localityException = place.location.raw.place_id == 234930245 /* NYC */ ? true : false;
      if (locationInfo.length > 2 || localityException) {
        /* TODO: Exception for Alaska and places within */

        let matchedLayer = leafletPip.pointInLayer([place.location.x, place.location.y], this.countyGeoJSON, true)[0];
        this.map.flyToBounds(matchedLayer.getBounds().pad(1), { duration: 0.6 });
        this.map.once('zoomend', () => {
          const popupText = `<strong>${locationInfo[0]}, </strong>${locationInfo.slice(1, -1).join(", ")}`
          this.map.openPopup(popupText, [place.location.y, place.location.x])
          // matchedLayer.openPopup(); // This is for opening the normal click-popup
          setTimeout(() => {
            this.openStatusReport(matchedLayer);
          }, 250);
        });
      } else if (this.stateNameList.includes(secondLevelLocation)) {
        // console.log("US State Detected: ", secondLevelLocation);
        // this.map.flyToBounds(place.location.bounds);
        let matchedLayer = leafletPip.pointInLayer([place.location.x, place.location.y], this.stateGeoJSON, true)[0];
        this.map.flyToBounds(matchedLayer.getBounds().pad(0.5), { duration: 0.6 });
        this.map.once('zoomend', () => {
          const popupText = `<strong>${locationInfo[0]}`
          this.map.openPopup(popupText, [place.location.y, place.location.x])
          // matchedLayer.openPopup(); // This is for opening the normal click-popup
          setTimeout(() => {
            this.openStatusReport(matchedLayer);
          }, 250);
        });
      } else {
        const currentView = this.map.getBounds();
        alert("Location not found in the U.S.");
        setTimeout(() => {
          this.map.fitBounds(currentView);
        }, 50);  
      }
    } else if (locationInfo.length == 1 && topLevelLocation == "United States") {
      let matchedLayer = leafletPip.pointInLayer([place.location.x, place.location.y], this.nationalGeoJSON, true)[0];
      this.map.flyTo([30, -98.5], 4, { duration: 0.6 });
      this.map.once('zoomend', () => {
        this.openStatusReport(matchedLayer);
      });
    } else {
      const currentView = this.map.getBounds();
      alert("Location not found in the U.S.");
      setTimeout(() => {
        this.map.fitBounds(currentView);
      }, 50);
    }
    setTimeout(() => {
      /* Fix bug where the map needs to be clicked twice to show a popup */
      this.eventFire(this.elementRef.nativeElement.querySelector('#map'), 'click');
    }, 200);
  }

  openStatusReport(layer) {

    /* Update map feature */
    layer.bringToFront();
    layer.setStyle({ weight: 5, color: "hsl(180, 100%, 44%)" });

    /* Open the Status Report panel */
    if (this.infoPanelOpen) {
      this.closePanel();
      setTimeout(() => {
        this.updatePanel(layer);
      }, 500);
    } else {
      this.updatePanel(layer);
    }
  }

  updatePanel(layer) {

    /* Update Status Report */
    const fips = layer.feature.properties.FIPS;
    const countyInfo = fips.length === 2 ? this.stateDataLookup[fips] : fips.length === 1 ? this.nationalDataLookup[fips] : this.countyDataLookup[fips];
    const countyName = countyInfo.name;
    const countyData = countyInfo.data[this.currentTimeStop.num];

    const cumulative: number = countyData[0];
    const rate: number = countyData[1];
    const rateNorm: number = countyData[3];
    const acceleration: number = countyData[2];
    const accelerationNorm: number = countyData[4];

    const current = this.currentTimeStop.num === this.latestTimeStop.num ? true : false;

    this.panelContent.fips = layer.feature.properties.FIPS;
    this.panelContent.title = countyName;
    this.panelContent.subtitle = fips.length === 2 ? "USA" : fips.length === 1 ? "" : this.stateFipsLookup[fips.substr(0, 2)].name;
    this.panelContent.rate = this.styleNum(rate);
    this.panelContent.rateNorm = this.styleNum(rateNorm);
    this.panelContent.acceleration = acceleration < 0 ? `-${this.styleNum(Math.abs(acceleration))}` : this.styleNum(Math.abs(acceleration));
    this.panelContent.accelerationNorm = accelerationNorm < 0 ? `-${this.styleNum(Math.abs(accelerationNorm))}` : this.styleNum(Math.abs(accelerationNorm));
    this.panelContent.cumulative = this.styleNum(cumulative);
    this.panelContent.date = this.weekDefinitions.lookup[`t${this.latestTimeStop.num + 1}`];
    this.panelContent.summary = `${this.panelContent.title} ${current ? 'is reporting' : 'reported '} <strong>${this.panelContent.rate} new cases</strong> of COVID-19 ${current ? 'over the past week' : 'over this week'} ${acceleration >= 0 || rate == 0 ? "and" : "but"} the rate of ${rate > 0 ? "" : "no"} new cases is <strong>${acceleration > 0 ? "accelerating." : acceleration == 0 ? "steady." : "decelerating."}</strong>`;

    if (!this.statusReportChartConfig.lineChartType || layer.feature.properties.FIPS !== this.lastSelectedLayer.feature.properties.FIPS) {
      this.statusReportChartConfig = this.getStatusReportChartConfig(this.panelContent.fips, 1/* 1=Rate */);
    } else {
      const { lineChartData, lineChartLabels, lineChartOptions } = this.getStatusReportChartData(this.panelContent.fips, 1/* 1=Rate */, 0);
      this.statusReportChartConfig.lineChartData = lineChartData;
      this.statusReportChartConfig.lineChartLabels = lineChartLabels;
      this.statusReportChartConfig.lineChartOptions = lineChartOptions;
    }

    /* Open the Status Report */
    this.infoPanelOpen = true;

    /* Used to reset the feature style when the Status Report is closed. */
    this.lastSelectedLayer = layer;

  }

  getStatusReportChartConfig(fips, attributeIndex) {

    const { lineChartData, lineChartLabels, lineChartOptions } = this.getStatusReportChartData(fips, attributeIndex, 1000);

    const lineChartColors: Color[] = [
      {
        borderColor: 'black',
        pointBackgroundColor: 'black',
        backgroundColor: 'hsl(0, 43%, 52%)',
      },
    ];

    const lineChartLegend = true;
    const lineChartPlugins = [this.verticalLinePlugin];
    const lineChartType = 'line';

    return {
      lineChartData,
      lineChartLabels,
      lineChartOptions,
      lineChartColors,
      lineChartLegend,
      lineChartPlugins,
      lineChartType,
    }

  }

  getStatusReportChartData(fips, attributeIndex, duration) {

    let dataRange;
    let temporalRange;
    let lineAtIndex;
    let maxTimeStop = this.weekDefinitions.list.length - 1;

    /* Account for start and end of the possible data range */
    if (this.currentTimeStop.num === 0) {
      dataRange = fips.length === 2 ? this.stateDataLookup[fips].data.slice(0, 5) : fips.length === 1 ? this.nationalDataLookup[fips].data.slice(0, 5) : this.countyDataLookup[fips].data.slice(0, 5);
      temporalRange = this.weekDefinitions.list.slice(0, 5);
      lineAtIndex = [0];
    } else if (this.currentTimeStop.num === 1) {
      dataRange = fips.length === 2 ? this.stateDataLookup[fips].data.slice(0, 5) : fips.length === 1 ? this.nationalDataLookup[fips].data.slice(0, 5) : this.countyDataLookup[fips].data.slice(0, 5);
      temporalRange = this.weekDefinitions.list.slice(0, 5);
      lineAtIndex = [1];
    } else if (this.currentTimeStop.num === maxTimeStop - 1) {
      dataRange = fips.length === 2 ? this.stateDataLookup[fips].data.slice(maxTimeStop - 4, maxTimeStop + 1) : fips.length === 1 ? this.nationalDataLookup[fips].data.slice(maxTimeStop - 4, maxTimeStop + 1) : this.countyDataLookup[fips].data.slice(maxTimeStop - 4, maxTimeStop + 1);
      temporalRange = this.weekDefinitions.list.slice(maxTimeStop - 4, maxTimeStop + 1);
      lineAtIndex = [3];
    } else if (this.currentTimeStop.num === maxTimeStop) {
      dataRange = fips.length === 2 ? this.stateDataLookup[fips].data.slice(maxTimeStop - 4, maxTimeStop + 1) : fips.length === 1 ? this.nationalDataLookup[fips].data.slice(maxTimeStop - 4, maxTimeStop + 1) : this.countyDataLookup[fips].data.slice(maxTimeStop - 4, maxTimeStop + 1);
      temporalRange = this.weekDefinitions.list.slice(maxTimeStop - 4, maxTimeStop + 1);
      lineAtIndex = [4];
    } else {
      dataRange = fips.length === 2 ? this.stateDataLookup[fips].data.slice(this.currentTimeStop.num - 2, this.currentTimeStop.num + 3) : fips.length === 1 ? this.nationalDataLookup[fips].data.slice(this.currentTimeStop.num - 2, this.currentTimeStop.num + 3) : this.countyDataLookup[fips].data.slice(this.currentTimeStop.num - 2, this.currentTimeStop.num + 3);
      temporalRange = this.weekDefinitions.list.slice(this.currentTimeStop.num - 2, this.currentTimeStop.num + 3);
      lineAtIndex = [2];
    }

    /* Get an array of just rates */
    let data = [];
    for (let timeStop in dataRange) {
      if (timeStop in dataRange) {
        data.push(dataRange[timeStop][attributeIndex]);
      }
    }
    const lineChartData: ChartDataSets[] = [
      { data: data, label: 'Weekly New Cases' },
    ];

    let dates = [];
    for (let timeStop in temporalRange) {
      if (timeStop in temporalRange) {
        dates.push(temporalRange[timeStop].slice(0, -3));
      }
    }
    const lineChartLabels: Label[] = dates;

    const lineChartOptions = {
      responsive: true,
      pointHitRadius: 3,
      lineAtIndex: lineAtIndex,
      scales: {
        yAxes: [{
          // type: 'time',
          ticks: {
            maxTicksLimit: 5,
            suggestedMin: 0,
          }
        }]
      },
      tooltips: {
        mode: 'index',
        intersect: false
      },
      animation: {
        duration: duration
      },
    };


    return { lineChartData, lineChartLabels, lineChartOptions }

  }

  getVerticalLinePlugin(): any {
    return {
      getLinePosition: function (chart, pointIndex) {
        const meta = chart.getDatasetMeta(0); ///* first dataset is used to discover X coordinate of a point */
        const data = meta.data;
        return data[pointIndex]._model.x;
      },
      renderVerticalLine: function (chartInstance, pointIndex) {
        const lineLeftOffset = this.getLinePosition(chartInstance, pointIndex);
        const scale = chartInstance.scales['y-axis-0'];
        const context = chartInstance.chart.ctx;

        /* render vertical line */
        context.beginPath();
        context.strokeStyle = 'hsl(180, 100%, 44%)';
        context.lineWidth = 5;
        context.moveTo(lineLeftOffset, scale.top);
        context.lineTo(lineLeftOffset, scale.bottom);
        context.stroke();

        /* write label */
        // context.fillStyle = "black";
        // context.textAlign = pointIndex < 2 ? 'left' : pointIndex > 2 ? 'right' : 'center';
        // context.fillText('Now', lineLeftOffset, (scale.bottom - scale.top) / 3 + scale.top);
      },

      afterDatasetsDraw: function (chart, easing) {
        if (chart.config.options.lineAtIndex) {
          chart.config.options.lineAtIndex.forEach(pointIndex => this.renderVerticalLine(chart, pointIndex));
        }
      }
    };
  }

  initMapData(countiesGeoJson, statesGeoJson, nationalGeoJson) {

    const countyStyle = {
      // radius: 8,
      fillColor: "transparent",
      color: "hsl(180, 100%, 44%)", /* This is the cyan focus color */
      weight: 0, /* Weight gets toggled to focus a particular region */
      opacity: 1,
      fillOpacity: 1
    };
    const stateStyle = {
      color: "rgb(50, 50, 50)",
      weight: 1,
      opacity: 1,
      fillOpacity: 0
    }

    const popupOptions: L.PopupOptions = {
      autoPanPaddingTopLeft: [5, 50],
      autoPanPaddingBottomRight: [50, 5]
    };

    const countyGeoJsonOptions: CustomGeoJSONOptions = {
      smoothFactor: 0.7,
      style: countyStyle,
      onEachFeature: (feature, layer) => {
        layer.bindPopup("", popupOptions);
        this.countyLayerLookup[feature.properties.FIPS] = layer;
      }
    }
    const stateGeoJsonOptions: CustomGeoJSONOptions = {
      smoothFactor: 1,
      style: stateStyle,
      interactive: false,
      onEachFeature: (feature, layer) => {
        layer.bindPopup("", popupOptions);
        this.stateLayerLookup[feature.properties.FIPS] = layer;
      }
      // dashArray: "10"
    }
    const nationalGeoJsonOptions: CustomGeoJSONOptions = {
      smoothFactor: 1,
      style: countyStyle,
      interactive: false,
      onEachFeature: (feature, layer) => {
        layer.bindPopup("", popupOptions);
        this.nationalLayerLookup[feature.properties.FIPS] = layer;
      }
      // dashArray: "10"
    }
    this.countyGeoJSON = L.geoJSON(countiesGeoJson, countyGeoJsonOptions);
    this.stateGeoJSON = L.geoJSON(statesGeoJson, stateGeoJsonOptions);
    this.nationalGeoJSON = L.geoJSON(nationalGeoJson, nationalGeoJsonOptions);

    this.map.addLayer(this.countyGeoJSON);
    this.map.addLayer(this.stateGeoJSON);
    this.map.addLayer(this.nationalGeoJSON);
    this.updateMapDisplay(this.choroplethDisplayAttribute);

    /* Add search text */
    let domElement = this.elementRef.nativeElement.querySelector('.search-text');
    // this.elementRef.nativeElement.querySelector('.leaflet-control-geosearch').prepend(domElement);
    this.elementRef.nativeElement.querySelector('.geosearch-form').prepend(domElement);

    if (this.windowWidth < 451) {
      this.legendLayerInfoOpen = false;
    }

    this.initialLoadingDone = true;

  }

  updateMapDisplay(attribute = undefined) {

    if (attribute !== undefined) {
      this.choroplethDisplayAttribute = attribute;
    }

    /* Set configurations */
    let getStyle: Function;
    let attributeLabel: string;
    let rawCountId: number;
    let normalizedId: number;
    if (attribute === 3) {
      getStyle = this.getRateStyleFunction;
      attributeLabel = this.currentTimeStop.num == this.latestTimeStop.num ? "New This Week": "New (1 Week) " + this.weekDefinitions.list[this.currentTimeStop.num];
      rawCountId = 1;
      normalizedId = 3;
    } else if (attribute === 4) {
      getStyle = this.getAccelerationStyleFunction;
      attributeLabel = "Acceleration";
      rawCountId = 2;
      normalizedId = 4;
    } else {
      getStyle = this.getRateStyleFunction;
      attributeLabel = this.currentTimeStop.num == this.latestTimeStop.num ? "New This Week": "New (1 Week) " + this.weekDefinitions.list[this.currentTimeStop.num];
      rawCountId = 1;
      normalizedId = 3;
    }

    /* Update GeoJSON features */
    this.countyGeoJSON.eachLayer((layer) => {
      // if(layer.feature.properties.NAME == 'feature 1') {    
      //   layer.setStyle({fillColor :'blue'}) 
      // }

      /* Update popup */
      const countyInfo = this.countyDataLookup[`${layer.feature.properties.FIPS}`];
      const countyName = countyInfo.name;
      const countyData = countyInfo.data[this.currentTimeStop.num];
      const stateName = this.stateFipsLookup[layer.feature.properties.FIPS.substr(0, 2)].name
      layer.setPopupContent(`
        <div class="popup-place-title">
          <strong>${countyName}</strong>, ${stateName}
        </div>
        ${attributeLabel}: <strong>${this.styleNum(countyData[rawCountId])}</strong> (${this.styleNum(countyData[normalizedId])} per 100k)
        <p class="status-report-label"><em>See Status Report:</em></p>
        <div class="popup-status-report-btn-wrapper">
          <button type="button" popup-fips="${layer.feature.properties.FIPS}" class="popup-status-report-btn-local btn btn-secondary btn-sm btn-light">Local</button>
          <button type="button" popup-fips="${layer.feature.properties.FIPS}" class="popup-status-report-btn-state btn btn-secondary btn-sm btn-light">State</button>
        <div>
      `);
      /* Invisible FIPS */
      // <span class="popup-fips-label">[<span class="popup-fips">${layer.feature.properties.FIPS}</span>]</span>

      /* Update color */
      layer.setStyle(getStyle(countyData[normalizedId]));

    });

  }

  closePanel() {
    if (this.infoPanelOpen) {
      this.infoPanelOpen = false;
      if (this.lastSelectedLayer.feature.properties.FIPS.length === 2) {
        this.lastSelectedLayer.setStyle({ weight: 1, color: "rgb(50, 50, 50)" });
      } else {
        this.lastSelectedLayer.setStyle({ weight: 0 });
      }
    }
  }

  timeSliderChange(timeStop) {
    this.updateMapDisplay(this.choroplethDisplayAttribute);
    if (this.infoPanelOpen) {
      this.updatePanel(this.lastSelectedLayer);
    }
  }

  playAnimation(fps = 0.5) {
    const milliseconds = fps * 1000;
    // this.closePanel();
    this.map.closePopup();
    this.animationPaused = false;
    let initialTimeStop = this.currentTimeStop.num === this.latestTimeStop.num ? 0 : this.currentTimeStop.num;
    let workingTimeStop = initialTimeStop;
    this.animationInterval = setInterval(() => {
      this.currentTimeStop = { name: `t${workingTimeStop}`, num: workingTimeStop };
      workingTimeStop++;

      this.updateMapDisplay(this.choroplethDisplayAttribute);
      if (this.infoPanelOpen) {
        this.updatePanel(this.lastSelectedLayer);
      }

      /* Stop when the end is reached, may want to add a loop option later */
      if(this.currentTimeStop.num === this.latestTimeStop.num) {
        this.pauseAnimation();
      }
    }, milliseconds);
  }
  
  pauseAnimation() {
    this.animationPaused = true;
    clearInterval(this.animationInterval);
  }

  replaceSpaces(string = "", symbol = "+") {
    return string.replace(/ /g, symbol);
  }

  changeLayerSelection(layerCode) {
    switch(layerCode) {
      case("ccr"):
        this.layerSelection.layer = "ccr";
        this.layerSelection.alias = "County Case Rate";
        this.updateMapDisplay(3);
        this.legendContent.colorSchemeData = this.getLegendColorSchemeRateData();
        this.legendContent.layerDescription = "New COVID-19 Cases (7-day total per 100k people)";
        break;
        case("cca"):
        this.layerSelection.layer = "cca";
        this.layerSelection.alias = "County Case Acceleration";
        this.updateMapDisplay(4);
        this.legendContent.colorSchemeData = this.getLegendColorSchemeAccelerationData();
        this.legendContent.layerDescription = "Change in new COVID-19 cases from 2 weeks prior (7-day total per 100k people); negative means deceleration";
        break;
      case("cdr"):
        this.layerSelection.layer = "cdr";
        this.layerSelection.alias = "County Death Rate";
        break;
      case("cr"):
        this.layerSelection.layer = "cr";
        this.layerSelection.alias = "County Recovery";
        break;
      case("scr"):
        this.layerSelection.layer = "scr";
        this.layerSelection.alias = "State Case Rate";
        break;
      case("sca"):
        this.layerSelection.layer = "sca";
        this.layerSelection.alias = "State Case Acceleration";
        break;
      case("sdr"):
        this.layerSelection.layer = "sdr";
        this.layerSelection.alias = "State Death Rate";
    }
  }

  /**
   * Converts number to string and adds commas to thousands places
   * @param number int
   */
  styleNum(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  getRateStyleFunction(value) {
    switch (true) {
      case (value > 400): return { fillColor: "hsl(-20, 100%, 14%)" };
      case (value > 200): return { fillColor: "hsl(-10, 70%, 34%)" };
      case (value > 100): return { fillColor: "hsl(0, 43%, 52%)" };
      case (value > 50): return { fillColor: "hsl(10, 57%, 75%)" };
      case (value > 0): return { fillColor: "hsl(20, 62%, 91%)" };
      case (value <= 0): return { fillColor: "hsl(0, 0%, 97%)" };
      default: return {};
    }
  }
  getLegendColorSchemeRateData() {
    return [
      {label: "> 400", color: "hsl(-20, 100%, 14%)", colorFaded: "hsla(-20, 100%, 14%, 0.6)"},
      {label: "200 - 400", color: "hsl(-10, 70%, 34%)", colorFaded: "hsla(-10, 70%, 34%, 0.6)"},
      {label: "100 - 200", color: "hsl(0, 43%, 52%)", colorFaded: "hsla(0, 43%, 52%, 0.6)"},
      {label: "50 - 100", color: "hsl(10, 57%, 75%)", colorFaded: "hsla(10, 57%, 75%, 0.6)"},
      {label: "1 - 50", color: "hsl(20, 62%, 91%)", colorFaded: "hsla(20, 62%, 91%, 0.6)"},
      {label: "0", color: "hsl(0, 0%, 97%)", colorFaded: "hsla(0, 0%, 97%, 0.6)"},
    ]
  }

  getAccelerationStyleFunction(value) {
    switch (true) {
      // case (value > 200): return { fillColor: "#5e0000" };
      case (value > 80): return { fillColor: "hsl(28, 90%, 37%)" };
      case (value > 40): return { fillColor: "hsl(28, 80%, 60%)" };
      case (value > 0): return { fillColor: "hsl(28, 70%, 85%)" };
      case (value == 0): return { fillColor: "hsl(0, 0%, 97%)" };
      case (value >= -40): return { fillColor: "hsl(190, 35%, 85%)" };
      case (value >= -80): return { fillColor: "hsl(190, 25%, 55%)" };
      case (value < -80): return { fillColor: "hsl(190, 15%, 40%)" };
      default: return {};
    }
  }
  getLegendColorSchemeAccelerationData() {
    return [
      {label: "> 80", color: "hsl(28, 90%, 37%)", colorFaded: "hsla(28, 90%, 37%, 0.6)"},
      {label: "40 - 80", color: "hsl(28, 80%, 60%)", colorFaded: "hsla(28, 80%, 60%, 0.6)"},
      {label: "0 - 40", color: "hsl(28, 70%, 85%)", colorFaded: "hsla(28, 70%, 85%, 0.6)"},
      {label: "0", color: "hsl(0, 0%, 97%)", colorFaded: "hsla(0, 0%, 97%, 0.6)"},
      {label: "-40 - 0", color: "hsl(190, 35%, 85%)", colorFaded: "hsla(190, 35%, 85%, 0.6)"},
      {label: "-80 - -40", color: "hsl(190, 25%, 55%)", colorFaded: "hsla(190, 25%, 55%, 0.6)"},
      {label: "< -80", color: "hsl(190, 15%, 40%)", colorFaded: "hsla(190, 15%, 40%, 0.6)"},
    ]
  }


  copyText(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
  
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
  
    try {
      var successful = document.execCommand('copy');
      var msg = successful ? 'Copied!' : 'Auto-copy failed, please try copying from the text box.';
      alert(msg);
    } catch (err) {
      alert("Auto-copy failed, please try copying from the text box.");
    }
  
    document.body.removeChild(textArea);

  }

  // function fallbackCopyTextToClipboard(text) {
  // }
  

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
      left: '-450px',
    })),
    transition('open => closed', [
      animate('0.25s')
    ]),
    transition('closed => open', [
      animate('0.25s')
    ]),
  ]
}

// function getMapTransitions() {
//   return [
//     state('max', style({
//       left: '0',
//       width: '100%',
//     })),
//     state('min', style({
//       left: '280px',
//       width: 'calc( 100% - 280px )',
//     })),
//     transition('max => min', [
//       animate('0.25s')
//     ]),
//     transition('min => max', [
//       animate('0.25s')
//     ]),
//   ]
// }

function getNgIfAnimation() {
  return [
      // transition(
      //   ':enter', 
      //   [
      //     style({ opacity: 0 }),
      //     animate('0.25s ease-out', 
      //             style({ opacity: 1 }))
      //   ]
      // ),
      transition(
        ':leave', 
        [
          style({ opacity: 1 }),
          animate('0.25s ease-in', 
                  style({ opacity: 0 }))
        ]
      )
    ]
}

function getLayerInfoCollapseAnimation() {
  /* TODO: Height isn't working */
  return [
    transition(
      ':enter', 
      [
        // style({ height: 0 }),
        animate('0.5s ease-out', 
                style({ height: "auto" }))
      ]
    ),
    transition(
      ':leave', 
      [
        // style({ height: 1 }),
        animate('0.5s ease-in', 
                style({ height: 0 }))
      ]
    )
  ]
}