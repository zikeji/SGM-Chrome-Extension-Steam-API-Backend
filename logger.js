const winston = require('winston');

module.exports = (config) => new winston.Logger({
  level: config.logLevel,
  transports: [
    new (winston.transports.Console)(),
  ],
});