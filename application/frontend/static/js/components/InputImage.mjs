import { attachBootstrap, Component } from "./component.mjs";

export class InputImage extends HTMLElement {
  /** @type {Component} */
  input;

  /** @type {Component} */
  button;

  /** @type {Component} */
  errors;

  /** @type {File[]} */
  files = [];

  constructor() {
    super();

    const attributes = (() => {
      const res = {};

      for (let i = 0; i < this.attributes.length; i++) {
        if (this.attributes[i].nodeName === "id") continue;
        if (this.attributes[i].nodeName === "class") continue;
        if (this.attributes[i].nodeName === "theme") continue;

        res[this.attributes[i].nodeName] = this.attributes[i].nodeValue;
      }

      return res;
    })();

    this.button = new Component("t-button")
      .attributes({
        type: "button",
        class: this.attributes.getNamedItem("class").nodeValue,
        theme: this.attributes.getNamedItem("theme").nodeValue,
      })
      .children([document.createElement("slot")]);

    this.input = new Component("input")
      .attributes({
        type: "file",
        accept: "image/jpeg",
        ...attributes,
      })
      .class("d-none");
    this.errors = new Component("t-errors");

    this.input.addEventListener("change", async (event) => {
      this.files = this.input.element.files;
    });

    this.button.addEventListener("click", () => {
      this.input.element.click();
    });
  }

  connectedCallback() {
    const shadow = this.shadowRoot || this.attachShadow({ mode: "open" });
    shadow.innerHTML = "<style>:host { display: block; }</style>";
    attachBootstrap(shadow);

    this.button.children([this.input]);
    shadow.appendChild(this.button.element, this.errors.element);
  }

  async getImages() {
    /** @type {Image[]} */
    const images = [];

    for (const file of this.files) {
      const reader = new FileReader();

      const img = await new Promise((res) => {
        reader.addEventListener(
          "load",
          () => {
            const img = new Image();
            img.src = reader.result;
            res(img);
          },
          false,
        );
        reader.readAsDataURL(file);
      });
      images.push(img);
    }

    return images;
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

  /**
   * @param {string | string[]} error
   */
  addErrors(errors) {
    this.errors.element.addErrors(errors);
    return this;
  }

  clearErrors() {
    this.errors.element.clearErrors();
    return this;
  }
}
