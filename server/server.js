const express = require('express');
const path = require('path');
// const Bot = require("./bot.js");

module.exports = {
  start: function () {
    const app = express();
    app.use(express.static('./dist/covid19trendmap'));
    setUrlRoutes(app);
    app.listen(process.env.PORT || 8080);
    // Bot.start();
  }
}

function setUrlRoutes(app) {

  /* Set non-angular routes (server / api calls) */
  // app.get('/api/call', functionName);

  /* Send all other routes to Angular app */
  app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, '../dist/covid19trendmap/index.html'));
  });

}
