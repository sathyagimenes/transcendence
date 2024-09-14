import { attachBootstrap, Component } from "./component.mjs";

export class Toast extends HTMLElement {
  /** @type {Component} */
  container;

  constructor() {
    super();
    this.container = new Component("div").class(
      "toast-container position-fixed bottom-0 end-0 p-3",
    );

    this.container.element.innerHTML = `
      <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header">
          <slot name="header"></slot>
          <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
          <slot></slot>
        </div>
      </div>
    `;

    const button = this.container.element.querySelector("button");

    button.addEventListener("click", () => {
      this.close();
    });
  }

  connectedCallback() {
    const shadow = this.shadowRoot || this.attachShadow({ mode: "open" });
    shadow.innerHTML = "<style>:host { display: block; }</style>";
    attachBootstrap(shadow);

    shadow.appendChild(this.container.element);
  }

  open() {
    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(
      this.container.element.querySelector("div"),
    );
    toastBootstrap.show();
  }

  close() {
    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(
      this.container.element.querySelector("div"),
    );
    toastBootstrap.hide();
  }
}
