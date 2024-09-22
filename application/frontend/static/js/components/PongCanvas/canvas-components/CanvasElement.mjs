/**
 * @import { Size, Position } from "../../../types.mjs";
 */

export class CanvasElement {
  /** @type {Position} */
  pos;

  /** @type {Size} */
  size;
  
  /**
   * @param {Position} pos
   * @param {Size} size
   */
  constructor(pos, size) {
    this.pos = pos;
    this.size = size;
  }

  /**
   * @param {Size} size
   */
  setSize(size) {
    this.size = size;
    return this;
  }

  /**
   * @param {Position} pos
   */
  setPos(pos) {
    this.pos = pos;
    return this;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @abstract
   * @returns {this}
   */
  render(ctx) {
    throw new Error("must be implemented by subclass!");
  }
}
