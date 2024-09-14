import { PlayerCommunication } from "../../../communication/player.mjs";
import { Component } from "../../../components/component.mjs";
import { router } from "../../../index.mjs";
import { MatchService } from "../../../services/match.mjs";
import { session } from "../../../state/session.mjs";

export function useMatchListeners() {
  function removeModalBackdrop() {
    const backdrops = document.querySelectorAll(".modal-backdrop");
    backdrops.forEach((backdrop) => {
      backdrop.parentNode.removeChild(backdrop);
    });
  }

  function closeAllModals() {
    const openModals = document.querySelectorAll("t-modal");
    openModals.forEach((modalElement) => {
      const modalInstance = modalElement;
      if (modalInstance) {
        modalInstance.hide();
      }
    });
    removeModalBackdrop();
  }

  function getOrCreateModal(
    containerSelector,
    options = { backdrop: "static" },
  ) {
    const container = document.querySelector(containerSelector);
    if (!container) {
      return null;
    }
    return container;
  }

  function onMatchStart(match) {
    const matchAwaitingModal = getOrCreateModal("#match-awaiting-modal");
    if (matchAwaitingModal) {
      matchAwaitingModal.hide();
    }
    setTimeout(() => {
      router.navigate("/auth/game?match=" + match.id);
    }, 100);
  }

  function onMatchAwaiting() {
    const matchAwaitingModal = getOrCreateModal("#match-awaiting-modal");
    if (matchAwaitingModal) {
      matchAwaitingModal.show();
    }
  }

  function onMatchCancelled() {
    closeAllModals();
    removeModalBackdrop();
  }

  /**
   * @param {import("../../../../services/match.mjs").Match} match
   */
  function onMatchConfirmation(match) {
    const matchConfirmationModal = getOrCreateModal(
      "#match-confirmation-modal",
    );
    if (!matchConfirmationModal) {
      return;
    }

    const container = document.querySelector("#match-confirmation-modal");

    const rejectButton = container.querySelector(
      "#match-confirmation-modal-reject-button",
    );
    const acceptButton = container.querySelector(
      "#match-confirmation-modal-accept-button",
    );

    const players_container = new Component(
      container.querySelector("#match-confirmation-modal-players"),
    ).class("d-flex gap-2 flex-wrap");

    players_container.clear();
    players_container.children(
      match.players.flatMap((p, index) => {
        const elements = [new Component("b", { textContent: p.email })];
        if (index < match.players.length - 1) {
          elements.push(document.createTextNode(" "));
        }
        return elements;
      }),
    );

    rejectButton.button.element.onclick = async () => {
      rejectButton.setLoading(true);
      try {
        await MatchService.rejectMatch();
        matchConfirmationModal.hide();
      } catch (error) {
        console.error("Error rejecting match:", error);
      } finally {
        rejectButton.setLoading(false);
      }
    };

    acceptButton.button.element.onclick = async () => {
      acceptButton.setLoading(true);
      try {
        await MatchService.acceptMatch();
        matchConfirmationModal.hide();
      } catch (error) {
        console.error("Error accepting match:", error);
      } finally {
        acceptButton.setLoading(false);
      }
    };

    matchConfirmationModal.show();
  }

  router.addEventListener(
    "onBeforePageChange",
    PlayerCommunication.Communication.addEventListener(
      PlayerCommunication.Events.PLAYER_NOTIFY_MATCH_UPDATE,
      ({ match }) => {
        switch (match.status) {
          case "IN_PROGRESS":
            onMatchStart(match);
            break;
          case "AWAITING_CONFIRMATION":
            if (match.confirmation.pending) {
              onMatchConfirmation(match);
            } else if (match.confirmation.accepted) {
              onMatchAwaiting();
            }
            break;
          case "CANCELLED":
            onMatchCancelled();
            break;
          default:
            console.warn("Unknown match status:", match.status);
        }
      },
    ),
  );

  try {
    if (session.player.pendencies) {
      if (session.player.pendencies.match_to_play) {
        MatchService.getMatch().then(onMatchStart);
      }

      if (session.player.pendencies.match_to_accept) {
        MatchService.getMatch().then(onMatchConfirmation);
      }

      if (session.player.pendencies.match_to_await) {
        onMatchAwaiting();
      }
    }
  } catch {}
}
