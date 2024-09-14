import { GET, POST } from "./http.mjs";

/**
 * @typedef {{
 *    id: string,
 *    name: string,
 *    status: string,
 *    root_match: import("./match.mjs").Match,
 *    champion: import("./player.mjs").Player | null,
 *    players: import("./player.mjs").Player[]
 *    created_at: string,
 *    updated_at: string,
 *    confirmation?: {
 *      accepted: boolean,
 *      rejected: boolean,
 *      pending: boolean
 *    },
 *    await_next_match?: boolean
 *  }} Tournament
 */

export const TournamentService = {
  /**
   * @param {{ from_player_id: string }} payload
   * @returns {Promise<Tournament[]>}
   */
  async getTournaments(payload) {
    const { data } = await GET(
      "/api/pong/tournament?player_id=" + payload.from_player_id,
    );
    return data.data;
  },

  /**
   * @returns {Promise<Tournament>}
   */
  async getTournament() {
    const { data } = await GET("/api/pong/tournament/get");
    return data.data;
  },

  /**
   * Accept the current active tournament
   * @returns {Promise<Tournament>}
   */
  async acceptTournament() {
    const { data } = await GET("/api/pong/tournament/accept");
    return data.data;
  },

  /**
   * Accept the current active tournament
   * @returns {Promise<Tournament>}
   */
  async rejectTournament() {
    const { data } = await GET("/api/pong/tournament/reject");
    return data.data;
  },

  /**
   * @param {{ name: string, players_id: string[] }} payload
   * @returns {Promise<Tournament>}
   */
  async createTournament(payload) {
    const { data } = await POST("/api/pong/tournament/create", payload);
    return data.data;
  },
};
