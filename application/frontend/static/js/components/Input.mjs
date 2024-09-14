import { attachBootstrap, Component } from "./component.mjs";
import { Errors } from "./Errors.mjs";

export class Input extends HTMLElement {
  /** @type {Component} */
  input;

  /** @type {Component} */
  label;

  /** @type {Errors} */
  errors;

  constructor() {
    super();

    const label = this.getAttribute("label");

    const attributes = (() => {
      const res = {};

      for (let i = 0; i < this.attributes.length; i++) {
        if (this.attributes[i].nodeName === "id") continue;

        res[this.attributes[i].nodeName] = this.attributes[i].nodeValue;
      }

      return res;
    })();

    this.input = new Component("input")
      .attributes({
        placeholder: label,
        ...attributes,
      })
      .class("form-control");
    this.label = new Component("label", {
      textContent: label,
    });
    this.errors = new Component("t-errors");
  }

  connectedCallback() {
    const shadow = this.shadowRoot || this.attachShadow({ mode: "open" });
    shadow.innerHTML = "<style>:host { display: block; }</style>";
    attachBootstrap(shadow);

    const container = new Component("div");

    container.children([this.input, this.label, this.errors]);
    container.class("form-floating");

    shadow.appendChild(container.element);
  }

  /**
   * @returns {string}
   */
  get value() {
    return this.input.element.value;
  }

  /**
   * @param {string} value
   */
  set value(value) {
    this.input.element.value = value;
  }

  focus() {
    this.input.element.focus();
  }

  /**
   * @param {string | string[]} error
   */
  addErrors(errors) {
    this.errors.element.addErrors(errors);
    this.input.removeClass("is-valid");
    this.input.class("is-invalid");
    return this;
  }

  clearErrors() {
    this.errors.element.clearErrors();
    this.input.removeClass("is-invalid");
    this.input.class("is-valid");
    return this;
  }
}
