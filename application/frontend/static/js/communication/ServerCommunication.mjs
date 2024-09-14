import { EventBus } from "../utils/EventBus.mjs";

export class ServerCommunication extends EventBus {
  /** @type {string} */
  path;
  /** @type {WebSocket | undefined} */
  socket;

  /**
   * @param {string} path
   * @param {boolean} immediate
   */
  constructor(path = "", immediate = false) {
    super();
    this.path = path;
    if (immediate) {
      this.connect();
    }
  }

  /**
   * @param {string} path
   */
  setPath(path) {
    this.path = path;
    return this;
  }

  isConnecting() {
    return this.socket?.readyState === WebSocket.CONNECTING;
  }

  isOpen() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  isClosing() {
    return this.socket?.readyState === WebSocket.CLOSING;
  }

  isClosed() {
    if (!this.socket) return true;
    return this.socket.readyState === WebSocket.CLOSED;
  }

  /**
   * @param {() => void} onConnect
   */
  connect(onConnect) {
    this.socket = new WebSocket(this.path);

    this.socket.onopen = onConnect;

    this.socket.onmessage = (event) => {
      let response;
      try {
        response = JSON.parse(event.data);
      } catch (err) {}

      this.fireEvent(response.event, response.data);
    };
    return this;
  }

  /**
   * @param {undefined | () => void} onClose
   */
  disconnect(onClose) {
    if (this.isClosed()) {
      onClose?.();
      this.clearEvents();
      return this;
    }
    this.socket.onclose = onClose;
    this.socket.close();
    this.socket.onmessage = () => {};
    this.events.clear();
    this.clearEvents();
    return this;
  }

  /**
   * @param {string} command
   * @param {object} payload
   * @param {undefined | (Record<string, any>) => void} onError
   */
  send(command, payload) {
    if (!this.isOpen()) return this;
    const timestamp = new Date().toISOString();

    this.socket.send(
      JSON.stringify({
        command,
        payload,
        timestamp,
      }),
    );

    return this;
  }
}
