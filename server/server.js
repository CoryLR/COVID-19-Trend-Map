
const { Diego, express, expressSanitizer, path, productionMode, queryPrimaryDatabase, sslRedirect } = getDependencies();

module.exports = {
  start: function () {
    const app = express();
    app.use(sslRedirect());
    app.use(express.static('./dist/covid19trendmap'));
    app.use(express.json());
    app.use(expressSanitizer());
    setUrlRoutes(app);
    app.listen(process.env.PORT || 8080);
    Diego.start();
  }
}

function setUrlRoutes(app) {

  /* Set non-angular routes (server / api calls) */
  app.post('/api/getData', async function (req, res) {
    const params = req.body;
    res.send(await Diego.getLatestDataPackage());
    if (productionMode) {
      queryPrimaryDatabase(`UPDATE metrics_pages SET count = count + 1 WHERE label = 'covid-19-watch';`);
    }
  });
  app.post('/api/note/statusReport', async function (req, res) {
    if (productionMode) {
      await noteStatusReport(req);
    }
    res.send(true);
  });
  app.post('/api/note/page', async function (req, res) {
    if (productionMode) {
      await notePage(req);
    }
    res.send(true);
  });

  /* Send all other routes to Angular app */
  app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, '../dist/covid19trendmap/index.html'));
  });
}

async function noteStatusReport(req) {
  params = req.body;
  if (params.fips && params.label) {
    const fips = req.sanitize(params.fips, 'string');
    const label = req.sanitize(params.label, 'string');
    const noted = await queryPrimaryDatabase(`select * from metrics_status_reports where fips = '${fips}';`);
    if (noted.rowCount === 0) {
      queryPrimaryDatabase(`
        INSERT INTO metrics_status_reports (
          fips, label, count
        ) VALUES (
          '${fips}', '${label}', 1
        );    
      `);
    } else {
      queryPrimaryDatabase(`UPDATE metrics_status_reports SET count = count + 1 WHERE fips = '${fips}';`);
    }
  }
}
async function notePage(req) {
  params = req.body;
  if (params.label) {
    const label = req.sanitize(params.label, 'string');
    queryPrimaryDatabase(`UPDATE metrics_pages SET count = count + 1 WHERE label = '${label}';`);
  }
}

/* Gets all dependencies used by the server */
function getDependencies() {
  const express = require('express');
  const path = require('path');
  const Diego = require("./Diego-DataBroker.bot.js");
  const sslRedirect = require('heroku-ssl-redirect').default;
  const {
    Client
  } = require('pg');
  const common = require('./common.js');
  const queryPrimaryDatabase = common.queryPrimaryDatabase;
  const productionMode = common.productionMode;
  const expressSanitizer = require('express-sanitizer');

 return { Diego, express, expressSanitizer, path, productionMode, queryPrimaryDatabase, sslRedirect };
}
