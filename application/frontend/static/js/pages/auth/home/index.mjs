import { Component } from "../../../components/component.mjs";
import { router } from "../../../index.mjs";
import { PlayerService } from "../../../services/player.mjs";
import { session } from "../../../state/session.mjs";
import { useCreateTournament } from "./hooks/useCreateTournament.mjs";
import { useFindMatch } from "./hooks/useFindMatch.mjs";
import { useCreateMatch } from "./hooks/useCreateMatch.mjs";
import { useMatchListeners } from "../hooks/useMatchListeners.mjs";
import { useTournamentListeners } from "../hooks/useTournamentListeners.mjs";

/** @type {import("../../router/router.mjs").Page} */
export const Home = () => {
  const page = new Component("div")
    .class("container-lg mx-auto")
    .styles({ maxHeight: "80vh" });

  page.element.innerHTML = `
  <t-navbar></t-navbar>
  <div class="d-flex flex-column p-2 rounded mt-2">
    <h1 class="text-center" data-bs-theme="secondary">Transcendence</h1>
  </div>
  <div class="container-lg rounded gap-2 p-2 mt-2">
    <div class="top-image mt-3">
        <img src="/media/default/front/banner.jpg" alt="Banner" class="rounded rounded-5 w-50">
    </div>
    <div class="d-flex flex-wrap row gap-2 p-2 mt-2">
        <div class="col-12 col-md d-flex">
            <t-button id="local-match-create-button" class="d-flex align-items-stretch w-100 text-center" btn-class="w-100" theme="outlineInfo">Criar Partida Local</t-button>
        </div>
        <div class="col-12 col-md d-flex">
            <t-button id="match-create-open-modal-button" class="d-flex align-items-stretch w-100 text-center" btn-class="w-100" theme="outlineInfo">Criar Partida</t-button>
        </div>
        <div class="col-12 col-md d-flex">
            <t-button id="tournament-create-open-modal-button" class="d-flex align-items-stretch w-100 text-center" btn-class="w-100" theme="outlineInfo">Criar Torneio</t-button>
        </div>
        <div class="col-12 col-md d-flex">
            <t-button id="find-match-button" class="d-flex align-items-stretch w-100 text-center" btn-class="w-100" theme="outlineInfo">Encontrar Partida</t-button>
            <t-errors id="find-match-errors" class="mt-2"></t-errors>
        </div>
    </div>
</div>

  <div class="mt-2 row">

      <div id="tournament-create-modal" class="modal fade" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Criar Torneio</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <div class="modal-body">
              <t-input label="Nome"></t-input>
              <t-multiple-select class="mt-2"></t-multiple-select>
            </div>
            <div class="modal-footer">
              <t-button data-bs-dismiss="modal" theme="secondary">Fechar</t-button>
              <t-button id="tournament-create-modal-create-button">Criar</t-button>
            </div>
          </div>
        </div>
      </div>

      <div id="match-create-modal" class="modal fade" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Criar Partida</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <div class="modal-body">
              <t-multiple-select class="mt-2"></t-multiple-select>
            </div>
            <div class="modal-footer">
              <t-button data-bs-dismiss="modal" theme="secondary">Fechar</t-button>
              <t-button id="match-create-modal-create-button">Criar</t-button>
            </div>
          </div>
        </div>
      </div>

  </div>
  `;

  useCreateMatch(page);
  useCreateTournament(page);
  useFindMatch(page);
  useMatchListeners();
  useTournamentListeners();

  return page;
};
