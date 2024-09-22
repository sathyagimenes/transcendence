import { CanvasElement } from "./CanvasElement.mjs";

/**
 * @import { Position, Size } from "../../../types.mjs";
 */
export class CanvasPaddle extends CanvasElement {

  /**
   * @param {Position} pos
   * @param {Size} size
   */
  constructor(pos, size) {
    super(pos, size);
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @returns {this}
   */
  render(ctx) {
    ctx.fillStyle = "white";
    ctx.fillRect(
      this.pos.x,
      this.pos.y,
      this.size.width,
      this.size.height,
    );
    return this;
  }
}
