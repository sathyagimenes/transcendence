import { CanvasElement } from "./CanvasElement.mjs";

/**
 * @import { Position, Size } from "../../../types.mjs";
 */
export class CanvasBall extends CanvasElement {

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
    // TODO: o servidor deveria enviar o diâmetro da bola, não o raio
    const radius = this.size.width;
    ctx.beginPath();
    ctx.arc(
      this.pos.x,
      this.pos.y,
      radius,
      0,
      2 * Math.PI,
    );
    ctx.fillStyle = "white";
    ctx.strokeStyle = ctx.fillStyle;
    ctx.fill();
    ctx.stroke();
    return this;
  }
}
