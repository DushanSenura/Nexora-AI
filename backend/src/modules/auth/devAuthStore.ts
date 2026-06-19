import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

type DevUser = {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  password_hash: string;
  role: "user" | "admin";
  disabled_at?: string | null;
  created_at: string;
};

const storePath = join(process.cwd(), "data", "dev-users.json");

async function readUsers(): Promise<DevUser[]> {
  try {
    const content = await readFile(storePath, "utf8");
    return JSON.parse(content) as DevUser[];
  } catch {
    return [];
  }
}

async function writeUsers(users: DevUser[]) {
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(users, null, 2));
}

export function canUseDevAuthFallback(error: unknown) {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    ["28P01", "3D000", "42P01", "ECONNREFUSED"].includes(String(error.code))
  );
}

export async function createDevUser(input: { name: string; email: string; password: string }) {
  const users = await readUsers();
  const email = input.email.toLowerCase();

  if (users.some((user) => user.email === email)) {
    return null;
  }

  const user: DevUser = {
    id: randomUUID(),
    name: input.name,
    email,
    password_hash: await bcrypt.hash(input.password, 12),
    role: email === "admin@nexora.local" ? "admin" : "user",
    created_at: new Date().toISOString(),
  };

  users.push(user);
  await writeUsers(users);
  return user;
}

export async function findDevUserByCredentials(input: { email: string; password: string }) {
  const users = await readUsers();
  const user = users.find((candidate) => candidate.email === input.email.toLowerCase());

  if (!user || user.disabled_at || !(await bcrypt.compare(input.password, user.password_hash))) {
    return null;
  }

  return user;
}

export async function findDevUserById(id: string) {
  const users = await readUsers();
  return users.find((candidate) => candidate.id === id) ?? null;
}

export async function listDevUsers(search = "") {
  const users = await readUsers();
  const value = search.toLowerCase();
  return users
    .filter((user) => !value || user.name.toLowerCase().includes(value) || user.email.toLowerCase().includes(value))
    .map(toPublicUser)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function setDevUserDisabled(userId: string, disabled: boolean) {
  const users = await readUsers();
  const user = users.find((candidate) => candidate.id === userId);
  if (!user) {
    return null;
  }
  user.disabled_at = disabled ? new Date().toISOString() : null;
  await writeUsers(users);
  return toPublicUser(user);
}

export async function deleteDevUser(userId: string) {
  const users = await readUsers();
  const user = users.find((candidate) => candidate.id === userId);
  if (!user) {
    return false;
  }
  await writeUsers(users.filter((candidate) => candidate.id !== userId));
  return true;
}

export async function updateDevUserProfile(userId: string, input: { name?: string; avatar_url?: string | null }) {
  const users = await readUsers();
  const user = users.find((candidate) => candidate.id === userId);
  if (!user) {
    return null;
  }

  if (input.name) {
    user.name = input.name;
  }
  if ("avatar_url" in input) {
    user.avatar_url = input.avatar_url;
  }
  await writeUsers(users);
  return toPublicUser(user);
}

export async function updateDevUserPassword(userId: string, newPassword: string) {
  const users = await readUsers();
  const user = users.find((candidate) => candidate.id === userId);
  if (!user) {
    return null;
  }

  user.password_hash = await bcrypt.hash(newPassword, 12);
  await writeUsers(users);
  return toPublicUser(user);
}

export function toPublicUser(user: DevUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar_url: user.avatar_url ?? null,
    role: user.role,
    disabled_at: user.disabled_at ?? null,
    created_at: user.created_at,
  };
}
