import { Component } from "../../../../components/component.mjs";
import { useFriendsList } from "./hooks/useFriendsList.mjs";
import { useAddFriend } from "./hooks/useAddFriend.mjs";
import { useCreateMatch } from "../../home/hooks/useCreateMatch.mjs";
import { useMatchListeners } from "../../hooks/useMatchListeners.mjs";
import { useTournamentListeners } from "../../hooks/useTournamentListeners.mjs";

/** @type {import("../../router/router.mjs").Page} */
export const Chat = () => {
	const page = new Component("div").class("container-lg mx-auto");

  page.element.innerHTML = `
  <t-navbar></t-navbar>
  <div class="d-flex flex-column p-2 rounded mt-2">
    <h1 class="text-center" data-bs-theme="secondary">Chat</h1>
  </div>
  <div class="d-flex flex-row p-2 rounded mt-2">
    <div class="d-flex flex-column p-2 rounded col-4">
      <div class="border border-secondary p-2 rounded">
        <strong class="mb-2 d-block">Adicionar amigo</strong>

        <form id="add-friend-form" class="d-flex flex-column gap-1">
          <t-input label="Email" class="col"></t-input>

          <t-button class="d-block col" btn-class="w-100 h-100" theme="info">Adicionar</t-button>
        </form>
      </div>

      <div class="border border-secondary p-2 my-3 rounded overflow-y-auto" style="height: 60vh">
        <strong class="mb-2 d-block">Amigos</strong>
        <t-loading id="loading-players" loading="true">
          <ul id="players-list" class="list-group">
            Nenhum amigo encontrado
          </ul>
        </t-loading>
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
            <div class="col">
              <t-button id="match-create-open-modal-button" class="d-inline-block w-100 text-center" btn-class="w-100" theme="outlineInfo">Criar Partida</t-button>
            </div>
            <div class="w-100"></div>
            <div class="col">
              <t-button id="tournament-create-open-modal-button" class="d-inline-block w-100 text-center" btn-class="w-100" theme="outlineInfo">Criar Torneio</t-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <t-chat class="col-8 mt-2"></t-chat>
  </div>
  `;

  const { updateFriendsList } = useFriendsList(page);
  useAddFriend(page, { updateFriendsList });
  useCreateMatch(page);
  useMatchListeners();
  useTournamentListeners();

  return page;
};
