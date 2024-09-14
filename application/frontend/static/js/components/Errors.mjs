import { attachBootstrap, Component } from "./component.mjs";

export class Errors extends HTMLElement {
  /** @type {Component} */
  container;
  /** @type {string[]} */
  errors = [];

  constructor() {
    super();
    this.container = new Component("div").class("d-flex flex-column");
  }

  connectedCallback() {
    const shadow = this.shadowRoot || this.attachShadow({ mode: "open" });
    shadow.innerHTML = "<style>:host { display: none; }</style>";
    attachBootstrap(shadow);

    this.container.class("text-danger-emphasis");

    shadow.appendChild(this.container.element);
  }

  /**
   * @param {undefined | string | string[]} error
   */
  addErrors(error) {
    if (!error) return;
    if (Array.isArray(error)) {
      this.errors = [...this.errors, ...error];
    } else {
      this.errors.push(error);
    }
    this.#updateUI();
    this.classList.add("d-flex");
    this.classList.remove("d-none");
  }

  clearErrors() {
    this.errors = [];
    this.#updateUI();
    this.classList.add("d-none");
    this.classList.remove("d-flex");
  }

  #updateUI() {
    this.container.clear();
    if (this.errors) {
      this.container.children(
        this.errors.map(
          (error) => new Component("span", { textContent: error }),
        ),
      );
    }
  }
}
