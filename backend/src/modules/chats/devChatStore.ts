import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";

export type DevChat = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type DevMessage = {
  id: string;
  chat_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
  created_at: string;
};

type DevChatStore = {
  chats: DevChat[];
  messages: DevMessage[];
};

const storePath = join(process.cwd(), "data", "dev-chats.json");

async function readStore(): Promise<DevChatStore> {
  try {
    const content = await readFile(storePath, "utf8");
    return JSON.parse(content) as DevChatStore;
  } catch {
    return { chats: [], messages: [] };
  }
}

async function writeStore(store: DevChatStore) {
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2));
}

function generateDevChatTitle(content: string) {
  const compact = content.replace(/\s+/g, " ").trim();
  if (!compact) {
    return "New chat";
  }

  const withoutTrailingPunctuation = compact.replace(/[.!?]+$/, "");
  return withoutTrailingPunctuation.length > 48
    ? `${withoutTrailingPunctuation.slice(0, 45).trim()}...`
    : withoutTrailingPunctuation;
}

export async function listDevChats(userId: string) {
  const store = await readStore();
  return store.chats
    .filter((chat) => chat.user_id === userId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getDevChat(userId: string, chatId: string) {
  const store = await readStore();
  return store.chats.find((chat) => chat.user_id === userId && chat.id === chatId) ?? null;
}

export async function createDevChat(userId: string, title = "New chat") {
  const store = await readStore();
  const now = new Date().toISOString();
  const chat: DevChat = {
    id: randomUUID(),
    user_id: userId,
    title,
    created_at: now,
    updated_at: now,
  };

  store.chats.push(chat);
  await writeStore(store);
  return chat;
}

export async function renameDevChat(userId: string, chatId: string, title: string) {
  const store = await readStore();
  const chat = store.chats.find((candidate) => candidate.user_id === userId && candidate.id === chatId);
  if (!chat) {
    return null;
  }

  chat.title = title;
  chat.updated_at = new Date().toISOString();
  await writeStore(store);
  return chat;
}

export async function deleteDevChat(userId: string, chatId: string) {
  const store = await readStore();
  const chat = store.chats.find((candidate) => candidate.user_id === userId && candidate.id === chatId);
  if (!chat) {
    return false;
  }

  store.chats = store.chats.filter((candidate) => candidate.id !== chatId);
  store.messages = store.messages.filter((message) => message.chat_id !== chatId);
  await writeStore(store);
  return true;
}

export async function clearDevMessages(userId: string, chatId: string) {
  const store = await readStore();
  const chat = store.chats.find((candidate) => candidate.user_id === userId && candidate.id === chatId);
  if (!chat) {
    return null;
  }

  store.messages = store.messages.filter((message) => message.chat_id !== chatId);
  chat.title = "New chat";
  chat.updated_at = new Date().toISOString();
  await writeStore(store);
  return chat;
}

export async function listDevMessages(userId: string, chatId: string) {
  const store = await readStore();
  const chat = store.chats.find((candidate) => candidate.user_id === userId && candidate.id === chatId);
  if (!chat) {
    return null;
  }

  return store.messages
    .filter((message) => message.chat_id === chatId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function appendDevMessagePair(input: {
  userId: string;
  chatId: string;
  userContent: string;
  assistantContent: string;
  model: string;
}) {
  const store = await readStore();
  const chat = store.chats.find((candidate) => candidate.user_id === input.userId && candidate.id === input.chatId);
  if (!chat) {
    return null;
  }

  const now = new Date().toISOString();
  const userMessage: DevMessage = {
    id: randomUUID(),
    chat_id: input.chatId,
    role: "user",
    content: input.userContent,
    model: input.model,
    created_at: now,
  };
  const assistantMessage: DevMessage = {
    id: randomUUID(),
    chat_id: input.chatId,
    role: "assistant",
    content: input.assistantContent,
    model: input.model,
    created_at: new Date(Date.now() + 1).toISOString(),
  };

  chat.updated_at = assistantMessage.created_at;
  if (chat.title === "New chat") {
    chat.title = generateDevChatTitle(input.userContent);
  }

  store.messages.push(userMessage, assistantMessage);
  await writeStore(store);
  return { userMessage, assistantMessage };
}
