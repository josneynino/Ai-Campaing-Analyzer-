/* eslint-disable react-refresh/only-export-components */

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "../lib/api";

type User = {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, phone: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (!storedToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    setToken(storedToken);

    api
      .get("/auth/me", {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
      .then((res) => {
        if (res.data.user) {
          setUser({ 
            id: res.data.user.id, 
            email: res.data.user.email,
            firstName: res.data.user.firstName,
            lastName: res.data.user.lastName
          });
        }
      })
      .catch(() => {
        localStorage.removeItem("auth_token");
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAuthSuccess = (receivedUser: User, receivedToken: string) => {
    setUser(receivedUser);
    setToken(receivedToken);
    localStorage.setItem("auth_token", receivedToken);
  };

  const loginFn = useCallback(async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    handleAuthSuccess(res.data.user, res.data.token);
  }, []);

  const registerFn = useCallback(async (email: string, password: string, firstName: string, lastName: string, phone: string) => {
    const res = await api.post("/auth/register", { email, password, firstName, lastName, phone });
    handleAuthSuccess(res.data.user, res.data.token);
  }, []);

  const logoutFn = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    login: loginFn,
    register: registerFn,
    logout: logoutFn,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

