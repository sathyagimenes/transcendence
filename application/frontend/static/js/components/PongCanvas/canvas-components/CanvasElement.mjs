export class CanvasElement {
  /** @type {number} */
  __width;
  /** @type {number} */
  __height;

  /** @type {number} */
  __translate_w = 0;
  /** @type {number} */
  __translate_h = 0;

  /** @type {import("../types.mjs").VCW} */
  #x;
  /** @type {import("../types.mjs").VCH} */
  #y;

  // These getters are being affected by what was configured in the translate function
  get __translated_x() {
    return this.#x + (this.__translate_w / 100) * this.__width;
  }
  get __translated_y() {
    return this.#y + (this.__translate_h / 100) * this.__height;
  }

  /**
   * @param {number} w
   * @param {number} h
   */
  size(w, h) {
    this.__width = w;
    this.__height = h;
    return this;
  }

  /**
   * @param {import("../types.mjs").VCW} x
   * @param {import("../types.mjs").VCH} y
   */
  pos(x, y) {
    this.setX(x);
    this.setY(y);
    return this;
  }

  /**
   * @param {number} x
   */
  setX(x) {
    this.#x = x;
    return this;
  }

  /**
   * @param {number} y
   */
  setY(y) {
    this.#y = y;
    return this;
  }

  /**
   * This function will move the element accordingly to it's own width and height
   *
   * After calling it the change will be maintained until removed manually by calling `translate(0, 0)`
   *
   * @param {number} translate_w - number between -100 and 100 to offset
   * @param {number} translate_h - number between -100 and 100 to offset
   */
  translate(translate_w, translate_h) {
    this.__translate_w = translate_w;
    this.__translate_h = translate_h;

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
