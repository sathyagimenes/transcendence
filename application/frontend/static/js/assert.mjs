/**
 * @param {boolean} assertion
 * @param {string} message
 */
export function assert(assertion, message) {
  if (assertion) {
    throw new Error(message);
  }
}
