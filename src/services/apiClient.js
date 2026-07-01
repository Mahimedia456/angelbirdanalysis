const API_BASE_URL = String(
  import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api"
).replace(/\/+$/, "");

const ACCESS_TOKEN_KEY =
  "angelbird_access_token";

const REFRESH_TOKEN_KEY =
  "angelbird_refresh_token";

const AUTH_USER_KEY =
  "angelbird_auth_user";

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
}) {
  if (session?.accessToken) {
    localStorage.setItem(
      ACCESS_TOKEN_KEY,
      session.accessToken
    );
  }

  if (session?.refreshToken) {
    localStorage.setItem(
      REFRESH_TOKEN_KEY,
      session.refreshToken
    );
  }

  if (user) {
    localStorage.setItem(
      AUTH_USER_KEY,
      JSON.stringify(user)
    );
  }
}

export function saveStoredUser(user) {
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

function buildUrl(
  path,
  query = {}
) {
  const cleanPath = String(
    path || ""
  ).replace(/^\/+/, "");

  const url = new URL(
    `${API_BASE_URL}/${cleanPath}`
  );

  Object.entries(query).forEach(
    ([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => {
          url.searchParams.append(
            key,
            String(item)
          );
        });

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
    return response.json();
  }

  const text =
    await response.text();

  return text
    ? { message: text }
    : {};
}

async function refreshAccessToken() {
  const refreshToken =
    getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(
      buildUrl("/auth/refresh"),
      {
        method: "POST",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          refreshToken,
        }),
      }
    );

    const payload =
      await parseResponse(response);

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

    return payload.data.session
      .accessToken;
  } catch {
    clearAuthSession();
    return null;
  }
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
  } = options;

  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  const token =
    getAccessToken();

  if (auth && token) {
    requestHeaders.Authorization =
      `Bearer ${token}`;
  }

  let requestBody = body;

  if (
    body !== undefined &&
    body !== null &&
    !(body instanceof FormData)
  ) {
    requestHeaders[
      "Content-Type"
    ] = "application/json";

    requestBody =
      JSON.stringify(body);
  }

  let response;

  try {
    response = await fetch(
      buildUrl(path, query),
      {
        method,
        headers:
          requestHeaders,
        body: requestBody,
        signal,
      }
    );
  } catch (error) {
    if (
      error.name ===
      "AbortError"
    ) {
      throw error;
    }

    const networkError =
      new Error(
        "Unable to connect to the Angelbird API. Confirm that the backend is running."
      );

    networkError.code =
      "NETWORK_ERROR";

    throw networkError;
  }

  if (
    response.status === 401 &&
    auth &&
    retry
  ) {
    const newAccessToken =
      await refreshAccessToken();

    if (newAccessToken) {
      return apiRequest(path, {
        ...options,
        retry: false,

        headers: {
          ...headers,

          Authorization:
            `Bearer ${newAccessToken}`,
        },
      });
    }

    clearAuthSession();
  }

  const payload =
    await parseResponse(response);

  if (!response.ok) {
    const error = new Error(
      payload?.message ||
        `API request failed with status ${response.status}.`
    );

    error.status =
      response.status;

    error.code =
      payload?.code || null;

    error.details =
      payload?.details || null;

    throw error;
  }

  return payload;
}

export function apiGet(
  path,
  options = {}
) {
  return apiRequest(path, {
    ...options,
    method: "GET",
  });
}

export function apiPost(
  path,
  body,
  options = {}
) {
  return apiRequest(path, {
    ...options,
    method: "POST",
    body,
  });
}

export function apiPatch(
  path,
  body,
  options = {}
) {
  return apiRequest(path, {
    ...options,
    method: "PATCH",
    body,
  });
}

export function apiDelete(
  path,
  options = {}
) {
  return apiRequest(path, {
    ...options,
    method: "DELETE",
  });
}

export { API_BASE_URL };