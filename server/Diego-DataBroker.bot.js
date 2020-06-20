
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
    let weeklyAcceleration = await getWeeklyAcceleration();
    return {
      test: "Hello World!",
      weeklyAcceleration: weeklyAcceleration
    }
  }
}

/**
 * Runs on every new build
 */
async function runStartupTasks() {
  /* Run startup tasks if needed */

  /* Testing */
  // getWeeklyAcceleration();
  // getWeeklyAcceleration_dev();
  // console.log("await getWeeklyAcceleration()", await getWeeklyAcceleration());
  // console.log("await getWeeklyAcceleration_dev()", await getWeeklyAcceleration_dev());
  await getWeeklyAcceleration_dev()
}

/**
 * Runs according to a schedule
 */
function initDataCollectionSchedule() {
  // Todo
  /* `npm i cron` - this is the dependency I'll want to use to establish Diego's agenda */
  /* JHU updates their data around midnight to 1am Et, so I should pull around 2-3am ET to be safe, and not on the hour to help even out server load */
}

async function getWeeklyAcceleration() {

  const CSV_URL_JHU_US_Confirmed = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv";
  const csvContent = await Got(CSV_URL_JHU_US_Confirmed).text();
  const temporalEnumerationInDays = 7;
  return getAccelerationAggregation(csvContent, temporalEnumerationInDays);

}

async function getWeeklyAcceleration_dev() {

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
  let covid193WeekAccelerationLookup = {};
  let dataHeaders = headers.slice(dataStartColumnIndex, headers.length);
  for (let i_row = 2; i_row < usDailyConfirmedArray2d.length - 1; i_row++) {
    currentFips = parseInt(usDailyConfirmedArray2d[i_row][4], 10).toString().padStart(5, '0');
    currentDailyDataArray = usDailyConfirmedArray2d[i_row].slice(dataStartColumnIndex, usDailyConfirmedArray2d[i_row].length);
    covid19DailyCountLookup[`fips${currentFips}`] = currentDailyDataArray;
    currentDailyDataArray;

    console.log("currentFips", currentFips);
    console.log("currentDailyDataArray first last", currentDailyDataArray[0], currentDailyDataArray.slice(-1)[0]);
    console.log("currentDailyDataArray.length", currentDailyDataArray.length);

    for (let i_col = currentDailyDataArray.length - 1; i_col >= 0; i_col -= 7) {
      console.log(dataHeaders[i_col], "\t", currentDailyDataArray[i_col]);
      /* TODO: Calculate rate from the weekly cumulative snapshots*/
    }

    break;
  }

  // console.log("covid19WeeklyRateLookup", covid19WeeklyRateLookup["fips1001.0"]);

  /* Initialize new 2dArray to hold FIPS and weekly aggregated data. For each row, walk backwards from the end of the row using the given number of days ("temporalEnumerationInDays"), subtract the number of cases, add that to the weeklyArray under the latest day in that week */

  return {
    "temporalEnumerationInDays": temporalEnumerationInDays,
    "typeof_csvContent": typeof csvContent,
    "csvContent_length": csvContent.length,
  }
}

function getWebFileContent(URL, callBack) {
  request.get(URL, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      callBack(body, response);
    } else {
      callBack(false, error);
    }
  });
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
