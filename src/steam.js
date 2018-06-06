/**
 * short stub to get full response instead of forming it to an object definition like in the original lib
 * @type {*|SteamAPI}
 */

const steamapi = require('steamapi');

const idReg = /^\d{17}$/;

class Steam {
  constructor(key) {
    this.steamapi = new steamapi(key);
  }

  /**
   * Get users summary.
   * @param {string} id User ID
   * @returns {Promise<PlayerSummary>} Summary
   */
  getUserSummary(id) {
    const arr = Array.isArray(id);
    if ((arr && id.some(i => !idReg.test(i))) || (!arr && !idReg.test(id))) return Promise.reject(new TypeError('Invalid/no id provided'));

    return this.steamapi
      .get(`/ISteamUser/GetPlayerSummaries/v2?steamids=${id}`)
      .then((json) => {
        if (json.response.players.length) {
          return arr ? json.response.players.map(player => Steam.transformUser(player)) : Steam.transformUser(json.response.players[0]);
        } else {
          return Promise.reject(new Error('No players found'));
        }
      });
  }

  /**
   * Map the data from Steam to a more coherent object.
   * @param user
   * @returns Object
   */
  static transformUser(user) {
    return {
      steamid: user.steamid, // redundant data to support older plugin version
      steamID: user.steamid,
      personaname: user.personaname, // redundant data to support older plugin version
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

module.exports = Steam;
