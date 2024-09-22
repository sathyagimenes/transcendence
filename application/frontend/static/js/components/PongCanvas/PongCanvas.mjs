import { attachBootstrap, Component } from "../component.mjs";
import { CanvasElement } from "./canvas-components/CanvasElement.mjs";

export class PongCanvas extends HTMLElement {
  /** @type {Component} */
  #canvas;
  /** @type {CanvasRenderingContext2D} */
  #ctx;
  /** @type {CanvasElement[]} */
  elements = [];

  constructor() {
    super();
    this.#canvas = new Component("canvas");
    this.#ctx = this.#canvas.element.getContext("2d");
  }

  connectedCallback() {
    const shadow = this.shadowRoot || this.attachShadow({ mode: "open" });
    attachBootstrap(shadow);

    shadow.appendChild(this.#canvas.element);
  }

  /**
   * @param {CanvasElement} element
   */
  addCanvasElement(element) {
    this.elements.push(element);
    return this;
  }

  clear() {
    this.#ctx.clearRect(0, 0, 100, 100);
  }

  render() {
    const canvas = this.#canvas;
    const ctx = this.#ctx;
    const worldSize = { width: 100, height: 100 };
    const canvasSize = canvas.element.getBoundingClientRect();
    canvas.element.width = canvasSize.width;
    canvas.element.height = canvasSize.height;
    ctx.resetTransform();
    ctx.scale(canvasSize.width / worldSize.width, canvasSize.height / worldSize.height);
    this.clear();
    for (const element of this.elements) {
      let previousFillStyle = ctx.fillStyle;
      let previousStrokeStyle = ctx.strokeStyle;
      element.render(ctx);
      ctx.fillStyle = previousFillStyle;
      ctx.strokeStyle = previousStrokeStyle
    }
  }
}
