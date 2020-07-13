
# Status Report 2 - COVID-19 Trend Map

Cory Leigh Rahman • 2020-07-12 • GEOG 778: Practicum in GIS Development

Master's in GIS and Web Map Programming, University of Wisconsin-Madison

<!-- Instructions
1. Identify the need for skills and strategies in integrating the concepts and the solutions;
2. Reflect the processes/steps in solving the problems in the project;
3. Report any challenges and possible solutions even if it fails;
4. Make a plan for the next iteration.
-->

## Introduction

This is the second of four status reports on the development progress of the COVID-19 Trend Map application ([Project Plan](./Project-Plan-Geog778-2020-06-14-Cory-Leigh-Rahman.md)). The project is **behind schedule** because planned tasks for Weeks 2 and 3 have not all been completed.

Planned Tasks:

- **Week 3** (6/29 - 7/5)
  - [ ] [60%] Write front-end code to display COVID-19 data [<-Done] using a time-slider and animation controls
  - [x] Create non-functioning UI for location search, share sheet / URL scheme, and maybe chart graphics
  - [x] Publish live Beta #1
  - [x] [Deliverable] Write and deliver user-testing guide utilizing Live Beta #1

- **Week 4** (7/6 - 7/12)
  - [x] Solicit feedback on the live Beta #1 from mentors and peers
  - [ ] [30%] Build functionality for location search [<-Done], share sheet / URL scheme, and chart graphics
  - [ ] Update application to address feedback from Beta #1
  - [x] [Deliverable] Write and deliver Status Report #2

Unplanned Tasks Completed:

- **Week 5** (7/13 - 7/19)
  - [x] Architect database to store COVID-19 data

- **Scope Creep**
  - [x] Teach Diego to differentiate "zero" (`0`) values between "has never had a new case", "back to no new cases", and the magnitude of "back to no new cases" (e.g. "no new cases in x weeks")


## Skills & Strategies

- Strong **front-end development & web cartography** skills were needed to initialize the front-end user interface of the application, visualize the county-level COVID-19 data in the map, and build a location-search system which generates local COVID-19 reports.
- **Back-end and database** skills were required to architect a Postgres database to store processed COVID-19 information and update Diego the Data Broker bot to update the database.
- **User Experience Design** skills were used in the creation of the User Testing guide. Guides like this must maximize the right kind of feedback through asking critical process-based and purpose-based questions.


## Processes & Steps

- To get the front-end UI started I brought in Leaflet and used asynchronous JavaScript via Observables to load the GeoJSON from the server into the map. The initial symbology of the county layer in the map used acceleration, but was later changed to rate in order to not give the false impression that areas of deceleration are safe.
- The database was architected by following the Heroku guides for adding a Postgres database, planning out SQL commands in a `database-notes.sql` document, and researching how to store JSON data in the database.

## Challenges & Contingencies

The biggest challenge I see right now will be differentiating this app from other COVID-19 apps/dashboards and adding value in a way that others have not. As I continue to research and receive feedback from peers I'm finding more COVID-19 resources online to compare with. I think this app's differentiator will be twofold: 1) industry-leading user experience / ease of use, and 2) Insights past the data, such as being able to see how many weeks a place has been new-case free. Time has continued to be a challenge over the past 2 weeks as well; planning and development always take longer than anticipated. Luckily I've built some buffer-room into the schedule.

## Next Steps

As seen in the [Dev Notes Timeline](/dev-journal/dev-notes.md#timeline--to-do), the following are my goals for the next 2 weeks.

- **Week 3** (6/29 - 7/5)
  - [ ] [60%] Write front-end code to display COVID-19 data [<-Done] using a time-slider and animation controls

- **Week 4** (7/6 - 7/12)
  - [ ] [30%] Build functionality for location search [<-Done], share sheet / URL scheme, and chart graphics
  - [ ] Update application to address feedback from Beta #1

- **Week 5** (7/13 - 7/19)
  - [ ] Automate data calls to update the database daily
  - [ ] Re-route data pulls to come from the database
  - [ ] Conduct bug review

- **Week 6** (7/20 - 7/26)
  - [ ] Conduct UX, UI, & responsive design review
  - [ ] Conduct cross-browser compatibility review
  - [ ] Add "about", tutorial, data source, and disclaimer information
  - [ ] Publish Beta #2
  - [ ] Solicit feedback for Beta #2 from mentors, peers, and additional testers
  - [ ] [Deliverable] Write and deliver Status Report #3
