
const { Client } = getDependencies();

const productionMode = true;

module.exports = {
  queryPrimaryDatabase,
  productionMode
}

/**
* Asynchronous function which queries the database and returns the response
* @param {string} queryString - SQL Query String
* @param {function} callBackFunction - requires parameters (err, res), fires when query finishes
*/
async function queryPrimaryDatabase(queryString, dataArr, callBackFunction = (err, res) => {}) {
  const pgPsqlClient = new Client({
    connectionString: process.env.DATABASE_URL,
    // ssl: true,
    ssl: { rejectUnauthorized: false }
  });
  let result;
  try {
    await pgPsqlClient.connect();
    result = await pgPsqlClient.query(queryString, dataArr);
  } catch (err) {
    result = false;
    /* TODO: Return this error somehow */
  }
  pgPsqlClient.end();
  return result;
 }

 /* Gets all dependencies used by common */
function getDependencies() {
  const {
    Client
  } = require('pg');
  
 return { Client };
}
