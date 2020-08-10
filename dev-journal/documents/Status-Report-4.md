
# Status Report 4 - COVID-19 Trend Map

Cory Leigh Rahman • 2020-08-09 • GEOG 778: Practicum in GIS Development

Master's in GIS and Web Map Programming, University of Wisconsin-Madison

<!-- Instructions
1. Identify the need for skills and strategies in integrating the concepts and the solutions;
2. Reflect the processes/steps in solving the problems in the project;
3. Report any challenges and possible solutions even if it fails;
4. Make a plan for the next iteration.
-->

## Introduction

This is the last of four status reports on the development progress of the COVID-19 Trend Map application ([Project Plan](./Project-Plan-Geog778-2020-06-14-Cory-Leigh-Rahman.md)). The project is **ahead of schedule** because planned and additional tasks for Weeks 6 through 8 have been completed.

Tasks Completed:

- **Week 6** (7/20 - 7/26)
  - [x] Add "about", tutorial, data source, and disclaimer information
  - [x] Solicit feedback for Beta #2 from mentors, peers, and additional testers

- **Week 7** (7/27 - 8/2)
  - [x] Update application to address feedback from Beta #2
  - [x] Conduct final UX, UI, & responsive design review
  - [x] Conduct final bug review
  - [x] Conduct final cross-browser compatibility review

- **Week 8** (8/3 - 8/9)
  - [x] Launch final application with custom URL and paid Heroku tier for performance
  - [x] [Deliverable] Plan, record, post, and deliver final video demo & application URL
  - [x] [Deliverable] Write and deliver Status Report #4

- Additional Tasks Completed:
  - [x] Add state-level aggregations and borders
  - [x] Add national aggregation
  - [x] Time-enable status reports
  - [x] Add death and recovery statistics


## Skills & Strategies

My top-used skills this week were:

- UC / UI Design & Cartographic Design: The app is, for all intents and purposes, complete. In order to take the app through the final few yards, I had to take extra care with crafting the UI from icons, seals, colors, animations, etc. Many of these skills I learned from my Cartographic Design skills.
- Software Engineering: My productivity over the past 2 weeks is largely due following general coding best-practices and the benefits of using frameworks. Coding best-practices such as strict naming conventions, code modularization, and reusability saved me lots of time as I took on normally difficult tasks such as adding state-level and national-level statistics. Using the Angular JavaScript framework also saved me lots of time. Chances are that if I have a UI goal in-mind, Angular has an easy way to accomplish it. For example, Angular Animations makes transitions and movement very fluid.

## Processes & Steps

My workflow for the past 2 weeks was to triage my list of to-do's. Assigning importance was the most valuable thing I could have done, or else I may not have had crucial functionality ready for the Final Demo.

## Challenges & Contingencies

The biggest challenge by far was being productive quickly enough to meet the ambitious goals I had for this app. The app currently exceeds my expectations, but it does still have lots of room for improvement. In particular, the next big challenge will be improving speed and performance, especially on mobile. This is an exceptionally powerful, but data-heavy app.

## Next Steps

As seen in the [Dev Notes Timeline](/dev-journal/dev-notes.md#timeline--to-do), the following are my goals for the next week.

- **Week 9** (8/10 - 8/16)
  - [ ] [Deliverable] Write & deliver executive report
  - [ ] Socialize & advertize the application publicly

I intend to maintain this app for the forseeable future, so I also intend to complete the following additional tasks:

- [ ] [follow-through] Robust in-app documentation (about, links, data source, disclaimers, resources, etc)
- [ ] [functional] Add zoom-to-original-extent button
- [ ] [functional] Automatically acquire user's location on "find me" click
- [ ] [debugging] Ensure cross-browser compatibility & stress testing
- [ ] [functional] Make temporal animation more efficient
- [ ] [functional] Add Puerto Rico
- [ ] [design/debugging] Resolve Safari mobile hight issue, make content scrollable over the map for Mobile
- [ ] [functional] Lazy-load historic data
- [ ] [functional] Explore options for further improving performance and load times
