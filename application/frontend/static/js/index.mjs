import "./override.mjs";
import { Game } from "./pages/auth/game/index.mjs";
import { Home } from "./pages/auth/home/index.mjs";
import { NotFound } from "./pages/not-found/index.mjs";
import { Login } from "./pages/login/index.mjs";
import { Router, Route } from "./router/router.mjs";
import "./communication/player.mjs";
import "./components/index.mjs";
import { Registration } from "./pages/registration/index.mjs";
import { session } from "./state/session.mjs";
import { Profile } from "./pages/auth/profile/index.mjs";
import { PlayerProfile } from "./pages/auth/player/profile/index.mjs";
import { Chat } from "./pages/auth/player/chat/index.mjs";
import { PlayerService } from "./services/player.mjs";
import { HomePage } from "./HomePage.mjs";

export const router = new Router(
  [
    new Route("/", HomePage),
    new Route("/login", Login),
    new Route("/register", Registration),
    new Route("/auth/", Home),
    new Route("/auth/game", Game),
    new Route("/auth/profile", Profile),
    new Route("/auth/player/profile", PlayerProfile),
    new Route("/auth/player/chat", Chat),
  ],
  { NotFoundPage: NotFound },
);

async function render() {
  if (session.player) {
    try {
      session.player = await PlayerService.getPlayer({
        player_id: session.player.id,
      });
    } catch {}
  }
  router.render();
}

function validateRoute() {
  if (!router.current?.path?.includes?.("auth")) {
    if (session.player) {
      router.navigate("/auth");
    }
    return;
  }

  if (!session.player) {
    router.navigate("/not-found");
  }
}

document.addEventListener("DOMContentLoaded", validateRoute);
window.addEventListener("pushstate", validateRoute);
window.addEventListener("popstate", validateRoute);

document.addEventListener("DOMContentLoaded", render);
window.addEventListener("pushstate", render);
window.addEventListener("popstate", render);
window.addEventListener("beforeunload", render, {
  passive: true,
});
