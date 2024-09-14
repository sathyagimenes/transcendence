import { router } from "../index.mjs";
import { session } from "../state/session.mjs";
import { RequestFailedError, UnprocessableEntityError } from "./errors.mjs";

export const HTTPStatus = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
});

/**
 * @param {string} path
 * @param {Exclude<Parameters<typeof fetch>[0], URL>} options
 */
export async function http(path, options) {
  const h = new Headers();

  if (options.headers) {
    for (const key in options.headers) {
      h.append(key, options.headers[key]);
    }
  }

  const response = await fetch(path, {
    ...options,
    headers: h,
    credentials: "same-origin",
  });

  if (response.status >= HTTPStatus.BAD_REQUEST) {
    const { data } = await response.json();

    if (
      router.current.path !== "/login" &&
      response.status === HTTPStatus.UNAUTHORIZED
    ) {
      router.navigate("/login");
      session.player = null;
    }

    if (response.status === HTTPStatus.UNPROCESSABLE_ENTITY) {
      throw new UnprocessableEntityError(response, data);
    }
    throw new RequestFailedError(response, data);
  }

  if (response.status === HTTPStatus.NO_CONTENT) {
    return { data: undefined, response };
  }

  try {
    const data = await response.json();
    return {
      data,
      response,
    };
  } catch (e) {
    console.error(e);
    return { data: { data: { message: "Error parsing JSON" } }, response };
  }
}

/**
 * @param {string} path
 * @param {Exclude<Parameters<typeof fetch>[0], URL>} options
 */
export async function GET(path, options) {
  return http(path, {
    ...options,
    method: "GET",
  });
}

/**
 * @param {string} path
 * @param {object | FormData} payload
 * @param {Exclude<Parameters<typeof fetch>[0], URL>} options
 */
export async function POST(path, payload, options) {
  return http(path, {
    ...options,
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
    method: "POST",
  });
}

/**
 * @param {string} path
 * @param {Exclude<Parameters<typeof fetch>[0], URL>} options
 */
export async function PUT(path, payload, options) {
  return http(path, {
    ...options,
    body: JSON.stringify(payload),
    method: "PUT",
  });
}

/**
 * @param {string} path
 * @param {Exclude<Parameters<typeof fetch>[0], URL>} options
 */
export async function DELETE(path, options) {
  return http(path, {
    ...options,
    method: "DELETE",
  });
}
