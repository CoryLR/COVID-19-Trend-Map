
/* 
  Update the snapshots JSON (bash syntax):
    # Open the Database, set it to Output ("\o") and Tuple ("\t"; value only) modes, then get the snapshots
    heroku pg:psql
    \o dev-journal/metrics/all_snapshots.json
    \t
    SELECT snapshot FROM metrics_snapshots where label = 'all_snapshots';
    \t
    \o
    \q

    # Run this report on all_snapshots.json
    node dev-journal/metrics/report.js
*/

const snapshots = require("./all_snapshots.json");

async function main () {
  /* For reporting, remove any snapshot that was not automatically generated */
  deduplicateSnapshots();

  listSnapShots(1); // Number of snapshots
  listChangeMetrics(50); // Number of days back to compare

  /* TODO: Output CSV of daily changes */  
  /* TODO: Make a command combination to get "so far today" metrics */  
  /* TODO: Match fips with names */  
  /* TODO: Possibly create change-over-time visualization for metrics */

}

// function listLast

function listChangeMetrics(days = 1) {
  let snapshotsKeys = Object.keys(snapshots);
  if (snapshotsKeys.length > days || days === 0) {
    if (days === 0) {
      /* Take 0 as "all time" */
      days = snapshotsKeys.length - 1;
    }
    snapshotsKeys.reverse();
    let latestSnapshot = snapshots[snapshotsKeys[0]];
    let compareSnapshot = snapshots[snapshotsKeys[days]];

    let latestSnapshotPageKeys = Object.keys(latestSnapshot["pages"]);
    let latestSnapshotStatusReportKeys = Object.keys(latestSnapshot["status_reports"]);

    // console.log("latestSnapshot", latestSnapshot);
    // console.log("compareSnapshot", compareSnapshot);
    // console.log("latestSnapshotPageKeys", latestSnapshotPageKeys);

    /* Log Page metrics */
    for (label of latestSnapshotPageKeys) {
      const latestValue = parseInt(latestSnapshot["pages"][label], 10);
      const lastValue = compareSnapshot["pages"][label] ? parseInt(compareSnapshot["pages"][label], 10) : 0;
      const change = latestValue - lastValue;
      // console.log("label, latestValue, lastValue", label, latestValue, lastValue);
      // console.log("typeof label, typeof latestValue, typeof lastValue", typeof label, typeof latestValue, typeof lastValue);
      if (change) {
        console.log(`Page "${label}" change: ${change}`);
      }
    }

    /* Log Status Report metrics */
    for (label of latestSnapshotStatusReportKeys) {
      const latestValue = parseInt(latestSnapshot["status_reports"][label], 10);
      const lastValue = compareSnapshot["status_reports"][label] ? parseInt(compareSnapshot["status_reports"][label], 10) : 0;
      const change = latestValue - lastValue;
      // console.log("label, latestValue, lastValue", label, latestValue, lastValue);
      // console.log("typeof label, typeof latestValue, typeof lastValue", typeof label, typeof latestValue, typeof lastValue);
      if (change) {
        console.log(`Status Report "${label}" change: ${change}`);
      }
    }

  } else {
    return "Not enough data for requested days, pick a smaller number."
  }

}

function listSnapShots(count = false) {
  if (count) {
    if (count === 1) {
      console.log("Latest Snapshot: ", Object.keys(snapshots).slice(count * -1)[0]);
    } else {
      console.log("Snapshots: ", Object.keys(snapshots).slice(count * -1));
    }
  } else {
    console.log("Snapshots: ", Object.keys(snapshots));
  }
}

function deduplicateSnapshots() {
  for(snapshot of Object.keys(snapshots)) {
    if (snapshot.split(":")[1] !== "00") {
      delete snapshots[snapshot];
    }
  }
}

function getDependencies() {
  // const fs = require("fs");
  // const path = require('path');

  return { };
}

main();