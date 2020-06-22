/* Hello, I am Diego the Data Broker. */

const {
  Client,
  Got,
  Papa,
} = getDependencies();

module.exports = {
  start: () => {
    runStartupTasks();
    initDataCollectionSchedule();
  },
  getLatestDataAndMetrics: async () => {
    return await getCovidCountyAggregations_dev();
  }
}

/**
 * Runs on every new build
 */
async function runStartupTasks() {
  /* Run startup tasks if needed */


  /* Testing */
  // const covidCountiesData = await getCovidCountyAggregations_dev();
  // const weeklyRateLookup = covidCountiesData.weeklyRateLookup;
  // const weeklyAccelerationLookup = covidCountiesData.weeklyAccelerationLookup;
  // const weeklyDataHeaders = covidCountiesData.weeklyDataHeaders;
  // console.log("weeklyRateLookup length", Object.keys(weeklyRateLookup).length);
  // console.log("weeklyAccelerationLookup length", Object.keys(weeklyAccelerationLookup).length);
  // console.log("weeklyDataHeaders", weeklyDataHeaders);

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

  const CSV_URL_JHU_US_Confirmed = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv";
  const csvContent = await Got(CSV_URL_JHU_US_Confirmed).text();
  const temporalEnumerationInDays = 7;
  return getAccelerationAggregation(csvContent, temporalEnumerationInDays);

}

async function getCovidCountyAggregations_dev() {

  let fs = require("fs");
  let path = require('path');
  let filePath = path.join(__dirname, '../../EXTERNAL/COVID-19/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv');
  let data = fs.readFileSync(filePath, "utf8");
  const temporalEnumerationInDays = 7;
  const csvContent = data;
  return getAccelerationAggregation(csvContent, temporalEnumerationInDays);

}

function getAccelerationAggregation(csvContent, temporalEnumerationInDays) {

  usDailyConfirmedArray2d = Papa.parse(csvContent).data;

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
  let covid19WeeklyRateLookup = {};
  let covid19WeeklyAccelerationLookup = {};
  let dataHeaders = headers.slice(dataStartColumnIndex, headers.length);
  let weeklyDataHeaders = [];
  /* Get weekly data headers */
  for (let i_header = dataHeaders.length - 1; i_header >= 0; i_header -= 7) {
    weeklyDataHeaders.push(dataHeaders[i_header]);
  }

  for (let i_row = 2 /* <- TODO: Change this to 1 */ ; i_row < usDailyConfirmedArray2d.length - 1; i_row++) {
    let currentFips = parseInt(usDailyConfirmedArray2d[i_row][4], 10).toString().padStart(5, '0');
    let currentDailyDataArray = usDailyConfirmedArray2d[i_row].slice(dataStartColumnIndex, usDailyConfirmedArray2d[i_row].length);
    covid19DailyCountLookup[`fips${currentFips}`] = currentDailyDataArray;

    let currentWeeklyRateArray = [];
    let lastCount = false;
    let currentCount;
    for (let i_count = currentDailyDataArray.length - 1; i_count >= 0; i_count -= 7) {
      currentCount = currentDailyDataArray[i_count];
      if (lastCount) {
        let currentRate = lastCount - currentCount;
        currentWeeklyRateArray.push(currentRate);
      }
      lastCount = currentDailyDataArray[i_count];
    }

    let currentWeeklyAccelerationArray = [];
    let lastRate = false;
    let currentRate;
    for (let i_rate = 0; i_rate < currentWeeklyRateArray.length; i_rate ++) {
      currentRate = currentWeeklyRateArray[i_rate];
      if (lastRate) {
        let currentAcceleration = lastRate - currentRate;
        currentWeeklyAccelerationArray.push(currentAcceleration);
      }
      lastRate = currentWeeklyRateArray[i_rate];
    }

    /* Log results */
    currentWeeklyRateArray.reverse();
    currentWeeklyAccelerationArray.reverse();
    covid19WeeklyRateLookup[`fips${currentFips}`] = currentWeeklyRateArray;
    covid19WeeklyAccelerationLookup[`fips${currentFips}`] = currentWeeklyAccelerationArray;
  }

  /* Initialize new 2dArray to hold FIPS and weekly aggregated data. For each row, walk backwards from the end of the row using the given number of days ("temporalEnumerationInDays"), subtract the number of cases, add that to the weeklyArray under the latest day in that week */

  return {
    "weeklyRateLookup": covid19WeeklyRateLookup,
    "weeklyAccelerationLookup": covid19WeeklyAccelerationLookup,
    "weeklyDataHeaders": weeklyDataHeaders.reverse(),
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

  return {
    Client,
    Got,
    Papa,
  };
}
