import { attachBootstrap, Component } from "./component.mjs";

export class TConditional extends HTMLElement {
  static observedAttributes = ["condition"];

  constructor() {
    super();
    this.container = new Component("div");
  }

  /**
   * @param {boolean} value
   */
  setCondition(value) {
    this.setAttribute("condition", value ? "true" : "false");
  }

  connectedCallback() {
    const shadow = this.shadowRoot || this.attachShadow({ mode: "open" });
    shadow.innerHTML = "<style>:host { display: block; }</style>";
    attachBootstrap(shadow);

    shadow.appendChild(this.container.element);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "condition") {
      if (newValue === "true") {
        this.container.clear();
        this.container.children([
          new Component(document.createElement("slot")).attributes({
            name: "if",
          }),
        ]);
      } else {
        this.container.clear();
        this.container.children([
          new Component(document.createElement("slot")).attributes({
            name: "else",
          }),
        ]);
      }
    }
  }
}
