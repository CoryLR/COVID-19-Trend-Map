
# Status Report 3 - COVID-19 Trend Map

Cory Leigh Rahman • 2020-07-27 • GEOG 778: Practicum in GIS Development

Master's in GIS and Web Map Programming, University of Wisconsin-Madison

<!-- Instructions
1. Identify the need for skills and strategies in integrating the concepts and the solutions;
2. Reflect the processes/steps in solving the problems in the project;
3. Report any challenges and possible solutions even if it fails;
4. Make a plan for the next iteration.
-->

## Introduction

This is the third of four status reports on the development progress of the COVID-19 Trend Map application ([Project Plan](./Project-Plan-Geog778-2020-06-14-Cory-Leigh-Rahman.md)). The project is **on schedule** because primary planned tasks for Weeks 3 through 6 have been completed.

Tasks Completed:

- **Week 3** (6/29 - 7/5)
  - [x] Write front-end code to display COVID-19 data [<-Done] using a time-slider and animation controls

- **Week 4** (7/6 - 7/12)
  - [x] Build functionality for location search [<-Done], share sheet / URL scheme, and chart graphics
  - [x] Update application to address feedback from Beta #1

- **Week 5** (7/13 - 7/19)
  - [x] Architect database to store COVID-19 data
  - [x] Automate data calls to update the database daily
  - [x] Re-route data pulls to come from the database
  - [x] Conduct bug review

- **Week 6** (7/20 - 7/26)
  - [x] Conduct UX, UI, & responsive design review
  - [x] Conduct cross-browser compatibility review
  - [x] Publish Beta #2
  - [x] [Deliverable] Write and deliver Status Report #3

## Skills & Strategies

Similar to last week, a range of full-stack skills were necessary including back-end server and database design, data analysis, and heavy front-end UI design. The application is much more feature-rich now, including filled-out status reports, personalized graphs, and temporal control to step through time and animate change over time. Angular's 2-way binding makes it easier to coordinate all these different parts of the application, paving the way for a cohesive final product.

## Processes & Steps

In order to progress to the current state, some aspects of the application were prerequisite for others. First I had to ensure all the necessary data was available in as small a format as possible for performance. Then I had to ingest the data and make it available to all the necessary app components; for example, both the map and the legend need to know what the current time-stop is to stay coordinated.

## Challenges & Contingencies

The biggest challenge will be finding time to include the stretch goals (scope creep tasks). In order for this application to be the best that it can be, and be as useful to as many people as possible, I'd like to include at least several (if not all) of the stretch-goals prior to public launch. My contingency plan will be to simply focus on the primary tasks for each week before moving on to working on any stretch goals.

## Next Steps

As seen in the [Dev Notes Timeline](/dev-journal/dev-notes.md#timeline--to-do), the following are my goals for the next 2 weeks.

- **Week 6** (7/20 - 7/26)
  - [ ] Add "about", tutorial, data source, and disclaimer information
  - [ ] Solicit feedback for Beta #2 from mentors, peers, and additional testers

- **Week 7** (7/27 - 8/2)
  - [ ] Update application to address feedback from Beta #2
  - [ ] Conduct final UX, UI, & responsive design review
  - [ ] Conduct final bug review
  - [ ] Conduct final cross-browser compatibility review

- **Week 8** (8/3 - 8/9)
  - [ ] Launch final application with custom URL and paid Heroku tier for performance
  - [ ] [Deliverable] Plan, record, post, and deliver final video demo & application URL
  - [ ] [Deliverable] Write and deliver Status Report #4

I will also try to include as many additional tasks as possible:

- **Scope Creep**
  - [ ] Automatically acquire the user's location using their device's GPS
  - [ ] Add death and recovery statistics
  - [ ] Add state-level aggregations and borders
  - [ ] Add national aggregation
  - [ ] Make the app accessible so people with disabilities can find out the same information.
  - [ ] Add generalized Puerto Rico counties to GeoJSON (Hopkins has their data in the US csv but Esri doesn't in their counties layer, so I'll need to add them and their populations myself)
  - [ ] Add lazy loading for historical COVID-19 data, load on opening of the historical data section
