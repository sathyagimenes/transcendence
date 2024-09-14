import { Component } from "../../../../components/component.mjs";
import { RequestFailedError } from "../../../../services/errors.mjs";
import { PlayerService } from "../../../../services/player.mjs";
import { session } from "../../../../state/session.mjs";

/**
 * @param {Component} page
 */
export function useAddFriend(page, { updateFriendsList }) {
  const form_add_friend = page.element.querySelector("#add-friend-form");
  const form_add_friend_t_input_email =
    form_add_friend.querySelector("t-input");

  let form_add_friend_email = "";
  form_add_friend_t_input_email.input.addEventListener("change", (e) => {
    form_add_friend_email = e.target.value;
  });

  form_add_friend.addEventListener("submit", async (event) => {
    event.preventDefault();
    form_add_friend_t_input_email.clearErrors();
    const form_add_friend_t_input_button =
      form_add_friend.querySelector("t-button");

    try {
      form_add_friend_t_input_button.setLoading(true);
      const player = await PlayerService.addFriend({
        email: form_add_friend_email,
      });
      session.player = player;
      await updateFriendsList();
      form_add_friend_t_input_email.value = "";
    } catch (error) {
      if (error instanceof RequestFailedError) {
        form_add_friend_t_input_email.addErrors(error.data?.error?.email);
      }
    } finally {
      form_add_friend_t_input_button.setLoading(false);
    }
  });
}
