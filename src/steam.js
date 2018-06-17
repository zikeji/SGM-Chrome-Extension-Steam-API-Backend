/**
 * short stub to get full response instead of forming it to an object definition like in the original lib
 * @type {*|SteamAPI}
 */

const steamapi = require('steamapi');
const NodeCache = require('node-cache');

const idReg = /^\d{17}$/;

class Steam {
  constructor(config, logger) {
    this.steamapi = new steamapi(config.steamApiKey);
    this.cache = new NodeCache({ stdTTL: config.cacheTimeout, checkperiod: config.cacheTimeout * 0.2 });
    this.logger = logger;
  }

  /**
   * Get users summary.
   * @param {string} id User ID
   * @returns {array} Summary
   */
  async getUserSummary(id) {
    if (!Array.isArray(id)) id = [id];
    if (id.some(i => !idReg.test(i))) throw new TypeError('Invalid/no id provided');

    const resultArray = [];

    const cached = this.cache.mget(id);
    if (Object.values(cached).length > 0) {
      Object.values(cached).forEach((player) => {
        id.splice(id.indexOf(player.steamID), 1);
        const expires = this.cache.getTtl(player.steamID);
        player.cacheExpires = expires ? new Date(expires) : null;
        resultArray.push(player);
      });
    }

    if (id.length > 0) {
      const json = await this.steamapi.get(`/ISteamUser/GetPlayerSummaries/v2?steamids=${id}`);
      if (json.response.players.length > 0) {
        const responsePlayers = json.response.players.map(player => Steam.transformUser(player));

        responsePlayers.forEach((player) => {
          resultArray.push(player);
          this.cache.set(player.steamID, player, (err) => {
            if (err) this.logger.error('Unable to set new cache', err);
          });
        });
      }
    }

    return resultArray;
  }

  /**
   * Map the data from Steam to a more coherent object.
   * @param user
   * @returns Object
   */
  static transformUser(user) {
    return {
      // steamid: user.steamid, // redundant data to support older plugin version
      steamID: user.steamid,
      // personaname: user.personaname, // redundant data to support older plugin version
      nickname: user.personaname,
      avatar: {
        small: user.avatar,
        medium: user.avatarmedium,
        // large: user.avatarfull,
      },
      lastLogOff: user.lastlogoff,
      visibilityState: user.communityvisibilitystate,
      personaState: user.personastate,
      game: (user.gameid || user.gameextrainfo || user.gameserverip)
        ? {
          id: user.gameid,
          extraInfo: user.gameextrainfo,
          serverIP: user.gameserverip,
        } : undefined,
    };
  }
}

module
  .exports = Steam;
