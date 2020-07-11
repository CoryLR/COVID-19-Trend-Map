
# Development Notes: COVID-19 Trend Map

## Continuous Development

1. `npm ci` Installs dependencies exactly according to the `package-lock.json`
2. `ng build --watch` creates an app build in the `dist/` folder and updates it when source code is changed
3. `heroku local` serves the `dist/` folder
  - Useful for full-stack testing
  - The app is available on localhost port 5000 by default: http://localhost:5000
  - After source code changes simply refresh the page to see updates

Other commands:

- `ng serve` is also useful to start the front-end in a local server
  - Useful for front-end testing, but will it will be cut off from the server
  - Port 4200 is default: http://localhost:4200, but can be changed like `ng s --port 4201`
- `npm start` can be used as an alternative to `heroku local`, but heroku config/env values will not be accessible

## Analysis Documentation

County map layer with size reduction (7.8 MB > 2.2 MB) process:

  1. Pull Esri's "USA Counties (Generalized)" from the Living Atlas
  2. Fix the layer's geometry by importing & exporting from GRASS via QGIS, then running QGIS's "Fix geometries" tool
  3. Dissolve based on FIPS to turn the resulting Polygon layer back into a MultiPolygon
  4. Export as GeoJSON with only Name, FIPS, and POPULATION; set coordinate precision to 2

## Sources & References

- [COVID-19 Data](https://github.com/CSSEGISandData/COVID-19): Johns Hopkins University Center for Systems Science and Engineering (JHU CSSE)
  - *COVID-19 rate & acceleration are calculated from this data
- [Image of COVID-19](https://phil.cdc.gov/Details.aspx?pid=23312): U.S. Centers for Disease Control (CDC)
- [USA Counties Map Layer & Population](https://www.arcgis.com/home/item.html?id=7566e0221e5646f99ea249a197116605): Esri

## Timeline / TODO

- **Week 1** (6/15 - 6/21)
  - [x] Initialize GitHub Repository
  - [x] Architect source code for the server and application
  - [x] Initialize Heroku Project and GitHub deployment integration
  - [x] [Deliverable] Plan, record, post, and deliver elevator pitch

- **Week 2** (6/22 - 6/28)
  - [x] Write server code to pull, aggregate, and geo-enable COVID-19 data from Johns Hopkins for use in the front-end
  - [x] Brainstorm & create wireframe mock-ups using responsive design best-practices to account for varying screen sizes
  - [x] [Deliverable] Write and deliver Status Report #1

- **Week 3** (6/29 - 7/5)
  - [x] Write front-end code to display COVID-19 data
  - [x] Create non-functioning UI for location search, share sheet / URL scheme, and maybe chart graphics
  - [x] Build functionality for location search
  - [x] Publish live Beta #1
  - [x] [Deliverable] Write and deliver user-testing guide utilizing Live Beta #1

- **Week 4** (7/6 - 7/12)
  - [x] Solicit feedback on the live Beta #1 from mentors and peers
  - [ ] Update legend UI
  - [ ] Build functionality for chart graphics
  - [ ] Update application to address feedback from Beta #1
  - [ ] [Deliverable] Write and deliver Status Report #2

- **Week 5** (7/13 - 7/19)
  - [ ] Architect database to store COVID-19 data
  - [ ] Automate data calls to update the database daily
  - [ ] Re-route data pulls to come from the database
  - [ ] Conduct bug review
  - [ ] Build functionality for share sheet & URL scheme

- **Week 6** (7/20 - 7/26)
  - [ ] Build functionality for a time-slider and animation controls
  - [ ] Conduct UX, UI, & responsive design review
  - [ ] Conduct cross-browser compatibility review
  - [ ] Add "about", tutorial, data source, and disclaimer information
  - [ ] Publish Beta #2
  - [ ] Solicit feedback for Beta #2 from mentors, peers, and additional testers
  - [ ] [Deliverable] Write and deliver Status Report #3

- **Week 7** (7/27 - 8/2)
  - [ ] Update application to address feedback from Beta #2
  - [ ] Conduct final UX, UI, & responsive design review
  - [ ] Conduct final bug review
  - [ ] Conduct final cross-browser compatibility review

- **Week 8** (8/3 - 8/9)
  - [ ] Launch final application with custom URL and paid Heroku tier for performance
  - [ ] [Deliverable] Plan, record, post, and deliver final video demo & application URL
  - [ ] [Deliverable] Write and deliver Status Report #4

- **Week 9** (8/10 - 8/16)
  - [ ] [Deliverable] Write & deliver executive report
  - [ ] Socialize & advertize the application publicly
