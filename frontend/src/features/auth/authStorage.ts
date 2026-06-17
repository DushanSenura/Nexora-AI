import type { User } from "../../types";

const TOKEN_KEY = "nexora_token";
const USER_KEY = "nexora_user";

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: User["role"];
    created_at?: string;
    createdAt?: string;
  };
};

export function normalizeUser(user: AuthResponse["user"]): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt ?? user.created_at ?? new Date().toISOString(),
  };
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const value = localStorage.getItem(USER_KEY);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as User;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function storeAuth(response: AuthResponse) {
  const user = normalizeUser(response.user);
  localStorage.setItem(TOKEN_KEY, response.token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

