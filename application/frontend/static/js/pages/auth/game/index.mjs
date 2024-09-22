import { MatchCommunication } from "../../../communication/match.mjs";
import { PlayerCommunication } from "../../../communication/player.mjs";
import { Component } from "../../../components/component.mjs";
import { CanvasBall } from "../../../components/PongCanvas/canvas-components/CanvasBall.mjs";
import { CanvasPaddle } from "../../../components/PongCanvas/canvas-components/CanvasPaddle.mjs";
import { PongCanvas } from "../../../components/PongCanvas/PongCanvas.mjs";
import { router } from "../../../index.mjs";
import { session } from "../../../state/session.mjs";
import { NotFound } from "../../not-found/index.mjs";

/**
 * @import { Size, Position } from "../../../types.mjs";
 * @typedef {{
 *   match: import("../../../services/match.mjs").Match,
 *   game: {
 *      players: {
 *        placement: number,
 *        position: Position,
 *        id: string,
 *        name: string,
 *        is_local_player: boolean,
 *        avatar: string
 *        paddle: { size: Size },
 *        score: number
 *      }[],
 *      ball: { size: Size, position: Position },
 *      is_running: boolean
 *   },
 * }} Game
 */

/** @typedef {{ up: string, down: string, }} PlayerControlKeys */

/**
 * @param {PlayerControlKeys & { onKeyPressUp: () => void, onKeyPressDown: () => void }} options
 */
function onKeysPressed(options) {
  let pressedKeys = {};
  const keys = [options.up, options.down, ];
  let running = true;

  function handleKeyDown(event) {
    if (keys.includes(event.key)) {
      pressedKeys[event.key] = true;
    }
  }
  function handleKeyUp(event) {
    if (keys.includes(event.key)) {
      delete pressedKeys[event.key];
    }
  }

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);

  const onKeyPress = () => {
    if (!running) return;
    if (pressedKeys[options.up]) {
      options.onKeyPressUp();
    }
    if (pressedKeys[options.down]) {
      options.onKeyPressDown();
    }

    return window.requestAnimationFrame(onKeyPress);
  };
  const animationFrame = onKeyPress();
  return () => {
    running = false;
    document.removeEventListener("keyup", handleKeyUp);
    document.removeEventListener("keydown", handleKeyDown);
    window.cancelAnimationFrame(animationFrame);
  };
}

function setupKeyboardListenersFor(player, keys) {
  let keyPressClear;
  if (player.placement === 1 || player.placement === 2) {
    keyPressClear = onKeysPressed({
      up: keys.up,
      down: keys.down,
      onKeyPressUp() {
        MatchCommunication.Communication.send(
          MatchCommunication.Commands.KEY_PRESS,
          { direction: "UP", id: player.id },
        );
      },
      onKeyPressDown() {
        MatchCommunication.Communication.send(
          MatchCommunication.Commands.KEY_PRESS,
          { direction: "DOWN", id: player.id },
        );
      },
    });
  }
  router.addEventListener("onBeforePageChange", keyPressClear);
}

/** @type {import("../../../router/router.mjs").Page} */
export const Game = ({ params }) => {
  const match_id = params.match;

  if (!match_id) {
    router.navigate("/not-found");
    return NotFound({ params });
  }

  const page = new Component("div").class("container-lg mx-auto");
  page.element.innerHTML = `
      <t-loading id="loading-match" loading="true">
        <section class="d-flex flex-column position-relative">
          <h1 id="match-name-title" class="text-center m-2"></h1>
          <section class="mx-auto rounded p-2">
            <div class="gap-2 justify-content-center" style="display: grid; grid-template-columns: 7rem 1fr 7rem">
              <div class="player-data justify-content-center" data-placement="1"></div>
              <t-pong-canvas id="pong-canvas" class="bg-secondary rounded"></t-pong-canvas>
              <div class="player-data justify-content-center" data-placement="2"></div>
            </div>
          </section>
        </section>
      </t-loading>
  `;

  /** @type {PongCanvas} */
  const canvas = page.element.querySelector("#pong-canvas");

  MatchCommunication.Communication.setPath("/ws/match/" + match_id);
  MatchCommunication.Communication.connect(() => {
    MatchCommunication.Communication.send(
      MatchCommunication.Commands.MATCH_JOIN,
      undefined,
    );
  });
  MatchCommunication.Communication.socket.onclose = () => {
    router.navigate("/not-found");
  };

  MatchCommunication.Communication.addEventListener(
    MatchCommunication.Events.MATCH_START,
    onMatchStart,
  );

  let has_started_running = false;

  let has_rendered_players = false;
  function renderPlayersData(players) {
    const player_data_containers =
      page.element.querySelectorAll(".player-data");

    for (const container of player_data_containers) {
      const placement = container.dataset.placement;
      if (!placement) continue;

      const player = players.find((p) => p.placement === Number(placement));
      if (!player) continue;
      const c = new Component(container);

      if (has_rendered_players) {
        const score = c.element.querySelector(".score");
        score.textContent = player.score ? player.score : "0";
        continue;
      }

      c.clear();
      c.class("d-flex flex-column").children([
        new Component("img")
          .attributes({
            src: player.avatar,
          })
          .styles({ width: "80px", aspectRatio: 1 })
          .class("object-fit-cover rounded-circle mx-auto"),
        new Component("strong", { textContent: player.name }).class(
          "fs-4 text-center text-truncate",
        ),
        new Component("strong", {
          textContent: player.score ? player.score : "0",
        }).class("score fs-3 text-center"),
      ]);
    }
    has_rendered_players = true;
  }

  /**
   * @param {Game} param0
   */
  function onMatchStart({ game, match, screen }) {
    if (game.is_running && has_started_running) {
      return;
    }
    page.element.querySelector("#match-name-title").textContent = match.name;
    page.element.querySelector("#loading-match").setLoading(false);

    const ball = new CanvasBall(game.ball.position, game.ball.size);

    const players = game.players.map(({ position, paddle: p }) => {
      return { paddle: new CanvasPaddle(position, p.size) };
    });

    players.forEach((p) => canvas.addCanvasElement(p.paddle));
    canvas.addCanvasElement(ball);

    canvas.render();

    renderPlayersData(game.players);

    game.players.forEach((p) => {
      if (match.type == "MULTIPLAYER_LOCAL") {
        if (p.is_local_player) 
          setupKeyboardListenersFor(p, {
            up: "ArrowUp",
            down: "ArrowDown",
          });
          else
            setupKeyboardListenersFor(p, {
            up: "w",
            down: "s"
          });
      }
      else if (p.id === session.player.id)
        setupKeyboardListenersFor(p, {
          up: "ArrowUp",
          down: "ArrowDown"
        });
    });

    let start = 0;
    /**
     * @param {Game} param0
     */
    function onMatchUpdate({ game }) {
      players.forEach((p, i) =>
        p.paddle.pos = game.players[i].position,
      );

      ball.pos = game.ball.position;

      canvas.render();

      setTimeout(() => {
        renderPlayersData(game.players);
        start = new Date().getMilliseconds();
      });
    }

    MatchCommunication.Communication.addEventListener(
      MatchCommunication.Events.MATCH_UPDATE,
      onMatchUpdate,
    );
    has_started_running = true;
  }

  /**
   * @param {{tournament: import("../../../services/tournament.mjs").Tournament}} param0
   */
  function onPlayerNotifyTournamentEnd({ tournament }) {
    document.querySelector("#tournament-won-toast")?.open();
  }

  MatchCommunication.Communication.addEventListener(
    MatchCommunication.Events.MATCH_END,
    ({ match }) => {
      if (match?.winner?.id === session.player.id) {
        document.querySelector("#match-won-toast").open();
      }
      router.navigate("/auth");
    },
  );

  router.addEventListener(
    "onBeforePageChange",
    PlayerCommunication.Communication.addEventListener(
      PlayerCommunication.Events.PLAYER_NOTIFY_TOURNAMENT_END,
      onPlayerNotifyTournamentEnd,
    ),
  );

  router.addEventListener("onBeforePageChange", () => {
    MatchCommunication.Communication.disconnect();
  });

  return page;
};
