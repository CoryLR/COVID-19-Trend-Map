
/** Command Line **/

-- `heroku pg:info` gives me information about my database plan
-- `heroku pg:psql` establishes a psql session (can give it sql commands from the terminal)

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
/** SQL Reference: **/
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

/* See all tables in psql database */
SELECT * FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';

/* See covid-19 data records */
SELECT id, label, created_time_stamp FROM covid_19;

/* Select latest data */
SELECT id FROM covid_19 WHERE label='test_latest' ORDER BY created_time_stamp DESC LIMIT 1;

/* Add covid-19 data */
INSERT INTO covid_19 (
  label,
  data
) VALUES (
  'test',
  '{"key": "value", "key2": "value2"}'
);
/* Helpful guide for JSON w/ Node & Postgres: https://itnext.io/storing-json-in-postgres-using-node-js-c8ff50337013 */

/* Delete all but the 2 "latest" data from the database */
DELETE FROM covid_19 WHERE id IN (
  SELECT id FROM covid_19 WHERE label = 'test_latest' ORDER BY created_time_stamp DESC OFFSET 2
);

/* Delete test data */
delete from covid_19 where lower(label) like 'test%';

/* Labels:
  "latest" = county geojson, data lookup, and week definitions
 */

CREATE TABLE diegos_journal (
  id serial PRIMARY KEY,
  entry_name VARCHAR(255),
  success BOOLEAN,
  note TEXT,
  created_time_stamp TIMESTAMPTZ
);
ALTER TABLE diegos_journal ALTER COLUMN created_time_stamp SET DEFAULT now();


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
/** Architectural SQL commands used on live database: **/
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

/* 2020-07-12 1849 */
CREATE TABLE covid_19 (
  id SERIAL PRIMARY KEY,
  label TEXT,
  data JSONB NOT NULL,
  created_time_stamp TIMESTAMPTZ
);
ALTER TABLE covid_19 ALTER COLUMN created_time_stamp SET DEFAULT NOW();

/* 2020-07-12 1850 */
SET timezone = 'America/New_York';


