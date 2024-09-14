import { Component } from "../../../../components/component.mjs";
import { UnprocessableEntityError } from "../../../../services/errors.mjs";
import { MatchService, MatchType } from "../../../../services/match.mjs";
import { ActivityStatus, PlayerService } from "../../../../services/player.mjs";
import { session } from "../../../../state/session.mjs";

/**
 * @param {Component} page
 */
export function useCreateMatch(page) {
  const t_button_tournament_open_modal = page.element.querySelector(
    "#match-create-open-modal-button"
  );
  const t_button_tournament_create_modal_create = page.element.querySelector(
    "#match-create-modal-create-button"
  );
  const t_button_local_match_create = page.element.querySelector(
    "#local-match-create-button"
  );

  if (t_button_tournament_open_modal) {
    t_button_tournament_open_modal.button.addEventListener(
      "click",
      async () => {
        const container = page.element.querySelector("#match-create-modal");
        const t_multiple_select = container.querySelector("t-multiple-select");
        const modal = bootstrap.Modal.getOrCreateInstance(container);

        t_multiple_select.clearOptions();

        modal.show();

        const players = await PlayerService.getPlayers({
          activity_status: ActivityStatus.ONLINE,
        });
        const options = players.map((p) => ({ label: p.name, value: p.id }));

        t_multiple_select.addOptions(options);
      }
    );
  }

  if (t_button_tournament_create_modal_create) {
    t_button_tournament_create_modal_create.button.addEventListener(
      "click",
      async () => {
        t_button_tournament_create_modal_create.setLoading(true);
        const container = page.element.querySelector("#match-create-modal");
        const t_multiple_select = container.querySelector("t-multiple-select");
        const modal = bootstrap.Modal.getOrCreateInstance(container);

        t_multiple_select.errors.element.clearErrors();

        try {
          await MatchService.createMatch({
            players_id: t_multiple_select.getSelectedOptions(),
            type: MatchType.MULTIPLAYER_ONLINE,
          });
          modal.hide();
        } catch (error) {
          if (error instanceof UnprocessableEntityError) {
            t_multiple_select.errors.element.addErrors(
              error.data?.error?.players_id
            );
          }
        } finally {
          t_button_tournament_create_modal_create.setLoading(false);
        }
      }
    );
  }

  if (t_button_local_match_create) {
    t_button_local_match_create.button.addEventListener("click", async () => {
      t_button_local_match_create.setLoading(true);
  
      try {
        await MatchService.createMatch({
          players_id: [session.player.id],
          type: MatchType.MULTIPLAYER_LOCAL,
        });
      } catch (error) {
      } finally {
        t_button_local_match_create.setLoading(false);
      }
    });
  }
}
