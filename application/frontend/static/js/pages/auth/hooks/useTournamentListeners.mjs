import { PlayerCommunication } from "../../../communication/player.mjs";
import { Component } from "../../../components/component.mjs";
import { router } from "../../../index.mjs";
import { TournamentService } from "../../../services/tournament.mjs";
import { session } from "../../../state/session.mjs";

export function useTournamentListeners() {
  function removeModalBackdrop() {
    const backdrops = document.querySelectorAll(".modal-backdrop");
    backdrops.forEach((backdrop) => {
      backdrop.parentNode.removeChild(backdrop);
    });
  }

  function getOrCreateModal(
    containerSelector,
    options = { backdrop: "static", focus: false },
  ) {
    const container = document.querySelector(containerSelector);
    if (!container) {
      return null;
    }
    return container;
  }

  function onTournamentAwaiting() {
    const tournamentAwaitingModal = getOrCreateModal(
      "#tournament-awaiting-modal",
    );
    if (tournamentAwaitingModal) {
      tournamentAwaitingModal.show();
    }
  }

  function closeTournamentModals() {
    removeModalBackdrop();
    const tournament_in_progress_modal = getOrCreateModal(
      "#tournament-in-progress-modal",
    );

    const modal_container = document.querySelector(
      "#tournament-in-progress-modal",
    );
    modal_container.style.display = "none";
    document.body.style.overflow = "visible";
    document.body.style.paddingRight = "auto";

    tournament_in_progress_modal?.hide?.();

    const tournament_awaiting_modal = getOrCreateModal(
      "#tournament-awaiting-modal",
    );
    tournament_awaiting_modal?.hide?.();

    const tournament_confirmation_modal = getOrCreateModal(
      "#tournament-confirmation-modal",
    );
    tournament_confirmation_modal?.hide?.();
  }

  /**
   * @param {import("../../../../services/tournament.mjs").Tournament} tournament
   */
  function onTournamentConfirmation(tournament) {
    const tournament_awaiting_modal = getOrCreateModal(
      "#tournament-confirmation-modal",
    );
    if (!tournament_awaiting_modal) {
      return;
    }

    const container = document.querySelector("#tournament-confirmation-modal");

    const reject = container.querySelector(
      "#tournament-confirmation-modal-reject-button",
    );
    const accept = container.querySelector(
      "#tournament-confirmation-modal-accept-button",
    );

    const players_container = new Component(
      container.querySelector("#tournament-confirmation-modal-players"),
    ).class("d-flex gap-2 flex-wrap");

    players_container.clear();
    players_container.children(
      tournament.players.flatMap((p, index) => {
        const elements = [new Component("b", { textContent: p.email })];
        if (index < tournament.players.length - 1) {
          elements.push(document.createTextNode(" "));
        }
        return elements;
      }),
    );

    reject.button.element.onclick = async () => {
      reject.setLoading(true);
      await TournamentService.rejectTournament();
      reject.setLoading(false);
      tournament_awaiting_modal.hide();
    };
    accept.button.element.onclick = async () => {
      accept.setLoading(true);
      await TournamentService.acceptTournament();
      accept.setLoading(false);
      tournament_awaiting_modal.hide();
    };

    tournament_awaiting_modal.show();
  }

  function onTournamentInProgress() {
    const tournament_in_progress_modal = getOrCreateModal(
      "#tournament-in-progress-modal",
    );

    if (tournament_in_progress_modal) {
      tournament_in_progress_modal.show();
    }
  }

  router.addEventListener(
    "onBeforePageChange",
    PlayerCommunication.Communication.addEventListener(
      PlayerCommunication.Events.PLAYER_NOTIFY_TOURNAMENT_UPDATE,
      ({ tournament }) => {
        switch (tournament.status) {
          case "IN_PROGRESS":
            closeTournamentModals();
            if (tournament.await_next_match) {
              onTournamentInProgress();
            }
            break;
          case "AWAITING_CONFIRMATION":
            if (tournament.confirmation.pending) {
              onTournamentConfirmation(tournament);
            } else if (tournament.confirmation.accepted) {
              onTournamentAwaiting();
            }
            break;
          case "FINISHED":
            closeTournamentModals();
            break;
          case "CANCELLED":
            closeTournamentModals();
            break;
        }
      },
    ),
  );

  try {
    if (session.player.pendencies) {
      if (session.player.pendencies.tournament_to_accept) {
        TournamentService.getTournament().then(onTournamentConfirmation);
      }
      if (session.player.pendencies.tournament_to_await) {
        onTournamentAwaiting();
      }
      if (
        session.player.pendencies.tournament_in_progress &&
        !session.player.pendencies.match_to_accept
      ) {
        onTournamentInProgress();
      }
    }
  } catch {}
}
