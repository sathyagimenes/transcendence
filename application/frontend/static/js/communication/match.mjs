import { ServerCommunication } from "./ServerCommunication.mjs";

export const MatchCommunication = {
  Events: Object.freeze({
    MATCH_START: "onMatchStart",
    MATCH_UPDATE: "onMatchUpdate",
    MATCH_END: "onMatchEnd",
  }),
  Commands: Object.freeze({
    MATCH_JOIN: "MATCH_JOIN",
    KEY_PRESS: "KEY_PRESS",
  }),

  Communication: new ServerCommunication(),
};
