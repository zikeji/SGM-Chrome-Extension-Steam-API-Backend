const config = require('./config.js');
const logger = require('./logger.js')(config);
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const express = require('express');
const steam = require('steam-web');

const s = new steam({
  apiKey: config.steamApiKey,
  form: 'json',
});

const db = new sqlite3.Database('stats.sqlite');
const sha256 = (data) => crypto.createHash('sha256').update(data).digest('base64');

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS request_history (requests INT NOT NULL, date DATE NOT NULL, identifier STRING NOT NULL)');
  db.run('CREATE UNIQUE INDEX IF NOT EXISTS requestIndex ON request_history (date, identifier)');

  const app = express();
  app.use(bodyParser.json());


  app.get('/', (req, res) => {
    db.all('SELECT (SELECT sum(requests) FROM request_history WHERE request_history.date >= date(\'now\', \'-7 days\')) as \'total_week\', (SELECT sum(requests) FROM request_history WHERE request_history.date = date(\'now\')) as \'total_today\', (SELECT count(DISTINCT identifier) FROM request_history WHERE request_history.date >= date(\'now\', \'-7 days\')) as \'unique_week\', (SELECT count(DISTINCT identifier) FROM request_history WHERE request_history.date = date(\'now\')) as \'unique_today\'', (err, rows) => {
      if (!err) {
        res.json(rows[0]);
      } else {
        res.sendStatus(500);
      }
    });
  });

  const processLimit = (ip, agent) => new Promise((resolve, reject) => {
    const identifier = sha256(`${ip}${agent}${config.salt}`);
    db.all(`SELECT * FROM request_history WHERE identifier = '${identifier}' AND date = date('now')`, (err, rows) => {
      if (!err) {
        let requests = 0;
        if (typeof rows[0] !== 'undefined' && typeof rows[0].requests !== 'undefined') requests = rows[0].requests;
        ++requests;

        db.run('INSERT OR REPLACE INTO request_history (requests, date, identifier) VALUES (?, date(\'now\'), ?)', requests, identifier);

        if (requests > config.dailyLimit) {
          reject();
        } else {
          resolve(requests);
        }
      } else {
        logger.error(err);
        reject();
      }
    });
  });

  app.post('/', (req, res) => {
    if (typeof req.body.steamID64 !== 'undefined' && typeof req.headers['user-agent'] !== 'undefined') {
      processLimit(req.ip, req.headers['user-agent']).then((requests) => {
        res.set('x-Requests', requests);
        res.set('x-Request-Limit', config.dailyLimit);
        s.getPlayerSummaries({
          steamids: req.body.steamID64,
          callback: (err, data) => {
            if (!err && typeof data.response !== 'undefined' && typeof data.response.players !== 'undefined') {
              const returnArray = [];
              for (let i = 0; i < data.response.players.length; i++) {
                const player = data.response.players[i];
                returnArray.push({
                  steamid: player.steamid,
                  personaname: player.personaname,
                });
              }
              res.json(returnArray);
            } else {
              logger.error('err', err);
              res.sendStatus(503);
            }
          },
        });
      }).catch(() => {
        res.sendStatus(429);
      });
    } else {
      res.sendStatus(400);
    }
  });

  app.listen(config.port);

});