import { Component } from "../../../components/component.mjs";
import { TournamentService } from "../../../services/tournament.mjs";

/**
 * @param {Component} page
 * @param {{ from_player: import("../../../services/player.mjs").Player }} param1
 */
export function useTournamentHistory(page, { from_player }) {
  const t_loading = page.element.querySelector("#loading-tournaments");
  const tournaments_container = page.element.querySelector(
    "#tournaments-container",
  );
  TournamentService.getTournaments({ from_player_id: from_player.id }).then(
    (tournaments) => {
      t_loading.setLoading(false);

      const container = new Component(tournaments_container);

      container.clear();
      const tournaments_components = tournaments.map((tournament) => {
        const hasWonTournament = from_player.id === tournament.champion?.id;
        return new Component("div").class("card p-3").children([
          new Component("card-body").children([
            new Component("h5", { textContent: tournament.name })
              .class("card-title d-flex justify-content-between flex-wrap text-break")
              .children([
                tournament.champion
                  ? new Component("span", {
                      textContent: hasWonTournament ? "Vitória" : "Derrota",
                    })
                      .class("p-2 rounded fs-6 text-center")
                      .styles({ width: "5rem" })
                      .class(
                        hasWonTournament ? "bg-success" : "bg-danger",
                      )
                  : undefined,
              ]),
            new Component("h6", {
              textContent: `Vencedor: ${tournament.champion?.name ?? ""}`,
            }).class("card-subtitle mb-2 text-body-secondary"),

            new Component("div")
              .class("card-text d-flex flex-column")
              .children([
                new Component("span", {
                  textContent: `Data: ${new Date(tournament.created_at).toLocaleString("pt-br")}`,
                }),
              ]),
          ]),
        ]);
      });
      container.children(tournaments_components);
    },
  );
}
