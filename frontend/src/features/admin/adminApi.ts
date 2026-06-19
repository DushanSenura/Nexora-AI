import { api } from "../../services/api";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  disabled_at?: string | null;
  created_at: string;
};

export type AdminOverview = {
  users: { count: number; disabled: number };
  chats: { count: number; messages: number };
  documents: { count: number; ready: number; failed: number };
  agents: { count: number; research: number; coding: number; image: number };
  usage: { total: number };
};

export type UsageLog = {
  id: string;
  action: string;
  tokens_used: number;
  created_at: string;
  user_email: string;
};

export async function getAdminOverview() {
  const response = await api.get<AdminOverview>("/analytics/overview");
  return response.data;
}

export async function getUsageLogs() {
  const response = await api.get<UsageLog[]>("/analytics/usage-logs");
  return response.data;
}

export async function listAdminUsers(search = "") {
  const response = await api.get<AdminUser[]>("/users", { params: search ? { search } : undefined });
  return response.data;
}

export async function setUserDisabled(input: { userId: string; disabled: boolean }) {
  const response = await api.patch<AdminUser>(`/users/${input.userId}/disabled`, {
    disabled: input.disabled,
  });
  return response.data;
}

export async function deleteAdminUser(userId: string) {
  await api.delete(`/users/${userId}`);
}

