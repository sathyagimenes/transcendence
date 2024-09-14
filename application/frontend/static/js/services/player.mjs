import { GET, POST, PUT } from "./http.mjs";

export const ActivityStatus = Object.freeze({
  ONLINE: "ONLINE",
  OFFLINE: "OFFLINE",
});

/**
 * @typedef {{
 *    id: string,
 *    name: string,
 *    email: string,
 *    avatar: string,
 *    blocked_chats: import("./chat.mjs").Chat[],
 *    activity_status: keyof typeof ActivityStatus,
 *    stats: {
 *      total_play_time: number,
 *      total_score: number,
 *    },
 *    pendencies: {
 *      match_to_play: boolean,
 *      match_to_await: boolean,
 *      match_to_accept: boolean,
 *      tournament_to_accept: boolean,
 *      tournament_to_await: boolean,
 *      tournament_in_progress: boolean,
 *    }
 *  }} Player
 */

export const PlayerService = {
  /**
   * Sets a session key cookie
   *
   * @param {{ email: string, password: string }} player
   * @returns {Promise<Player>}
   */
  async login(player) {
    const { data } = await POST("/api/pong/player/login", player);
    return data.data;
  },

  /**
   * Deletes the local cookie set by the backend
   */
  async logout() {
    await POST("/api/pong/player/logout");
  },

  /**
   * @param {{ name: string, email: string, password: string }} player
   * @returns {Promise<Player>}
   */
  async createPlayer(player) {
    const { data } = await POST("/api/pong/player/create", player);
    return data.data;
  },

  /**
   * @param {{ activity_status: ActivityStatus[keyof ActivityStatus] }} payload
   * @returns {Promise<Player[]>}
   */
  async getPlayers(payload) {
    const params = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => {
      params.append(key, value);
    });

    const { data } = await GET("/api/pong/player?" + params.toString());
    return data.data;
  },

  /**
   * @param {{ player_id: string }} player
   * @returns {Promise<Player>}
   */
  async getPlayer({ player_id }) {
    const { data } = await GET("/api/pong/player/" + player_id);
    return data.data;
  },

  /**
   * @param {{ name: string }} player
   * @returns {Promise<Player>}
   */
  async updatePlayer(player) {
    const { data } = await PUT("/api/pong/player/update", player);
    return data.data;
  },

  /**
   * @param {{ avatar: File }} payload
   * @returns {Promise<Player>}
   */
  async updatePlayerAvatar(payload) {
    const form = new FormData();

    form.append("avatar", payload.avatar);

    const { data } = await POST("/api/pong/player/avatar", form);
    return data.data;
  },

  /**
   * @returns {Promise<Player[]>}
   */
  async getFriends() {
    const { data } = await GET("/api/pong/player/friends");
    return data.data;
  },

  /**
   * @param {{ email: string }} payload
   * @returns {Promise<Player>}
   */
  async addFriend(payload) {
    const { data } = await POST("/api/pong/player/friends/add", payload);
    return data.data;
  },
};
