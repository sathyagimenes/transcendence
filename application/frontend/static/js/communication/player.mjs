import { session } from "../state/session.mjs";
import { ServerCommunication } from "./ServerCommunication.mjs";

export const PlayerCommunication = {
  Events: Object.freeze({
    PLAYER_NOTIFY_MATCH_UPDATE: "onPlayerNotifyMatchUpdate",
    PLAYER_NOTIFY_TOURNAMENT_UPDATE: "onPlayerNotifyTournamentUpdate",
    PLAYER_NOTIFY_TOURNAMENT_END: "onPlayerNotifyTournamentEnd",
    FRIEND_ACTIVITY_STATUS: "onFriendActivityStatusChange",
  }),
  Commands: Object.freeze({}),

  Communication: new ServerCommunication("/ws/player/"),
};
if (session.player) {
  PlayerCommunication.Communication.connect();
}
