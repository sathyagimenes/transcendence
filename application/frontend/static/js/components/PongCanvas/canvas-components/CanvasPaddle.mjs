import { CanvasElement } from "./CanvasElement.mjs";

export class CanvasPaddle extends CanvasElement {
  __width = 10;
  __height = 60;
  __color = "white";

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
    ctx.fillStyle = this.__color;
    ctx.fillRect(
      this.__translated_x,
      this.__translated_y,
      this.__width,
      this.__height,
    );
    ctx.fillStyle = previousFillStyle;
    return this;
  }
}
