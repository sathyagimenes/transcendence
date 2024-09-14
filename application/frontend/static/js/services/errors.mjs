export class RequestFailedError extends Error {
  /** @type {number} */
  status;
  /** @type {Response} */
  response;
  /** @type {Record<string, any>} */
  data;

  /**
   * @param {Response} response
   * @param {Record<string, any>} data
   */
  constructor(response, data) {
    super();
    this.response = response;
    this.status = response.status;
    this.data = data;
  }
}

export class UnprocessableEntityError extends RequestFailedError {
  /**
   * @param {Response} response
   * @param {Record<string, any>} data
   */
  constructor(response, data) {
    super(response, data);
  }
}
