import { PlayerCommunication } from "../../../../communication/player.mjs";
import { Component } from "../../../../components/component.mjs";
import { router } from "../../../../index.mjs";
import { ChatService } from "../../../../services/chat.mjs";
import { UnprocessableEntityError } from "../../../../services/errors.mjs";
import { MatchService } from "../../../../services/match.mjs";
import { PlayerService } from "../../../../services/player.mjs";
import { session } from "../../../../state/session.mjs";

/**
 * @param {Component} page
 */
export function useFriendsList(page) {
  const t_chat = page.element.querySelector("t-chat");

  async function updateFriendsList() {
    page.element.querySelector("#loading-players").setLoading(true);
    const chats = await ChatService.getChats();
    page.element.querySelector("#loading-players").setLoading(false);
    const container = page.element.querySelector("#players-list");
    const private_chats = chats.filter((chat) => chat.is_private);

    container.innerHTML = "";

    private_chats.forEach((chat) => {
      const friend = chat.players.filter(
        (player) => player.id !== session.player.id,
      )[0];

      const li = new Component("li").class(
        "d-flex flex-column list-group-item justify-content-md-between",
      );

      li.element.innerHTML = `
        <span></span>
        <div class="d-flex flex-wrap gap-2">
          <t-button id="profile-button" theme="outlineLight">Perfil</t-button>
          <t-button id="chat-button" disabled="${chat.is_blocked}" theme="outlineLight">Conversar</t-button>
          <t-button id="toggle-block-button" theme="danger">${chat.is_blocked ? "Desbloquear" : "Bloquear"}</t-button>
          <t-button id="challenge-button" disabled="${friend.activity_status === "OFFLINE"}"
           theme="outlineLight">Desafiar</t-button>
        </div>
        <t-errors id="challenge-error"></t-errors>
      `;

      li.element.querySelector("span").textContent =
        `${friend.name} ${friend.activity_status}`;
      const t_button_profile = li.element.querySelector("#profile-button");
      const t_button_chat = li.element.querySelector("#chat-button");
      const t_button_toggle_block = li.element.querySelector(
        "#toggle-block-button",
      );
      const t_button_challenge = li.element.querySelector("#challenge-button");
      const challenge_errors = li.element.querySelector("#challenge-error");

      t_button_profile.button.addEventListener("click", () => {
        router.navigate("/auth/player/profile?player=" + friend.id);
      });

      t_button_chat.button.addEventListener("click", async () => {
        t_chat.t_loading.setLoading(true);
        const updatedChat = await ChatService.getChat({ chat_id: chat.id });
        t_chat.setChat(updatedChat, (newmessage) =>
          updatedChat.messages.push(newmessage),
        );
      });

      t_button_toggle_block.button.addEventListener("click", async (event) => {
        t_button_toggle_block.setLoading(true);
        let btn_text = "Bloquear";
        if (chat.is_blocked) {
          chat = await ChatService.unblockChat({ chat_id: chat.id });
          t_button_chat.setDisabled(false);
        } else {
          chat = await ChatService.blockChat({ chat_id: chat.id });
          t_button_chat.setDisabled(true);
          t_chat.closeChat();
          btn_text = "Desbloquear";
        }

        session.player = await PlayerService.getPlayer({
          player_id: session.player.id,
        });

        t_button_toggle_block.setLoading(false);
        t_button_toggle_block.textContent = btn_text;
      });

      t_button_challenge.button.addEventListener("click", async (event) => {
        t_button_challenge.setLoading(true);

        challenge_errors.clearErrors()
        try {
          await MatchService.createMatch({
            players_id: [session.player.id, friend.id],
          });
        } catch (error) {
          if (error instanceof UnprocessableEntityError) {
            challenge_errors.addErrors(error.data?.error?.players_id)
          }
        }
        finally {
          t_button_challenge.setLoading(false);
        }

      });

      container.append(li.element);
    });
  }

  updateFriendsList();

  router.addEventListener(
    "onBeforePageChange",
    PlayerCommunication.Communication.addEventListener(
      PlayerCommunication.Events.FRIEND_ACTIVITY_STATUS,
      updateFriendsList,
    ),
  );

  return { updateFriendsList };
}
