const express = require('express');
const path = require('path');
const Diego = require("./Diego-DataBroker.bot.js");

module.exports = {
  start: function () {
    const app = express();
    app.use(express.static('./dist/covid19trendmap'));
    setUrlRoutes(app);
    app.listen(process.env.PORT || 8080);
    Diego.start();
  }
}

function setUrlRoutes(app) {

  /* Set non-angular routes (server / api calls) */
  app.get('/api/getLatest', function (req, res) {
    res.send(Diego.getLatestDataAndMetrics());
  });

  /* Send all other routes to Angular app */
  app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, '../dist/covid19trendmap/index.html'));
  });

}

function getLatest(req, res) {

}
