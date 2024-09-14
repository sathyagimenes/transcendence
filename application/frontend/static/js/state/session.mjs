class Session {
  /** @type {import("../services/player.mjs").Player | null} */
  get player() {
    return JSON.parse(localStorage.getItem("player") ?? null);
  }
  /** @param {import("../services/player.mjs").Player} value */
  set player(value) {
    localStorage.setItem("player", JSON.stringify(value ?? null));
  }
}

export const session = new Session();
