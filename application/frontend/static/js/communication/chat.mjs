import { ServerCommunication } from "./ServerCommunication.mjs";

export const ChatCommunication = {
  Events: Object.freeze({
    CHAT_MESSAGE: "onChatMessage",
  }),
  Commands: Object.freeze({}),

  Communication: new ServerCommunication(),
};
