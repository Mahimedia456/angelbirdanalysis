import {
  apiGet,
  apiPost,
  clearAuthSession,
  saveAuthSession,
} from "./apiClient";

export async function loginUser({
  email,
  password,
}) {
  const response =
    await apiPost(
      "/auth/login",
      {
        email,
        password,
      },
      {
        auth: false,
      }
    );

  saveAuthSession(
    response.data
  );

  return response.data;
}

export async function fetchCurrentUser() {
  const response =
    await apiGet("/auth/me");

  return response.data.user;
}

export async function logoutUser() {
  try {
    await apiPost(
      "/auth/logout",
      {}
    );
  } finally {
    clearAuthSession();
  }
}