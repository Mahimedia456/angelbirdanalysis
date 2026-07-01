import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
} from "../services/authApi";

import {
  clearAuthSession,
  getAccessToken,
  getStoredUser,
  saveStoredUser,
} from "../services/apiClient";

const AuthContext =
  createContext(null);

export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(() =>
      getStoredUser()
    );

  const [loading, setLoading] =
    useState(true);

  const [authError, setAuthError] =
    useState("");

  const checkSession =
    useCallback(async () => {
      const token =
        getAccessToken();

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setAuthError("");

      try {
        const currentUser =
          await fetchCurrentUser();

        setUser(currentUser);
        saveStoredUser(
          currentUser
        );
      } catch (error) {
        clearAuthSession();
        setUser(null);

        setAuthError(
          error.message ||
            "Your session has expired."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  async function signIn(
    credentials
  ) {
    setAuthError("");

    const result =
      await loginUser(
        credentials
      );

    setUser(result.user);

    return result.user;
  }

  async function signOut() {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      setAuthError("");
    }
  }

  function hasRole(
    ...roles
  ) {
    return Boolean(
      user?.role &&
        roles.includes(user.role)
    );
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,

      isAuthenticated:
        Boolean(user),

      signIn,
      signOut,
      checkSession,
      hasRole,
    }),
    [
      user,
      loading,
      authError,
      checkSession,
    ]
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}