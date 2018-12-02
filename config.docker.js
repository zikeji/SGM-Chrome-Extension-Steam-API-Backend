module.exports = {
  port: process.env.PORT || 8080,
  logLevel: process.env.LOG_LEVEL || 'info', // what level of logging you want to see
  steamApiKey: process.env.STEAM_API_KEY, // API key for Steam
  salt: process.env.SALT, // salt for hashing the browser footprint
  dailyLimit: process.env.DAILY_LIMIT || 10000, // how many requests a unique browser is allowed to make a day
  cacheTimeout: 60, // timeout in seconds for cached results to be destroyed
};
