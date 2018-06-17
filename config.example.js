module.exports = {
  port: 6161,
  logLevel: 'debug', // what level of logging you want to see
  steamApiKey: '', // API key for Steam
  salt: '', // salt for hashing the browser footprint
  dailyLimit: 10000, // how many requests a unique browser is allowed to make a day
  cacheTimeout: 60, // timeout in seconds for cached results to be destroyed
};
