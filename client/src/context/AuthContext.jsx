import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = async () => {
    try {
      const data = await getCurrentUser();
      const nextUser = data?.user ?? null;
      setUser(nextUser);
      return nextUser;
    } catch {
      setUser(null);
      return null;
    }
  };

  // On load, restore session from the cookie via GET /api/users/me.
  useEffect(() => {
    // Ignore late responses if this provider unmounts during the request.
    let cancelled = false;

    (async () => {
      try {
        const data = await getCurrentUser();
        if (!cancelled) {
          setUser(data?.user ?? null);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Register/login set the httpOnly cookie on the server; keep client user state in sync.
  const register = async (payload) => {
    const data = await registerUser(payload);
    setUser(data.user);
    return data;
  };

  const login = async (payload) => {
    const data = await loginUser(payload);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    refreshMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
