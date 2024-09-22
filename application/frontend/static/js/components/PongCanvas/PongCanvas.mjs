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

    //TO DEBUG

    // this.#ctx.strokeStyle = "green";
    // this.#ctx.strokeRect(0, 0, 100, 100);
    // // draw a small circle on (0,0)
    // this.#ctx.beginPath();
    // this.#ctx.arc(0, 0, 1, 0, 2 * Math.PI);
    // this.#ctx.fillStyle = "red";
    // this.#ctx.fill();
    // // draw a small circle on (100,100)
    // this.#ctx.beginPath();
    // this.#ctx.arc(100, 100, 1, 0, 2 * Math.PI);
    // this.#ctx.fillStyle = "blue";
    // this.#ctx.fill();    
  }

  render() {
    const canvas = this.#canvas;
    const ctx = this.#ctx;
    const worldSize = { width: 100, height: 100 };
    const canvasSize = canvas.element.getBoundingClientRect();
    const TAU = 2 * Math.PI;
    canvas.element.width = canvasSize.width;
    canvas.element.height = canvasSize.height;
    ctx.resetTransform();
    if (canvasSize.width <= 300) {
      ctx.translate(canvasSize.width, 0);
      ctx.scale(canvasSize.height / worldSize.width, canvasSize.width / worldSize.height);
      ctx.rotate(TAU * 0.25);
    } else {
      ctx.scale(canvasSize.width / worldSize.width, canvasSize.height / worldSize.height);
    }
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
