
# Project Plan: COVID-19 Trend Map

Cory Leigh Rahman • 2020-06-14 • GEOG 778: Practicum in GIS Development

Master's in GIS and Web Map Programming, University of Wisconsin-Madison

## Overview

| **Purpose**          | **Subject**     | **Audience**   | **Final Product** |
| -------------------- | --------------- | -------------- | ----------------- |
| Informing the Public | COVID-19 Trends | U.S. Residents | Web App           |

## Intention & Purpose

This project will help U.S. persons stay informed about COVID-19 trends both locally and nationally.

## Final Product

The final product will be a map-centric web application which allows users to:

1. See COVID-19 trends in the users' local area by searching for where they live and seeing the latest acceleration or deceleration of COVID-19 cases in their city or county
2. See how COVID-19 has spread through the U.S. over time by watching an animated map of historical COVID-19 new case reports

## Geographic Extent

50 U.S. States + Washington D.C.

## Estimated Project Time Budget

135 hours of planning, analysis, development, debugging, user testing, and documentation.

## Technology & Extraneous Costs

All technology and tools used to build the app will be free and open source. The data used will be free for noncommercial use. Once the app goes live there will be optional costs associated with a domain name ($2-$10/month) and a paid tier for better Heroku server performance ($7/month).

## Product Development & Delivery

The app's source code and version management will be documented using GitHub, but the app will be deployed and hosted using the Heroku platform and accessible via web browser at a dedicated URL.

## Timeline

- **Week 1** (6/15 - 6/21)
  - Initialize GitHub Repository
  - Initialize Heroku Project and GitHub deployment integration
  - Architect source code for the server and application
  - [Deliverable] Plan, record, post, and deliver elevator pitch
- **Week 2** (6/22 - 6/28)
  - Write server code to pull, aggregate, and geo-enable COVID-19 data from Johns Hopkins for use in the front-end
  - Brainstorm & create wireframe mock-ups using responsive design best-practices to account for varying screen sizes
  - [Deliverable] Write and deliver Status Report #1
- **Week 3** (6/29 - 7/5)
  - Write front-end code to display COVID-19 data using a time-slider and animation controls
  - Create non-functioning UI for location search, share sheet / URL scheme, and maybe chart graphics
  - Publish live Beta #1
  - [Deliverable] Write and deliver user-testing guide utilizing Live Beta #1
- **Week 4** (7/6 - 7/12)
  - Solicit feedback on the live Beta #1 from mentors and peers
  - Build functionality for location search, share sheet / URL scheme, and chart graphics
  - Update application to address feedback from Beta #1
  - [Deliverable] Write and deliver Status Report #2
- **Week 5** (7/13 - 7/19)
  - Architect database to store COVID-19 data
  - Automate data calls to update the database daily
  - Re-route data pulls to come from the database
  - Conduct bug review
- **Week 6** (7/20 - 7/26)
  - Conduct UX, UI, & responsive design review
  - Conduct cross-browser compatibility review
  - Add "about", tutorial, data source, and disclaimer information
  - Publish Beta #2
  - Solicit feedback for Beta #2 from mentors, peers, and additional testers
  - [Deliverable] Write and deliver Status Report #3
- **Week 7** (7/27 - 8/2)
  - Update application to address feedback from Beta #2
  - Conduct final UX, UI, & responsive design review
  - Conduct final bug review
  - Conduct final cross-browser compatibility review
- **Week 8** (8/3 - 8/9)
  - Launch final application with custom URL and paid Heroku tier for performance
  - [Deliverable] Plan, record, post, and deliver final video demo & application URL
  - [Deliverable] Write and deliver Status Report #4
- **Week 9** (8/10 - 8/16)
  - [Deliverable] Write & deliver executive report
  - Socialize & advertize the application publicly
