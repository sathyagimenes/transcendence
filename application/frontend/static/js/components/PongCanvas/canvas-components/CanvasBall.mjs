import { CanvasElement } from "./CanvasElement.mjs";

export class CanvasBall extends CanvasElement {
  __width = 10;
  __height = 10;
  __color = "white";

  get __radius() {
    return this.__width;
  }


  /**
   * @param {number} width
   * @param {number} height
   */
  constructor(width, height) {
    super();
    this.__width = width;
    this.__height = height;
  }

  /**
   * @param {string} color
   */
  color(color) {
    this.__color = color;
  }
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @returns {this}
   */
  render(ctx) {
    let previousFillStyle = ctx.fillStyle;

    ctx.beginPath();
    ctx.arc(
      this.__translated_x,
      this.__translated_y,
      this.__radius,
      0,
      2 * Math.PI,
    );

    ctx.fillStyle = this.__color;
    ctx.fill();
    ctx.strokeStyle = this.__color;
    ctx.stroke();

    ctx.fillStyle = previousFillStyle;
    return this;
  }
}
