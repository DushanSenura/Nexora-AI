import { api } from "../../services/api";
import type { AuthResponse } from "../auth/authStorage";

export type AppPreferences = {
  defaultModel: string;
  responseStyle: "balanced" | "concise" | "detailed";
  saveChatHistory: boolean;
  allowSearchHistory: boolean;
  allowDocumentRetention: boolean;
};

const PREFERENCES_KEY = "nexora_preferences";

export const defaultPreferences: AppPreferences = {
  defaultModel: "llama3.2",
  responseStyle: "balanced",
  saveChatHistory: true,
  allowSearchHistory: true,
  allowDocumentRetention: true,
};

export function getPreferences() {
  const value = localStorage.getItem(PREFERENCES_KEY);
  if (!value) {
    return defaultPreferences;
  }

  try {
    return { ...defaultPreferences, ...JSON.parse(value) } as AppPreferences;
  } catch {
    return defaultPreferences;
  }
}

export function savePreferences(preferences: AppPreferences) {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export async function updateProfile(input: { name: string }) {
  const response = await api.patch<AuthResponse["user"]>("/users/me", input);
  return response.data;
}

export async function updatePassword(input: { currentPassword: string; newPassword: string }) {
  const response = await api.patch<{ message: string }>("/users/me/password", input);
  return response.data;
}

export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append("avatar", file);
  const response = await api.post<AuthResponse["user"]>("/users/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function deleteAccount() {
  await api.delete("/users/me");
}

