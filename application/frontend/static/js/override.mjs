/**
 * Override the window.history object to create onpushstate event
 */
(function (history) {
  const pushState = history.pushState;
  history.pushState = function (state) {
    const result = pushState.apply(history, arguments);

    history.onpushstate?.({ state: state });
    const event = new CustomEvent("pushstate", { state: state });
    window.dispatchEvent(event);

    return result;
  };
})(window.history);
