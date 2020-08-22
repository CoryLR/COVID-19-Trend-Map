
/* 
  Update the snapshots JSON
    heroku pg:psql
    \o dev-journal/metrics/all_snapshots.json
    \t
    SELECT snapshot FROM metrics_snapshots where label = 'all_snapshots';
    \t
    \o

  Run this report on all_snapshots.json:
    node dev-journal/metrics/report.js
*/

const snapshots = require("./all_snapshots.json");

async function main () {
  /* For reporting, remove any snapshot that was not automatically generated */
  deduplicateSnapshots();

  // listSnapShots();
  logLatestMetrics(3);

  /* TODO: Output CSV of daily changes */

}

function logLatestMetrics(days = 1) {
  let snapshotsKeys = Object.keys(snapshots);
  if (snapshotsKeys.length > days) {
    snapshotsKeys.reverse();
    let latestSnapshot = snapshots[snapshotsKeys[0]];
    let compareSnapshot = snapshots[snapshotsKeys[days]];

    let latestSnapshotPageKeys = Object.keys(latestSnapshot["pages"]);
    let latestSnapshotStatusReportKeys = Object.keys(latestSnapshot["status_reports"]);

    // console.log("latestSnapshot", latestSnapshot);
    // console.log("compareSnapshot", compareSnapshot);
    // console.log("latestSnapshotPageKeys", latestSnapshotPageKeys);

    /* Log Page metrics */
    for (pageName of latestSnapshotPageKeys) {
      const latestValue = parseInt(latestSnapshot["pages"][pageName], 10);
      const lastValue = compareSnapshot["pages"][pageName] ? parseInt(compareSnapshot["pages"][pageName], 10) : 0;
      // console.log("pageName, latestValue, lastValue", pageName, latestValue, lastValue);
      // console.log("typeof pageName, typeof latestValue, typeof lastValue", typeof pageName, typeof latestValue, typeof lastValue);
      console.log(`Page "${pageName}" change: ${latestValue - lastValue}`);
    }

    /* Log Status Report metrics */
    for (pageName of latestSnapshotStatusReportKeys) {
      const latestValue = parseInt(latestSnapshot["status_reports"][pageName], 10);
      const lastValue = compareSnapshot["status_reports"][pageName] ? parseInt(compareSnapshot["status_reports"][pageName], 10) : 0;
      // console.log("pageName, latestValue, lastValue", pageName, latestValue, lastValue);
      // console.log("typeof pageName, typeof latestValue, typeof lastValue", typeof pageName, typeof latestValue, typeof lastValue);
      console.log(`Status Report "${pageName}" change: ${latestValue - lastValue}`);
    }

  } else {
    return "Not enough data for requested days, pick a smaller number."
  }

}

function listSnapShots(count = false) {
  if (count) {
    console.log("snapshots", Object.keys(snapshots).slice(count * -1));
  } else {
    console.log("snapshots", Object.keys(snapshots));
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