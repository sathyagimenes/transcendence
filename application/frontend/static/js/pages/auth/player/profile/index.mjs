import { Component } from "../../../../components/component.mjs";
import { PlayerService } from "../../../../services/player.mjs";
import { NotFound } from "../../../not-found/index.mjs";
import { useMatchesHistory } from "../../hooks/useMatchesHistory.mjs";
import { useMatchListeners } from "../../hooks/useMatchListeners.mjs";
import { useTournamentHistory } from "../../hooks/useTournamentHistory.mjs";
import { useTournamentListeners } from "../../hooks/useTournamentListeners.mjs";

/** @type {import("../../router/router.mjs").Page} */
export const PlayerProfile = ({ params }) => {
  const player_id = params.player;

  if (!player_id) {
    return NotFound({ params });
  }

  const page = new Component("div").class("container-lg mx-auto");

  page.element.innerHTML = `
    <t-loading loading="true">
    <t-navbar></t-navbar>
    <div class="d-flex flex-column p-2 rounded mt-2">
      <h1 class="text-center">Perfil</h1>
    </div>
    <div class="d-flex flex-column p-2 rounded mt-2">
      <div class="d-flex justify-content-between align-items-center p-2">
        <div class="info-container">
          <h1 id="name-placeholder">Perfil</h1>
          <span id="email-placeholder" class="mt-2"></span>
          <span id="total-play-time"></span>
          <span id="total-score"></span>
        </div>
        <div class="d-flex flex-column gap-2 position-relative w-100 avatar-container" style="max-width: 200px">
          <img id="avatar-preview" class="avatar" />
        </div>
      </div>
    </div>
  </t-loading>

  <div class=" p-2 rounded d-flex gap-2 mt-3">
    <div class="bg-secondary p-2 rounded w-100">
      <h2>Torneios</h2>

      <t-loading id="loading-tournaments" loading="true">
        <div id="tournaments-container" class="d-flex flex-column gap-2 overflow-auto" style="height: 50vh">
        </div>
      </t-loading>
    </div>
    <div class="bg-secondary p-2 rounded w-100">
      <h2>Partidas</h2>

      <t-loading id="loading-matches" loading="true">
        <div id="matches-container" class="d-flex flex-column gap-2 overflow-auto" style="height: 50vh">
        </div>
      </t-loading>
    </div>
  </div>
`;

  useMatchListeners();
  useTournamentListeners();

  const t_loading = page.element.querySelector("t-loading");
  const name_placeholder = page.element.querySelector("#name-placeholder");
  const email_placeholder = page.element.querySelector("#email-placeholder");
  const total_play_time = page.element.querySelector("#total-play-time");
  const total_score = page.element.querySelector("#total-score");
  const avatar_preview = page.element.querySelector("#avatar-preview");

  PlayerService.getPlayer({ player_id }).then((player) => {
    t_loading.setLoading(false);

    name_placeholder.textContent = player.name;
    email_placeholder.textContent = player.email;
    total_play_time.textContent = `Tempo Jogado: ${player.stats.total_play_time}s`;
    total_score.textContent = `Pontuação Total: ${player.stats.total_score}`;
    avatar_preview.src = player.avatar;

    useTournamentHistory(page, { from_player: player });
    useMatchesHistory(page, { from_player: player });
  });

  return page;
};
