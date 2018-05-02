const sqlite = require('sqlite');

class Database {
  constructor(logger, fileName) {
    this.logger = logger;
    this.dbPromise = sqlite.open(fileName);
  }

  async initialize() {
    this.db = await this.dbPromise;
    this.db.run('CREATE TABLE IF NOT EXISTS request_history (requests INT NOT NULL, date DATE NOT NULL, identifier STRING NOT NULL)');
    this.db.run('CREATE UNIQUE INDEX IF NOT EXISTS requestIndex ON request_history (date, identifier)');
  }

  async stats() {
    try {
      const rows = await this.db.all("SELECT (SELECT sum(requests) FROM request_history WHERE request_history.date >= date('now', '-7 days')) as 'total_week', (SELECT sum(requests) FROM request_history WHERE request_history.date = date('now')) as 'total_today', (SELECT count(DISTINCT identifier) FROM request_history WHERE request_history.date >= date('now', '-7 days')) as 'unique_week', (SELECT count(DISTINCT identifier) FROM request_history WHERE request_history.date = date('now')) as 'unique_today'");
      return rows[0];
    } catch (err) {
      this.logger.error('database error inside function stats', err);
      throw err;
    }
  }

  async getHistory(identifier) {
    try {
      const rows = await this.db.all(`SELECT * FROM request_history WHERE identifier = '${identifier}' AND date = date('now')`);
      if (typeof rows[0] !== 'undefined' && typeof rows[0].requests !== 'undefined') {
        return {
          requests: rows[0].requests,
        };
      }

      return {
        requests: 0,
      };
    } catch (err) {
      this.logger.error('database error inside function getHistory', err);
      throw err;
    }
  }

  async setHistory(identifier, requests) {
    try {
      await this.db.run('INSERT OR REPLACE INTO request_history (requests, date, identifier) VALUES (?, date(\'now\'), ?)', requests, identifier);
    } catch (err) {
      this.logger.error('database error inside function setHistory', err);
      throw err;
    }
  }
}

module.exports = Database;
