const DEFAULT_API_URL =
  import.meta.env.PROD
    ? "https://angelbirdanalysis-api.vercel.app/api"
    : "http://localhost:5000/api";

const API_BASE_URL = String(
  import.meta.env.VITE_API_URL ||
    DEFAULT_API_URL
).replace(/\/+$/, "");

const ACCESS_TOKEN_KEY =
  "angelbird_access_token";

const REFRESH_TOKEN_KEY =
  "angelbird_refresh_token";

const AUTH_USER_KEY =
  "angelbird_auth_user";

/*
 * Prevent multiple requests from trying to
 * refresh the access token simultaneously.
 */
let refreshPromise = null;

export function getAccessToken() {
  return (
    localStorage.getItem(
      ACCESS_TOKEN_KEY
    ) || ""
  );
}

export function getRefreshToken() {
  return (
    localStorage.getItem(
      REFRESH_TOKEN_KEY
    ) || ""
  );
}

export function getStoredUser() {
  try {
    const value =
      localStorage.getItem(
        AUTH_USER_KEY
      );

    return value
      ? JSON.parse(value)
      : null;
  } catch {
    return null;
  }
}

export function saveAuthSession({
  user,
  session,
} = {}) {
  const accessToken =
    session?.accessToken ||
    session?.access_token ||
    "";

  const refreshToken =
    session?.refreshToken ||
    session?.refresh_token ||
    "";

  if (accessToken) {
    localStorage.setItem(
      ACCESS_TOKEN_KEY,
      accessToken
    );
  }

  if (refreshToken) {
    localStorage.setItem(
      REFRESH_TOKEN_KEY,
      refreshToken
    );
  }

  if (user) {
    localStorage.setItem(
      AUTH_USER_KEY,
      JSON.stringify(user)
    );
  }
}

export function saveStoredUser(
  user
) {
  if (!user) {
    localStorage.removeItem(
      AUTH_USER_KEY
    );

    return;
  }

  localStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify(user)
  );
}

export function clearAuthSession() {
  localStorage.removeItem(
    ACCESS_TOKEN_KEY
  );

  localStorage.removeItem(
    REFRESH_TOKEN_KEY
  );

  localStorage.removeItem(
    AUTH_USER_KEY
  );
}

function normalizePath(path) {
  return String(path || "")
    .trim()
    .replace(/^\/+/, "");
}

function buildUrl(
  path,
  query = {}
) {
  const cleanPath =
    normalizePath(path);

  const url = new URL(
    `${API_BASE_URL}/${cleanPath}`
  );

  Object.entries(
    query || {}
  ).forEach(
    ([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return;
      }

      if (
        Array.isArray(value)
      ) {
        value.forEach(
          (item) => {
            if (
              item === undefined ||
              item === null ||
              item === ""
            ) {
              return;
            }

            url.searchParams.append(
              key,
              String(item)
            );
          }
        );

        return;
      }

      if (
        typeof value ===
        "boolean"
      ) {
        url.searchParams.set(
          key,
          value
            ? "true"
            : "false"
        );

        return;
      }

      url.searchParams.set(
        key,
        String(value)
      );
    }
  );

  return url.toString();
}

async function parseResponse(
  response
) {
  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  const text =
    await response.text();

  return text
    ? {
        message: text,
      }
    : {};
}

function createApiError(
  response,
  payload
) {
  const message =
    payload?.message ||
    payload?.error ||
    payload?.details?.message ||
    `API request failed with status ${response.status}.`;

  const error =
    new Error(message);

  error.name =
    "ApiError";

  error.status =
    response.status;

  error.code =
    payload?.code ||
    payload?.errorCode ||
    null;

  error.details =
    payload?.details ||
    null;

  error.payload =
    payload;

  return error;
}

function createNetworkError(
  originalError
) {
  const error =
    new Error(
      `Unable to connect to the Angelbird API at ${API_BASE_URL}. Confirm that the backend is deployed and running.`
    );

  error.name =
    "NetworkError";

  error.code =
    "NETWORK_ERROR";

  error.cause =
    originalError;

  return error;
}

async function performRefreshToken() {
  const refreshToken =
    getRefreshToken();

  if (!refreshToken) {
    clearAuthSession();

    return null;
  }

  try {
    const response =
      await fetch(
        buildUrl(
          "/auth/refresh"
        ),
        {
          method: "POST",

          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              refreshToken,
            }),
        }
      );

    const payload =
      await parseResponse(
        response
      );

    if (
      !response.ok ||
      !payload?.data?.session
    ) {
      clearAuthSession();

      return null;
    }

    saveAuthSession(
      payload.data
    );

    return (
      payload.data.session
        ?.accessToken ||
      payload.data.session
        ?.access_token ||
      null
    );
  } catch {
    clearAuthSession();

    return null;
  }
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise =
      performRefreshToken()
        .finally(() => {
          refreshPromise =
            null;
        });
  }

  return refreshPromise;
}

function prepareRequestBody(
  body,
  requestHeaders
) {
  if (
    body === undefined ||
    body === null
  ) {
    return undefined;
  }

  if (
    body instanceof FormData
  ) {
    /*
     * Browser automatically adds:
     * multipart/form-data; boundary=...
     *
     * Never set Content-Type manually
     * for FormData.
     */
    delete requestHeaders[
      "Content-Type"
    ];

    delete requestHeaders[
      "content-type"
    ];

    return body;
  }

  if (
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  ) {
    return body;
  }

  if (
    typeof body ===
    "string"
  ) {
    if (
      !requestHeaders[
        "Content-Type"
      ] &&
      !requestHeaders[
        "content-type"
      ]
    ) {
      requestHeaders[
        "Content-Type"
      ] =
        "text/plain;charset=UTF-8";
    }

    return body;
  }

  if (
    !requestHeaders[
      "Content-Type"
    ] &&
    !requestHeaders[
      "content-type"
    ]
  ) {
    requestHeaders[
      "Content-Type"
    ] =
      "application/json";
  }

  return JSON.stringify(
    body
  );
}

export async function apiRequest(
  path,
  options = {}
) {
  const {
    method = "GET",
    query,
    body,
    headers = {},
    auth = true,
    signal,
    retry = true,
    credentials,
    cache,
  } = options;

  const normalizedMethod =
    String(method || "GET")
      .toUpperCase();

  const requestHeaders = {
    Accept:
      "application/json",
    ...headers,
  };

  const token =
    getAccessToken();

  if (
    auth &&
    token &&
    !requestHeaders.Authorization &&
    !requestHeaders.authorization
  ) {
    requestHeaders.Authorization =
      `Bearer ${token}`;
  }

  const requestBody =
    prepareRequestBody(
      body,
      requestHeaders
    );

  let response;

  try {
    response =
      await fetch(
        buildUrl(
          path,
          query
        ),
        {
          method:
            normalizedMethod,

          headers:
            requestHeaders,

          body:
            ["GET", "HEAD"].includes(
              normalizedMethod
            )
              ? undefined
              : requestBody,

          signal,

          /*
           * Current authentication uses
           * localStorage Bearer tokens.
           *
           * "include" also allows cookies
           * if backend uses them later.
           */
          credentials:
            credentials ||
            "include",

          cache:
            cache ||
            "no-store",
        }
      );
  } catch (error) {
    if (
      error?.name ===
      "AbortError"
    ) {
      throw error;
    }

    throw createNetworkError(
      error
    );
  }

  /*
   * Access token expired:
   * use refresh token once, then retry
   * the original request.
   */
  if (
    response.status === 401 &&
    auth &&
    retry
  ) {
    const newAccessToken =
      await refreshAccessToken();

    if (newAccessToken) {
      return apiRequest(
        path,
        {
          ...options,

          retry: false,

          headers: {
            ...headers,

            Authorization:
              `Bearer ${newAccessToken}`,
          },
        }
      );
    }

    clearAuthSession();
  }

  const payload =
    await parseResponse(
      response
    );

  if (!response.ok) {
    throw createApiError(
      response,
      payload
    );
  }

  return payload;
}

export function apiGet(
  path,
  options = {}
) {
  return apiRequest(
    path,
    {
      ...options,
      method: "GET",
    }
  );
}

export function apiPost(
  path,
  body,
  options = {}
) {
  return apiRequest(
    path,
    {
      ...options,
      method: "POST",
      body,
    }
  );
}

export function apiPut(
  path,
  body,
  options = {}
) {
  return apiRequest(
    path,
    {
      ...options,
      method: "PUT",
      body,
    }
  );
}

export function apiPatch(
  path,
  body,
  options = {}
) {
  return apiRequest(
    path,
    {
      ...options,
      method: "PATCH",
      body,
    }
  );
}

export function apiDelete(
  path,
  options = {}
) {
  const {
    body,
    ...rest
  } = options;

  return apiRequest(
    path,
    {
      ...rest,
      method: "DELETE",
      body,
    }
  );
}
export const apiClient = {
  get(path, options = {}) {
    return apiGet(path, options);
  },

  post(path, body, options = {}) {
    return apiPost(path, body, options);
  },

  put(path, body, options = {}) {
    return apiPut(path, body, options);
  },

  patch(path, body, options = {}) {
    return apiPatch(path, body, options);
  },

  delete(path, options = {}) {
    return apiDelete(path, options);
  },
};

export default apiClient;

export {
  API_BASE_URL,
};