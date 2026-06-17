import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

type DevUser = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: "user" | "admin";
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
    role: "user",
    created_at: new Date().toISOString(),
  };

  users.push(user);
  await writeUsers(users);
  return user;
}

export async function findDevUserByCredentials(input: { email: string; password: string }) {
  const users = await readUsers();
  const user = users.find((candidate) => candidate.email === input.email.toLowerCase());

  if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
    return null;
  }

  return user;
}

export async function findDevUserById(id: string) {
  const users = await readUsers();
  return users.find((candidate) => candidate.id === id) ?? null;
}

export function toPublicUser(user: DevUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
  };
}
