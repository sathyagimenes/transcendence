import { Component } from "../components/component.mjs";
import { EventBus } from "../utils/EventBus.mjs";

/** @typedef {Record<string, string | undefined>} Params */
/** @typedef {(props: { params: Params }) => Component} Page */

export class Route {
  /** @type {string} */
  path;
  /** @type {Page} */
  page;

  /**
   * @param {string} path
   * @param {Page} page
   */
  constructor(path, page) {
    this.path = path;
    this.page = page;
  }
}

export class Router extends EventBus {
  root_id = "app";
  /** @type {Route[]} */
  routes;
  /** @type {import("../components/component.mjs").FunctionalComponent} */
  NotFoundPage;

  /**
   * @param {Route[]} routes
   * @param {{ NotFoundPage: import("../components/component.mjs").FunctionalComponent }} fallback
   */
  constructor(routes, fallback) {
    super();
    this.routes = [...routes, new Route("/not-found", fallback.NotFoundPage)];
    this.NotFoundPage = fallback.NotFoundPage;

    window.addEventListener("popstate", () => this.render());
  }

  get current() {
    const pathname = window.location.pathname;
    const removeSlashes = (str) => str.replace(/\//g, "");

    const matchedRoute = this.routes.find((route) => {
      const pathnameWithoutSlashes = removeSlashes(pathname);
      const routePathWithoutSlashes = removeSlashes(route.path);
      return pathnameWithoutSlashes === routePathWithoutSlashes;
    });

    return matchedRoute;
  }

  get root() {
    return document.getElementById(this.root_id);
  }

  /**
   * @param {string} path
   * @param {any} state
   */
  navigate(path, state) {
    if (window.location.pathname !== path) {
      history.pushState(state, "", path);
    }
  }

  render() {
    if (!this.root) return;
    const params = this.#getUrlParams(window.location.search);

    this.fireEvent("onBeforePageChange", { route: this.current, params });
    this.removeEventListenersFor("onBeforePageChange");

    if (!this.current) {
      this.root.innerHTML = "";
      this.root.appendChild(this.NotFoundPage({ params }).element);
      return;
    }
    this.root.innerHTML = "";
    this.root.appendChild(this.current.page({ params }).element);
    this.fireEvent("onAfterPageChange", { route: this.current, params });
    this.removeEventListenersFor("onAfterPageChange");
  }

  /**
   * @param {string} string
   * @returns {Params}
   */
  #getUrlParams(string) {
    const params = {};

    for (const [key, value] of new URLSearchParams(string).entries()) {
      params[key] = value;
    }

    return params;
  }
}
