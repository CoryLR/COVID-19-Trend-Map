const express = require('express');
const path = require('path');
const Diego = require("./Diego-DataBroker.bot.js");
const sslRedirect = require('heroku-ssl-redirect').default;

module.exports = {
  start: function () {
    const app = express();
    app.use(sslRedirect());
    app.use(express.static('./dist/covid19trendmap'));
    app.use(express.json());
    setUrlRoutes(app);
    app.listen(process.env.PORT || 8080);
    Diego.start();
  }
}

function setUrlRoutes(app) {

  /* Set non-angular routes (server / api calls) */
  app.post('/api/getData', async function (req, res) {
    const params = req.body;
    console.log("/api/getData called, params:", params);
    res.send(await Diego.getLatestDataPackage());
  });

  /* Send all other routes to Angular app */
  app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, '../dist/covid19trendmap/index.html'));
  });

}

function getLatest(req, res) {

}
