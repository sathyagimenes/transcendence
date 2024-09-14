import { Component } from "../../../../components/component.mjs";
import { UnprocessableEntityError } from "../../../../services/errors.mjs";
import { ActivityStatus, PlayerService } from "../../../../services/player.mjs";
import { TournamentService } from "../../../../services/tournament.mjs";

/**
 * @param {Component} page
 */
export function useCreateTournament(page) {
  const t_button_tournament_open_modal = page.element.querySelector(
    "#tournament-create-open-modal-button",
  );
  const t_button_tournament_create_modal_create = page.element.querySelector(
    "#tournament-create-modal-create-button",
  );
  t_button_tournament_open_modal.button.addEventListener("click", async () => {
    const container = page.element.querySelector("#tournament-create-modal");
    const t_multiple_select = container.querySelector("t-multiple-select");
    const t_input = container.querySelector("t-input");
    const modal = bootstrap.Modal.getOrCreateInstance(container);

    t_input.value = "";
    t_multiple_select.clearOptions();

    modal.show();

    const players = await PlayerService.getPlayers({
      activity_status: ActivityStatus.ONLINE,
    });
    const options = players.map((p) => ({ label: p.name, value: p.id }));

    t_multiple_select.addOptions(options);
  });

  t_button_tournament_create_modal_create.button.addEventListener(
    "click",
    async () => {
      t_button_tournament_create_modal_create.setLoading(true);
      const container = page.element.querySelector("#tournament-create-modal");
      const t_multiple_select = container.querySelector("t-multiple-select");
      const t_input = container.querySelector("t-input");
      const modal = bootstrap.Modal.getOrCreateInstance(container);

      t_input.clearErrors();
      t_multiple_select.errors.element.clearErrors();

      try {
        await TournamentService.createTournament({
          name: t_input.value,
          players_id: t_multiple_select.getSelectedOptions(),
        });
        modal.hide();
      } catch (error) {
        if (error instanceof UnprocessableEntityError) {
          t_input.addErrors(error.data?.error?.name);
          t_multiple_select.errors.element.addErrors(
            error.data?.error?.players_id,
          );
        }
      } finally {
        t_button_tournament_create_modal_create.setLoading(false);
      }
    },
  );
}
