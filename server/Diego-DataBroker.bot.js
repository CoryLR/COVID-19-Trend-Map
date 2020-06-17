/* Hello, I am Diego the Data Broker. */

const {
  Client
} = getDependencies();

module.exports = {
  start: () => {
    runStartupTasks();
    initDataCollectionSchedule();
  },
  getLatestDataAndMetrics: () => {
    return {
      test: "Hello World!"
    }
  }
}

/**
 * Runs on every new build
 */
function runStartupTasks() {
  /* Run startup tasks if needed*/
}

/**
 * Runs according to a schedule
 */
function initDataCollectionSchedule() {
  // Todo
  /* `npm i cron` - this is the dependency I'll want to use to establish Diego's agenda */
}



/**
 * Gets all dependencies used by Diego
 */
function getDependencies() {
  const {
    Client
  } = require('pg');

  return {
    Client
  };
}
