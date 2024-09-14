import { attachBootstrap, Component } from "./component.mjs";

/** @typedef {{ label: string, value: string }} TMultipleSelectOption */

export class TMultipleSelect extends HTMLElement {
  /** @type {Component} */
  container;
  /** @type {Component} */
  errors;

  /** @type {TMultipleSelectOption[]} */
  options = [];

  constructor() {
    super();
    this.container = new Component("div").class("d-flex flex-wrap gap-2");
    this.errors = new Component("t-errors");
  }

  connectedCallback() {
    const shadow = this.shadowRoot || this.attachShadow({ mode: "open" });
    shadow.innerHTML =
      "<style>:host { display: flex; flex-direction: column; }</style>";
    attachBootstrap(shadow);

    shadow.appendChild(this.container.element);
    shadow.appendChild(this.errors.element);
  }

  /**
   * @param {undefined | TMultipleSelectOption | TMultipleSelectOption[]} option
   */
  addOptions(option) {
    if (!option) return;
    if (Array.isArray(option)) {
      this.options = [...this.options, ...option];
    } else {
      this.options.push(option);
    }
    this.#updateUI();
    this.classList.add("d-flex");
    this.classList.remove("d-none");
  }

  clearOptions() {
    this.options = [];
    this.#updateUI();
    this.classList.add("d-none");
    this.classList.remove("d-flex");
  }

  getSelectedOptions() {
    const checkboxes = [...this.container.element.querySelectorAll("input")];
    const result = [];
    for (const checkbox of checkboxes) {
      if (checkbox.checked) {
        const value = checkbox.value;
        result.push(value);
      }
    }
    return result;
  }

  #updateUI() {
    this.container.clear();
    if (this.options) {
      this.container.children(
        this.options.map((option) => {
          const id = `${(Math.random() * 100).toString()}_${option.label}`;

          return new Component("div").class("mx-auto").children([
            new Component("input").class("btn-check").attributes({
              id,
              type: "checkbox",
              autocomplete: "off",
              value: option.value,
            }),
            new Component("label", { textContent: option.label })
              .class("btn btn-info")
              .attributes({ for: id })
              .styles({ minWidth: "6.6rem" }),
          ]);
        }),
      );
    }
  }
}
