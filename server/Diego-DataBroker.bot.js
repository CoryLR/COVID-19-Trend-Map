/*                                    */
/* Hello, I am Diego the Data Broker. */
/*                                    */

const { Client, Got, Papa, fs, path } = getDependencies();

module.exports = {
  start: () => {
    runStartupTasks();
    initDataCollectionSchedule();
  },
  getLatestDataAndMetrics: async () => {
    return await getCovidCountyAggregations_dev();
    // return await getCovidCountyAggregations();
  }
}

/**
 * Runs on every new build
 */
async function runStartupTasks() {
  /* Run startup tasks if needed */

  /* Testing */
  // const covidCountiesData = await getCovidCountyAggregations_dev();
  // const covidCountiesData = await getCovidCountyAggregations();

}

/**
 * Runs according to a schedule
 */
function initDataCollectionSchedule() {
  // Todo
  /* `npm i cron` - this is the dependency I'll want to use to establish Diego's agenda */
  /* JHU updates their data around midnight to 1am Et, so I should pull around 2-3am ET to be safe, and not on the hour to help even out server load */
}

async function getCovidCountyAggregations() {

  const url_jhuUsConfirmedCasesCsv = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv";
  const csvContent = await Got(url_jhuUsConfirmedCasesCsv).text();

  const filePath_geoJson = path.join(__dirname, './data/us_counties.geojson');
  const geoJsonContent = fs.readFileSync(filePath_geoJson, "utf8");

  return getCovidResults(csvContent, geoJsonContent);

}

async function getCovidCountyAggregations_dev() {

  let filePath = path.join(__dirname, '../../EXTERNAL/COVID-19/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv');
  let data = fs.readFileSync(filePath, "utf8");
  const csvContent = data;

  const filePath_geoJson = path.join(__dirname, './data/us_counties.geojson');
  const geoJsonContent = fs.readFileSync(filePath_geoJson, "utf8");
  const dev = true;

  return getCovidResults(csvContent, geoJsonContent, dev);

}

function getCovidResults(csvContent, geoJsonContent, dev = false) {

  /* Parse inputs into usable data structures */
  const usDailyConfirmedArray2d = Papa.parse(csvContent).data;
  const countiesGeoJson = JSON.parse(geoJsonContent); // "Object.keys(countiesGeoJson)" => [ 'type', 'name', 'crs', 'features' ]

  /** Data diagnostics **/

  let dataStartColumnIndex;
  let headers = usDailyConfirmedArray2d[0];
  for (let i_header = 0; i_header < headers.length; i_header++) {
    if ((headers[i_header].length === 7 || headers[i_header].length === 8) && headers[i_header].match(/\//g).length == 2) {
      dataStartColumnIndex = i_header;
      break;
    }
  }

  /** Calculate weekly rate **/

  let covid19DailyCountLookup = {};
  let covid19WeeklyCountLookup = {};
  let covid19WeeklyRateLookup = {};
  let covid19WeeklyAccelerationLookup = {};
  let dataHeaders = headers.slice(dataStartColumnIndex, headers.length);
  let weeklyDataHeaders = [];
  /* Get weekly data headers */
  for (let i_header = dataHeaders.length - 1; i_header >= 0; i_header -= 7) {
    weeklyDataHeaders.push(dataHeaders[i_header]);
  }

  /* For each county */
  for (let i_row = 1; i_row < usDailyConfirmedArray2d.length - 1; i_row++) {
    let currentFips = parseInt(usDailyConfirmedArray2d[i_row][4], 10).toString().padStart(5, '0');
    let currentDailyDataArray = usDailyConfirmedArray2d[i_row].slice(dataStartColumnIndex, usDailyConfirmedArray2d[i_row].length);
    covid19DailyCountLookup[`f${currentFips}`] = currentDailyDataArray;

    let currentWeeklyCountArray = [];
    let currentWeeklyRateArray = [];
    let currentWeeklyAccelerationArray = [];

    /* Calculate rate */
    let lastCount = undefined;
    for (let i_count = currentDailyDataArray.length - 1; i_count >= 0; i_count -= 7) {
      let currentCount = currentDailyDataArray[i_count];
      currentWeeklyCountArray.push(currentCount);
      if (lastCount !== undefined) {
        let currentRate = lastCount - currentCount;
        currentWeeklyRateArray.push(currentRate);
      }
      lastCount = currentDailyDataArray[i_count];
    }

    /* Calculate Acceleration */
    let lastRate = undefined;
    let currentRate;
    for (let i_rate = 0; i_rate < currentWeeklyRateArray.length; i_rate++) {
      currentRate = currentWeeklyRateArray[i_rate];
      if (lastRate !== undefined) {
        let currentAcceleration = lastRate - currentRate;
        currentWeeklyAccelerationArray.push(currentAcceleration);
      }
      lastRate = currentWeeklyRateArray[i_rate];
    }

    /* https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Counties_Generalized/FeatureServer */

    /* Log results */
    // currentWeeklyCountArray.reverse();
    // currentWeeklyRateArray.reverse();
    currentWeeklyAccelerationArray.reverse();
    covid19WeeklyCountLookup[`f${currentFips}`] = currentWeeklyCountArray.reverse();
    covid19WeeklyRateLookup[`f${currentFips}`] = currentWeeklyRateArray.reverse();
    covid19WeeklyAccelerationLookup[`f${currentFips}`] = currentWeeklyAccelerationArray;
  }


  /* Enrich county GeoJSON with weekly acceleration data */

  let countyCovidDataLookup = {};

  for (let county of countiesGeoJson.features) {

    weeklyCovidNonNormalizedDataArray = []

    /*
      - Match FIPS to calculate normalized rate and acceleration
      - Create new "week" key (t1 - tN) for each week going back to total-2 (same as acc length)
      - Assign each week array of data values: [normalized rate, normalized acceleration]
      - Add to countyCovidDataLookup where key=FIPS, value=[cumulative, rate, acceleration]
      - delete POPULATION from county 
    */

    const pop = county.properties.POPULATION <= 0 ? 0.0001 : county.properties.POPULATION;
    const fips = county.properties.FIPS;

    try {
      /* Initialize "i" at 2 to skip first 2 weeks where we do not have acceleration data */
      for (let i_wk = 2; i_wk < weeklyDataHeaders.length; i_wk++) {
        let tN = i_wk - 1;
        const count = covid19WeeklyCountLookup[`f${fips}`][i_wk];
        const rate = covid19WeeklyRateLookup[`f${fips}`][i_wk - 1];
        const acceleration = covid19WeeklyAccelerationLookup[`f${fips}`][i_wk - 2]
        const rateNormalized = Math.round(rate / pop * 100000);
        const accelerationNormalized = Math.round(acceleration / pop * 100000);

        county.properties[`t${tN}`] = [rateNormalized, accelerationNormalized];
        weeklyCovidNonNormalizedDataArray.push([count, rate, acceleration])
      }
    } catch {
      console.log("County Data Processing Error at ", fips, county.properties.NAME);
    }

    countyCovidDataLookup[`f${fips}`] = weeklyCovidNonNormalizedDataArray;
    delete county.properties.POPULATION;
  }

  /* Make date lookup for each "week" (t1 - tN in GeoJSON) */
  let weekDefinitionsList = [];
  let weekDefinitionsLookup = {};
  weeklyDataHeaders.reverse();
  for (let i_wk = 2; i_wk < weeklyDataHeaders.length; i_wk++) {
    weekDefinitionsList.push(weeklyDataHeaders[i_wk]);
    weekDefinitionsLookup[`t${i_wk-1}`] = weeklyDataHeaders[i_wk];
  }

  return {
    "geojson": countiesGeoJson,
    "datalookup": countyCovidDataLookup,
    "weekdefinitions": {
      "list": weekDefinitionsList,
      "lookup": weekDefinitionsLookup,
    },
    "dev": dev,
  }
}


/**
 * Gets all dependencies used by Diego
 */
function getDependencies() {
  const {
    Client
  } = require('pg');
  const Got = require('got');
  const Papa = require('papaparse');
  const fs = require("fs");
  const path = require('path');

  return { Client, Got, Papa, fs, path, };
}
