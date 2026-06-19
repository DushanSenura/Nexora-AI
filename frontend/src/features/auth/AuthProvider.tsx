import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import { api } from "../../services/api";
import type { User } from "../../types";
import {
  clearAuth,
  getStoredToken,
  getStoredUser,
  normalizeUser,
  storeUser,
  storeAuth,
  type AuthResponse,
} from "./authStorage";

type LoginInput = {
  email: string;
  password: string;
};

type RegisterInput = LoginInput & {
  name: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  setCurrentUser: (user: AuthResponse["user"]) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      async login(input) {
        const response = await api.post<AuthResponse>("/auth/login", input);
        const nextUser = storeAuth(response.data);
        setUser(nextUser);
        setToken(response.data.token);
      },
      async register(input) {
        const response = await api.post<AuthResponse>("/auth/register", input);
        const nextUser = storeAuth(response.data);
        setUser(nextUser);
        setToken(response.data.token);
      },
      logout() {
        clearAuth();
        setUser(null);
        setToken(null);
      },
      setCurrentUser(nextUser) {
        const normalizedUser = normalizeUser(nextUser);
        storeUser(normalizedUser);
        setUser(normalizedUser);
      },
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
