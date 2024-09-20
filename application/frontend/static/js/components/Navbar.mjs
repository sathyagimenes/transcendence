import { Component, attachBootstrap } from "./component.mjs";
import { router } from "../index.mjs";
import { session } from "../state/session.mjs";
import { PlayerService } from "../services/player.mjs";

export class Navbar extends HTMLElement {
  constructor() {
    super();
    this.container = new Component("nav", {
      class: "container mx-auto",
    });

    this.renderNavbar();
  }

  renderNavbar() {
    const isAuthenticated = !!session.player;
    const navbarContent = `
            <nav class="navbar navbar-expand-lg navbar-dark bg-dark border border-secondary shadow rounded rounded-3">
                <div class="container-lg">
                    <t-button to="${
                      isAuthenticated ? "/auth/" : "/"
                    }" theme="dark" btn-class="navbar-brand">Transcendence</t-button>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav ms-auto">
                            ${
                              isAuthenticated
                                ? `
                                <li class="nav-item">
                                        <t-button to="${
                                          isAuthenticated ? "/auth/" : "/"
                                        }" id="chat-button" theme="dark" btn-class="nav-link px-3">Home</t-button>
                                </li>
                                <li class="nav-item">
                                        <t-button to="/auth/player/chat" id="chat-button" theme="dark" btn-class="nav-link px-3">Chat</t-button>
                                </li>
                                <li class="nav-item">
                                    <t-button to="/auth/profile" theme="dark" btn-class="nav-link px-3">Perfil</t-button>
                                </li>
                                <li class="nav-item">
                                        <t-button id="logout-button" theme="dark" btn-class="nav-link px-3">Logout</t-button>
                                </li>
                            `
                                : `
                                <li class="nav-item">
                                    <t-button to="/login" theme="dark" btn-class="nav-link px-3">Login</t-button>
                                </li>
                                <li class="nav-item">
                                    <t-button to="/register" theme="dark" btn-class="nav-link px-3">Registrar</t-button>
                                </li>
                            `
                            }
                        </ul>
                    </div>
                </div>
            </nav>
        `;

    this.container.element.innerHTML = navbarContent;
  }

  connectedCallback() {
    const shadow = this.shadowRoot || this.attachShadow({ mode: "open" });
    shadow.innerHTML = "<style>:host { display: block; }</style>";
    attachBootstrap(shadow);

    shadow.appendChild(this.container.element);

    this.setupButtonEvents(shadow);
  }

  setupButtonEvents(shadow) {
    const toggler = shadow.querySelector(".navbar-toggler");
    const collapse = shadow.querySelector("#navbarNav");

    if (toggler && collapse) {
      toggler.addEventListener("click", () => {
        collapse.classList.toggle("show");
      });
    }

    const logout_button = shadow.querySelector("#logout-button");

    if (logout_button) {
      logout_button.button.addEventListener("click", async () => {
        try {
          logout_button.setLoading(true);
          await PlayerService.logout();
        } catch {
        } finally {
          logout_button.setLoading(false);
          session.player = undefined;
          router.navigate("/login");
        }
      });
    }
  }
}
