import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
const storePath = join(process.cwd(), "data", "dev-users.json");
async function readUsers() {
    try {
        const content = await readFile(storePath, "utf8");
        return JSON.parse(content);
    }
    catch {
        return [];
    }
}
async function writeUsers(users) {
    await mkdir(dirname(storePath), { recursive: true });
    await writeFile(storePath, JSON.stringify(users, null, 2));
}
export function canUseDevAuthFallback(error) {
    if (process.env.NODE_ENV === "production") {
        return false;
    }
    return (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        ["28P01", "3D000", "42P01", "ECONNREFUSED"].includes(String(error.code)));
}
export async function createDevUser(input) {
    const users = await readUsers();
    const email = input.email.toLowerCase();
    if (users.some((user) => user.email === email)) {
        return null;
    }
    const user = {
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
export async function findDevUserByCredentials(input) {
    const users = await readUsers();
    const user = users.find((candidate) => candidate.email === input.email.toLowerCase());
    if (!user || user.disabled_at || !(await bcrypt.compare(input.password, user.password_hash))) {
        return null;
    }
    return user;
}
export async function findDevUserById(id) {
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
export async function setDevUserDisabled(userId, disabled) {
    const users = await readUsers();
    const user = users.find((candidate) => candidate.id === userId);
    if (!user) {
        return null;
    }
    user.disabled_at = disabled ? new Date().toISOString() : null;
    await writeUsers(users);
    return toPublicUser(user);
}
export async function deleteDevUser(userId) {
    const users = await readUsers();
    const user = users.find((candidate) => candidate.id === userId);
    if (!user) {
        return false;
    }
    await writeUsers(users.filter((candidate) => candidate.id !== userId));
    return true;
}
export async function updateDevUserProfile(userId, input) {
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
export async function updateDevUserPassword(userId, newPassword) {
    const users = await readUsers();
    const user = users.find((candidate) => candidate.id === userId);
    if (!user) {
        return null;
    }
    user.password_hash = await bcrypt.hash(newPassword, 12);
    await writeUsers(users);
    return toPublicUser(user);
}
export function toPublicUser(user) {
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
