import { attachBootstrap, Component } from "./component.mjs";

export class Modal extends HTMLElement {
  /** @type {Component} */
  container;

  /** @type {Component} */
  background;

  constructor() {
    super();
    this.container = new Component("div")
      .class("d-flex p-4 rounded flex-column")
      .styles({
        position: "fixed",
        background: "#212529",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "50vw",
        zIndex: 1000,
      });

    this.background = new Component("div").class("modal-background").styles({
      display: "none",
      background: "#000",
      opacity: "0.5",
      position: "fixed",
      top: "0px",
      left: "0px",
      width: "100vw",
      height: "100vh",
      transition: "all 500ms",
      zIndex: "999",
    });

    this.container.element.innerHTML = `
      <div>
        <slot name="header"></slot>
      </div>

      <div>
        <slot name="body"></slot>
      </div>

      <div class="mt-3">
        <slot name="footer"></slot>
      </div>
    `;
  }

  show() {
    this.classList.add("d-block");
    this.classList.remove("d-none");
    this.background.element.style.display = "block";
  }

  hide() {
    this.classList.add("d-none");
    this.classList.remove("d-block");
    this.background.element.style.display = "none";
  }

  connectedCallback() {
    const shadow = this.shadowRoot || this.attachShadow({ mode: "open" });
    shadow.innerHTML = "<style>:host { display: none; }</style>";
    attachBootstrap(shadow);

    shadow.appendChild(this.background.element);
    shadow.appendChild(this.container.element);
  }
}
