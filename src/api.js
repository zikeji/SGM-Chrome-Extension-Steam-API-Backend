const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

class API {
  constructor(config, database, steam, logger) {
    this.db = database;
    this.logger = logger;

    this.salt = config.salt;
    this.dailyLimit = config.dailyLimit;

    this.steam = steam;

    this.router = express.Router();

    this.router.use(bodyParser.json());
    this.router.use(this.rateLimit.bind(this));
    this.router.get('/', this.indexGet.bind(this));
    this.router.post('/', this.indexPost.bind(this));
  }

  get Router() {
    return this.router;
  }

  static hash(data) {
    return crypto.createHash('sha256').update(data).digest('base64');
  }

  async rateLimit(req, res, next) {
    if (!req.ip && typeof req.headers['user-agent'] === 'undefined') {
      res.sendStatus(400);
      return;
    }

    try {
      const { ip, headers } = req;
      const agent = headers['user-agent'];
      const identifier = API.hash(`${ip}${agent}${this.salt}`);

      const history = await this.db.getHistory(identifier);
      history.requests += 1;

      await this.db.setHistory(identifier, history.requests);

      res.set('x-Requests', history.requests.toString(10));
      res.set('x-Request-Limit', this.dailyLimit);

      if (history.requests > this.dailyLimit) {
        res.sendStatus(429);
        return;
      }

      next();
    } catch (err) {
      this.logger.error('unable to check ratelimit', err);
      res.sendStatus(500);
    }
  }

  async indexGet(req, res) {
    try {
      const stats = await this.db.stats();
      const cacheStats = await this.steam.cache.getStats();
      res.json({ stats, cacheStats });
    } catch (err) {
      this.logger.error('unable to return stats to user', err);
      res.sendStatus(500);
    }
  }

  async indexPost(req, res) {
    if (typeof req.body.steamID64 !== 'undefined') {
      try {
        /**
         * See link. Some key name translation is occurring. See type PlayerSummary for available data.
         * https://developer.valvesoftware.com/wiki/Steam_Web_API#GetPlayerSummaries_.28v0002.29
         * @type {PlayerSummary}
         */
        const users = await this.steam.getUserSummary(req.body.steamID64);
        res.json(users);
      } catch (err) {
        this.logger.error('unable to get steam users', err);
        res.sendStatus(500);
      }
    } else {
      res.sendStatus(400);
    }
  }
}

module.exports = API;
