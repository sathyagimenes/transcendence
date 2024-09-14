export class EventBus {
  /** @type {Map<string, Set<(data: Record<string, any>) => void>} */
  events = new Map();

  /**
   * @param {string} event
   * @param {data: Record<string, any>} callback
   */
  fireEvent(event, data) {
    this.events.forEach((listeners, key) => {
      if (key === event) {
        listeners.forEach((listener) => listener(data));
      }
    });
  }

  /**
   * @param {string} event
   * @param {(data: Record<string, any>) => void} callback
   * @returns {() => void} clear listener function
   */
  addEventListener(event, callback) {
    let listeners = this.events.get(event);
    if (!listeners) {
      listeners = new Set();
      this.events.set(event, listeners);
    }
    listeners.add(callback);
    return () => void this.removeEventListener(event, callback);
  }

  /**
   * @param {string} event
   * @param {(data: Record<string, any>) => void} callback
   */
  removeEventListener(event, callback) {
    const listeners = this.events.get(event);
    if (!listeners) return this;
    listeners.delete(callback);
    return this;
  }

  /**
   * Remove all event listeners attached to the specified event
   *
   * @param {string} event
   */
  removeEventListenersFor(event) {
    this.events.delete(event);
  }

  /**
   * Remove all attached events
   */
  clearEvents() {
    this.events.clear();
  }
}
