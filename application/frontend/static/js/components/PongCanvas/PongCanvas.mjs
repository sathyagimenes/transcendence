import { attachBootstrap, Component } from "../component.mjs";
import { CanvasElement } from "./canvas-components/CanvasElement.mjs";

export class PongCanvas extends HTMLElement {
  /** @type {Component} */
  #canvas;
  /** @type {CanvasRenderingContext2D} */
  #ctx;
  width = 500;
  height = 500;
  /** @type {CanvasElement[]} */
  elements = [];

  constructor() {
    super();
    this.#canvas = new Component("canvas");
    this.#canvas.attributes({ width: this.width, height: this.height });
    this.#ctx = this.#canvas.element.getContext("2d");
  }

  connectedCallback() {
    const shadow = this.shadowRoot || this.attachShadow({ mode: "open" });
    attachBootstrap(shadow);

    shadow.appendChild(this.#canvas.element);
  }

  /**
   * Transforms VCW to pixels
   * @param {import("./types.mjs").VCW} n
   */
  VCW(n) {
    return (n / 100) * this.width;
  }

  /**
   * Transforms VCH to pixels
   *
   * @param {import("./types.mjs").VCH} n
   */
  VCH(n) {
    return (n / 100) * this.height;
  }

  /**
   * Transforms pixels to VCW
   * @param {number} n
   * @returns {import("./types.mjs").VCW}
   */
  PixelsToVCW(n) {
    return (n * 100) / this.width;
  }

  /**
   * Transforms pixels to VCH
   * @param {number} n
   * @returns {import("./types.mjs").VCH}
   */
  PixelsToVCH(n) {
    return (n * 100) / this.height;
  }

  /**
   * @param {CanvasElement} element
   */
  addCanvasElement(element) {
    this.elements.push(element);
    return this;
  }

  clear() {
    this.#ctx.clearRect(0, 0, this.width, this.height);
  }

  render() {
    this.clear();
    for (const element of this.elements) {
      element.render(this.#ctx);
    }
  }
}
