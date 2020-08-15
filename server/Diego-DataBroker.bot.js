/*                                    */
/* Hello, I am Diego the Data Broker. */
/*                                    */

const { CronJob, Got, PapaParse, PapaUnparse, fs, path, productionMode, queryPrimaryDatabase } = getDependencies();

module.exports = {
  start: () => {
    runStartupTasks();
    initDataCollectionSchedule();
  },
  getLatestDataPackage: async () => {
    return await retrieveCovidDataPackage();

    /* Useful for testing Diego: */
    // return await generateCovidDataPackage_dev();
  }
}

/**
 * Runs on every new build
 */
async function runStartupTasks() {  
  if (productionMode === true) {
    await updateDatabaseWithCovidDataPackage();
  } else {

    /* Useful for testing backend */
    await updateDatabaseWithCovidDataPackage();

  }
  
  await cleanUpDatabase();
}

/**
 * Runs according to a schedule
 */
function initDataCollectionSchedule() {

  /* Cron format: */
  /*Seconds(0-59) Minutes(0-59) Hours(0-23) Day-of-Month(1-31) Months(0-11,Jann-Dec)) Day-of-Week(0-6,Sun-Sat)*/

  /* Pull data daily at 2:44:26 AM ET; JHU does automated updates to their time-series data at 1:50 AM ET. Use 2:44:26 AM ET to give buffer time and pull at low-load time. */
  const dataCollectionJob = new CronJob('26 44 02 * * *', async function() {
    await updateDatabaseWithCovidDataPackage();
    await cleanUpDatabase();
  }, null, true, 'America/New_York');
  dataCollectionJob.start();

}

/* 
  TODO:
  - Fix bug causing the discrepancy between rate and cumulative cases (example: City of Fairfax, VA

*/

async function retrieveCovidDataPackage() {
  let result = await queryPrimaryDatabase(`SELECT data FROM covid_19 WHERE label='latest_full' ORDER BY created_time_stamp DESC LIMIT 1;`);
  if (result && result.rows.length && result.rows[0].data) {
    return result.rows[0].data;
  } else {
    console.log("Error in retrieveCovidDataPackage")
    /* TODO: Write the error to Diego's Journal */

    /* If data cannot be retrieved from the database, manually recalculate directly from the data source */
    if (productionMode === true) {
      const source = "1 - GitHub (JHU CSSE)";
      return await generateCovidDataPackage(source);
    } else {
      const source = "2 - Local (Diego is in 'dev' mode)";
      return await generateCovidDataPackage_dev(source);
    }
  }
}

async function updateDatabaseWithCovidDataPackage() {
  const source = "0 - Database";
  let dataPackage;
  if (productionMode) {
    dataPackage = await generateCovidDataPackage(source);
  } else {
    dataPackage = await generateCovidDataPackage_dev(source);
  }
  if (productionMode) {
    queryPrimaryDatabase(`
      INSERT INTO covid_19 (
        label,
        data
      ) VALUES (
        'latest_full',
        $1
      );
    `, [dataPackage], (err, res) => {
      if (err) {
        console.log("[Diego]: Error adding data to database:\n", err);
        return false;
        /* TODO: Add "data upload failure" entry to Diego's Journal, get rid of "err" in console.log*/
      } else {
        console.log("[Diego]: Success adding COVID-19 data to database.");
        return true;
      }
    });
  }
}

async function cleanUpDatabase() {
  await queryPrimaryDatabase(`
    DELETE FROM covid_19 WHERE id IN (
      SELECT id FROM covid_19 WHERE label = 'latest_full' ORDER BY created_time_stamp DESC OFFSET 1
    );
  `);
}

async function generateCovidDataPackage(source = "unknown") {

  /*** Get CSVs ***/
  
  /* County Cases */
  const url_jhuUsConfirmedCasesCsv = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv";
  const countyCsvContent = await Got(url_jhuUsConfirmedCasesCsv).text();
  
  /* State Cases */
  const stateCsvContent = dissolveCsv(countyCsvContent, "Province_State");
  
  /* National Cases */
  const nationalCsvContent = dissolveCsv(countyCsvContent, "Country_Region");

  /* County Deaths */
  const url_jhuUsDeathsCsv = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_US.csv";
  const countyDeathsCsvContent = await Got(url_jhuUsDeathsCsv).text();
  
  /* State Deaths */
  const stateDeathsCsvContent = dissolveCsv(countyDeathsCsvContent, "Province_State");
  
  /* National Deaths */
  const nationalDeathsCsvContent = dissolveCsv(countyDeathsCsvContent, "Country_Region");
  
  /*** Get GeoJSONs ***/
  
  /* County */
  const filePath_geoJson = path.join(__dirname, './data/us_counties.geojson');
  const countyGeoJsonContent = fs.readFileSync(filePath_geoJson, "utf8");

  /* State */
  const filePath_stateGeoJson = path.join(__dirname, './data/us_states.geojson');
  const stateGeoJsonContent = fs.readFileSync(filePath_stateGeoJson, "utf8");
  
  /* National */
  const filePath_nationalGeoJson = path.join(__dirname, './data/us.geojson');
  const nationalGeoJsonContent = fs.readFileSync(filePath_nationalGeoJson, "utf8");

  const freshData = {countyCsvContent, countyGeoJsonContent, stateCsvContent, countyDeathsCsvContent, stateDeathsCsvContent, nationalDeathsCsvContent, stateGeoJsonContent, nationalCsvContent, nationalGeoJsonContent};
  return getCovidDataPackage(freshData, source);

}

async function generateCovidDataPackage_dev(source) {

  /* Get County Deaths CSV */
  let filePath_deaths = path.join(__dirname, '../../EXTERNAL/COVID-19/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_US.csv');
  let data_deaths = fs.readFileSync(filePath_deaths, "utf8");
  const countyDeathsCsvContent = data_deaths;

  /* Get County CSV */
  let filePath_cases = path.join(__dirname, '../../EXTERNAL/COVID-19/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv');
  let data = fs.readFileSync(filePath_cases, "utf8");
  const countyCsvContent = data;

  /* Get State Deaths CSV */
  const stateDeathsCsvContent = dissolveCsv(countyDeathsCsvContent, "Province_State");
  
  /* Get National Deaths CSV */
  const nationalDeathsCsvContent = dissolveCsv(countyDeathsCsvContent, "Country_Region");

  /* Get State CSV */
  const stateCsvContent = dissolveCsv(countyCsvContent, "Province_State");
  
  /* Get National CSV */
  const nationalCsvContent = dissolveCsv(countyCsvContent, "Country_Region");

  /* Get County GeoJSON */
  const filePath_countyGeoJson = path.join(__dirname, './data/us_counties.geojson');
  const countyGeoJsonContent = fs.readFileSync(filePath_countyGeoJson, "utf8");

  /* Get State GeoJSON */
  const filePath_stateGeoJson = path.join(__dirname, './data/us_states.geojson');
  const stateGeoJsonContent = fs.readFileSync(filePath_stateGeoJson, "utf8");
  
  /* Get National GeoJSON */
  const filePath_nationalGeoJson = path.join(__dirname, './data/us.geojson');
  const nationalGeoJsonContent = fs.readFileSync(filePath_nationalGeoJson, "utf8");
  
  const freshData = {countyCsvContent, countyGeoJsonContent, stateCsvContent, countyDeathsCsvContent, stateDeathsCsvContent, nationalDeathsCsvContent, stateGeoJsonContent, nationalCsvContent, nationalGeoJsonContent};

  return getCovidDataPackage(freshData, source);

}

function dissolveCsv(csvContent, dissolveField) {
  const csv2dArray = PapaParse(csvContent).data;
  headerRow = csv2dArray[0];
  dissolveIndex = headerRow.indexOf(dissolveField);
  dataRows = {};

  /* Each Row */
  for(let i = 1; i < csv2dArray.length; i++) {
    currentRow = csv2dArray[i];
    groupName = currentRow[dissolveIndex];
    if (dataRows[groupName] === undefined) {
      dataRows[groupName] = currentRow;
    } else {
      /* Each Cell */
      for (let ii = 0; ii < currentRow.length; ii++) {
        const cellValue = currentRow[ii];
        const currentHeader = headerRow[ii];

        if ((currentHeader.length === 6 || currentHeader.length === 7 || currentHeader.length === 8) && currentHeader.match(/\//g) && currentHeader.match(/\//g).length == 2) {
          /* If this cell is COVID data that we want to aggregate */
          dataRows[groupName][ii] = parseInt(dataRows[groupName][ii], 10) + parseInt(cellValue, 10);
        } else {
          /* Otherwise, update it if empty */
          if (dataRows[groupName][ii].length < 1) {
            dataRows[groupName][ii] = cellValue;
          }
        }
      }
    }
  }

  output2dArray = [];
  output2dArray.push(headerRow);
  for (groupName in dataRows) {
    if (groupName in dataRows) {
      output2dArray.push(dataRows[groupName]);
    }
  }

  return PapaUnparse(output2dArray);

}

function getCovidDataPackage(data, source = "unknown") {

  console.log("Starting Data Package...");

  const {countyCsvContent, countyGeoJsonContent, stateCsvContent, countyDeathsCsvContent, stateDeathsCsvContent, nationalDeathsCsvContent, stateGeoJsonContent, nationalCsvContent, nationalGeoJsonContent} = data;

  const {
    geoJson: countyGeoJson,
    dataLookup: countyCaseLookup,
    weekDefinitionsList: countyWeekDefinitionsList,
    weekDefinitionsLookup: countyWeekDefinitionsLookup,
  } = getCovidResults(countyCsvContent, countyGeoJsonContent);
  const {
    geoJson: stateGeoJson,
    dataLookup: stateCaseLookup,
    weekDefinitionsList: _01,
    weekDefinitionsLookup: _02,
  } = getCovidResults(stateCsvContent, stateGeoJsonContent);
  const {
    geoJson: nationalGeoJson,
    dataLookup: nationalCaseLookup,
    weekDefinitionsList: _03,
    weekDefinitionsLookup: _04,
  } = getCovidResults(nationalCsvContent, nationalGeoJsonContent);
  const {
    geoJson: _05,
    dataLookup: countyDeathsLookup,
    weekDefinitionsList: _06,
    weekDefinitionsLookup: _07,
  } = getCovidResults(countyDeathsCsvContent, countyGeoJsonContent);
  const {
    geoJson: _08,
    dataLookup: stateDeathsLookup,
    weekDefinitionsList: _09,
    weekDefinitionsLookup: _10,
  } = getCovidResults(stateDeathsCsvContent, stateGeoJsonContent);
  const {
    geoJson: _11,
    dataLookup: nationalDeathsLookup,
    weekDefinitionsList: _12,
    weekDefinitionsLookup: _13,
  } = getCovidResults(nationalDeathsCsvContent, nationalGeoJsonContent);
  
  const dataPackage = {
    "county": {
      "geoJson": countyGeoJson,
      "caseLookup": countyCaseLookup,
      "deathsLookup": countyDeathsLookup,
    },
    "state": {
      "geoJson": stateGeoJson,
      "caseLookup": stateCaseLookup,
      "deathsLookup": stateDeathsLookup,
    },
    "national": {
      "geoJson": nationalGeoJson,
      "caseLookup": nationalCaseLookup,
      "deathsLookup": nationalDeathsLookup,
    },
    "weekDefinitions": {
      "list": countyWeekDefinitionsList,
      "lookup": countyWeekDefinitionsLookup,
    },
    "source": source,
  }

  console.log("...Finished generating Data Package!");
  return dataPackage

}

function getCovidResults(csvContent, geoJsonContent) {
  console.log("Getting Covid Results...");

  /* Parse inputs into usable data structures */
  const usDailyConfirmedArray2d = PapaParse(csvContent).data;
  const geoJson = JSON.parse(geoJsonContent); // "Object.keys(geoJson)" => [ 'type', 'name', 'crs', 'features' ]

  /* Useful for testing */
  // if (geoJson.name === "us_states" || geoJson.features.length >= 50) {
  //   fs.writeFileSync(`${__dirname}/data/tmp-us-states-${testingIterator}.csv`, csvContent); testingIterator += 1;
  // }

  /** Data diagnostics **/

  let dataStartColumnIndex;
  let headers = usDailyConfirmedArray2d[0];
  for (let i_header = 0; i_header < headers.length; i_header++) {
    const currentHeader = headers[i_header];
    if ((currentHeader.length === 6 || currentHeader.length === 7 || currentHeader.length === 8) && currentHeader.match(/\//g) && currentHeader.match(/\//g).length == 2) {
      dataStartColumnIndex = i_header;
      break;
    }
  }

  /** Calculate weekly rate **/

  let covid19DailyCountLookup = {};
  let covid19WeeklyCountLookup = {};
  let covid19WeeklyRateLookup = {};
  let covid19WeeklyAccelerationLookup = {};
  let covid19WeeklyRecoveryStreakLookup = {};
  let dataHeaders = headers.slice(dataStartColumnIndex, headers.length);
  let weeklyDataHeaders = [];
  /* Get weekly data headers */
  for (let i_header = dataHeaders.length - 1; i_header >= 0; i_header -= 7) {
    weeklyDataHeaders.push(dataHeaders[i_header]);
  }

  /* Set acceleration range (how many weeks back to compare) */
  const accelerationRange = 2;

  /* Loop through each feature */
  for (let i_county = 1; i_county < usDailyConfirmedArray2d.length - 1; i_county++) {

    let currentFips
    if (geoJson.name === "us_counties" || geoJson.features.length > 3000) {
      /* Assume FIPS should be 5 digits ("00000") */
      currentFips = parseInt(usDailyConfirmedArray2d[i_county][4], 10).toString().padStart(5, '0');
    } else if (geoJson.name === "us_states" || geoJson.features.length >= 50) {
      /* Assume FIPS should be 2 digits ("00") */
      currentFips = parseInt(usDailyConfirmedArray2d[i_county][4], 10).toString().padStart(5, '0').slice(0,2);
    } else {
      /* Assume FIPS should be 1 digit (`0` hard-coded) */
      currentFips = "0";
    }

    let currentDailyDataArray = usDailyConfirmedArray2d[i_county].slice(dataStartColumnIndex, usDailyConfirmedArray2d[i_county].length);
    covid19DailyCountLookup[currentFips] = currentDailyDataArray;

    let currentWeeklyCountArray = [];
    let currentWeeklyRateArray = [];
    let currentWeeklyAccelerationArray = [];
    let currentWeeklyRecoveryStreakArray = [];

    // let currentWeeklyDeathCountArray = [];
    // let currentWeeklyDeathRateArray = [];
    // let currentWeeklyDeathAccelerationArray = [];
    // let currentWeeklyDeathlessStreakArray = [];

    /* Calculate county case count and rate for all time-stops */
    let lastCount = undefined;
    for (let i_count = currentDailyDataArray.length - 1; i_count >= 0; i_count -= 7) {
      let currentCount = parseInt(currentDailyDataArray[i_count], 10);
      currentWeeklyCountArray.push(currentCount);
      if (lastCount !== undefined) {
        let currentRate = lastCount - currentCount;
        currentWeeklyRateArray.push(currentRate);
      }
      lastCount = currentDailyDataArray[i_count];
    }

    /* Calculate county acceleration for all time-stops */

    let lastRate = undefined;
    let currentRate;
    for (let i_rate = 0; i_rate < currentWeeklyRateArray.length; i_rate++) {
      futureRate = currentWeeklyRateArray[i_rate - accelerationRange];
      if (futureRate !== undefined) {
        currentRate = currentWeeklyRateArray[i_rate];
        let currentAcceleration = futureRate - currentRate;
        currentWeeklyAccelerationArray.push(currentAcceleration);
      }
    }

    /* Reverse arrays to order time-stops chronologically */
    currentWeeklyCountArray.reverse();
    currentWeeklyRateArray.reverse();
    currentWeeklyAccelerationArray.reverse();

    /* Calculate county case-free week streak for all time-stops */
    let zeroStreak = 0;
    let lastValueWasZero = false;
    let noCasesYet = true;
    for (let i_rate = 0; i_rate < currentWeeklyRateArray.length; i_rate++) {
      if (currentWeeklyRateArray[i_rate] === 0) {
        if (noCasesYet === false) {
          currentWeeklyRecoveryStreakArray.push(zeroStreak);
          zeroStreak++;
        } else {
          currentWeeklyRecoveryStreakArray.push(0);
        }
      } else {
        currentWeeklyRecoveryStreakArray.push(0);
        zeroStreak = 0;
        lastValueWasZero = false;
        noCasesYet = false;
      }
    }

    /* Log results */
    covid19WeeklyCountLookup[currentFips] = currentWeeklyCountArray;
    covid19WeeklyRateLookup[currentFips] = currentWeeklyRateArray;
    covid19WeeklyAccelerationLookup[currentFips] = currentWeeklyAccelerationArray;
    covid19WeeklyRecoveryStreakLookup[currentFips] = currentWeeklyRecoveryStreakArray;
  }


  /* Add data to County Data Lookup for every feature in the geojson */

  let covidDataLookup = {};

  for (let feature of geoJson.features) {

    weeklyCovidDataArray = []

    /*
      - Match FIPS to calculate normalized rate and acceleration
      - Create new "week" key (t1 - tN) for each week going back to total-2 (same as acc length)
      - Assign each week array of data values: [normalized rate, normalized acceleration]
      - Add to covidDataLookup where key=FIPS, value=[cumulative, rate, acceleration]
      - delete POPULATION from county 
    */

    const fips = feature.properties.FIPS;
    const name = feature.properties.NAME;
    const pop = feature.properties.POPULATION <= 0 ? 0.0001 : feature.properties.POPULATION;

    try {
      /* Initialize "i" at 2 to skip first 2 weeks where we do not have acceleration data */
      for (let i_wk = accelerationRange + 1; i_wk < weeklyDataHeaders.length; i_wk++) {
        let tN = i_wk - 1;
        const count = covid19WeeklyCountLookup[fips][i_wk];
        let calculatedRate = covid19WeeklyRateLookup[fips][i_wk - 1];
        const rate = calculatedRate >= 0 ? calculatedRate : 0;
        const acceleration = covid19WeeklyAccelerationLookup[fips][i_wk - accelerationRange - 1]
        const rateNormalized = roundPrecise(rate / pop * 100000, 1);
        const accelerationNormalized = roundPrecise(acceleration / pop * 100000, 1);
        const recoveryStreak = covid19WeeklyRecoveryStreakLookup[fips][i_wk - 1];
        weeklyCovidDataArray.push([count, rate, acceleration, rateNormalized, accelerationNormalized, recoveryStreak])
      }
    } catch (err) {
      console.log("Feature Data Processing Error at ", fips, feature.properties.NAME);
      console.log("Error:\n", err);
    }

    covidDataLookup[fips] = {
      name: name,
      data: weeklyCovidDataArray,
    };
    delete feature.properties.NAME;
    delete feature.properties.POPULATION;
  }

  /* Make date lookup for each "week" (t1 - tN in GeoJSON) */
  let weekDefinitionsList = [];
  let weekDefinitionsLookup = {};
  weeklyDataHeaders.reverse();
  for (let i_wk = accelerationRange + 1; i_wk < weeklyDataHeaders.length; i_wk++) {
    weekDefinitionsList.push(weeklyDataHeaders[i_wk]);
    weekDefinitionsLookup[`t${i_wk-1}`] = weeklyDataHeaders[i_wk];
  }

  let dataPackage = {
    "geoJson": geoJson,
    "dataLookup": covidDataLookup,
    "weekDefinitionsList": weekDefinitionsList,
    "weekDefinitionsLookup": weekDefinitionsLookup,
  }

  return dataPackage
}


// /**
//  * Asynchronous function which queries the database and returns the response
//  * @param {string} queryString - SQL Query String
//  * @param {function} callBackFunction - requires parameters (err, res), fires when query finishes
//  */
// async function queryPrimaryDatabase(queryString, dataArr, callBackFunction = (err, res) => {}) {
//   const pgPsqlClient = new Client({
//     connectionString: process.env.DATABASE_URL,
//     // ssl: true,
//     ssl: { rejectUnauthorized: false }
//   });
//   let result;
//   try {
//     await pgPsqlClient.connect();
//     result = await pgPsqlClient.query(queryString, dataArr);
//   } catch (err) {
//     result = false;
//     /* TODO: Return this error somehow */
//   }
//   pgPsqlClient.end();
//   return result;
// }

function roundPrecise (number, decimalPlaces) {
  return Number(Math.round(number + "e" + decimalPlaces) + "e-" + decimalPlaces);
}

/**
 * Add an entry to Diego's journal by utilizing an INSERT queryPrimaryDatabase on table diegos_journal
 * @param {string} entry_name - Title of entry (max 255 characters)
 * @param {boolean} success - Whether the task succeeded or failed; options are true, false, and null of not relevant
 * @param {string} note - Details of entry
 */
function addEntryToDiegosJournal(entry_name, success, note) {
  queryPrimaryDatabase(`
  INSERT INTO diegos_journal ( entry_name, success, note )
  VALUES ( '${entry_name}', ${String(success)}, '${note}' );
  `);
}

/**
 * Gets all dependencies used by Diego
 */
function getDependencies() {
  const CronJob = require('cron').CronJob;
  const Got = require('got');
  const PapaParse = require('papaparse').parse;
  const PapaUnparse = require('papaparse').unparse;
  const fs = require("fs");
  const path = require('path');
  const common = require("./common.js");
  const queryPrimaryDatabase = common.queryPrimaryDatabase;
  const productionMode = common.productionMode;

  return { CronJob, Got, PapaParse, PapaUnparse, fs, path, productionMode, queryPrimaryDatabase };
}

var testingIterator = 0;
