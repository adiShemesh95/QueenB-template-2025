import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../api/authApi";

const AUTH_CHANNEL_NAME = "auth";
const AUTH_CHANGED = "AUTH_CHANGED";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshMeRef = useRef(null);
  const authChannelRef = useRef(null);

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

  refreshMeRef.current = refreshMe;

  const notifyAuthChanged = () => {
    authChannelRef.current?.postMessage({ type: AUTH_CHANGED });
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

  // Cross-tab auth sync: BroadcastChannel + focus revalidation fallback.
  useEffect(() => {
    const onFocus = () => {
      void refreshMeRef.current?.();
    };

    window.addEventListener("focus", onFocus);

    let channel = null;
    const onMessage = (event) => {
      if (event.data?.type === AUTH_CHANGED) {
        void refreshMeRef.current?.();
      }
    };

    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
      authChannelRef.current = channel;
      channel.addEventListener("message", onMessage);
    }

    return () => {
      window.removeEventListener("focus", onFocus);
      if (channel) {
        channel.removeEventListener("message", onMessage);
        channel.close();
      }
      authChannelRef.current = null;
    };
  }, []);

  // Register/login set the httpOnly cookie on the server; keep client user state in sync.
  const register = async (payload) => {
    const data = await registerUser(payload);
    setUser(data.user);
    notifyAuthChanged();
    return data;
  };

  const login = async (payload) => {
    const data = await loginUser(payload);
    setUser(data.user);
    notifyAuthChanged();
    return data;
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    notifyAuthChanged();
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
