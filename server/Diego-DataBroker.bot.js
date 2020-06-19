/* Hello, I am Diego the Data Broker. */

const {
  Client,
  got,
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
  console.log("await getWeeklyAcceleration_dev()", await getWeeklyAcceleration_dev());
  // console.log("await getWeeklyAcceleration()", await getWeeklyAcceleration());
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
  const csvContent = await got(CSV_URL_JHU_US_Confirmed).text();
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

  //   , {
  //   encoding: 'utf-8'
  // }, function (err, data) {
  //   if (!err) {
  //     const temporalEnumerationInDays = 7;
  //     const csvContent = data;
  //     return getAccelerationAggregation(csvContent, temporalEnumerationInDays);
  //   } else {
  //     return [false, responseMessage]
  //   }
  // });
}

function getAccelerationAggregation(csvContent, temporalEnumerationInDays) {

  /* Crunch numbers */


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
  const got = require('got');


  return {
    Client,
    got,
  };
}
