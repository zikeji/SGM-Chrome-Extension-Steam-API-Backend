const config = require('../config.js');
const logger = require('../logger.js')(config);
const Database = require('./db');
const API = require('./api');

const express = require('express');

const app = express();

const db = new Database(logger, 'stats.sqlite');
const api = new API(config, db, logger);

async function main() {
  logger.debug('initializing database');
  await db.initialize();

  logger.debug('mounting API');
  app.use(api.Router);

  logger.debug('starting up listener');
  app.listen(config.port, () => {
    logger.debug(`listening on ${config.port}`);
  });
}

main().catch(logger.error);
