import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";

export type DevDocument = {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  status: "uploaded" | "processing" | "ready" | "failed";
  created_at: string;
  file_size?: number;
  chunk_count?: number;
  extracted_chars?: number;
};

export type DevDocumentMessage = {
  id: string;
  document_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  references: Array<{ chunk_index: number; text: string; score?: number; file_name?: string }>;
  created_at: string;
};

type DevDocumentStore = {
  documents: DevDocument[];
  messages: DevDocumentMessage[];
};

const storePath = join(process.cwd(), "data", "dev-documents.json");

async function readStore(): Promise<DevDocumentStore> {
  try {
    const content = await readFile(storePath, "utf8");
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return { documents: parsed, messages: [] };
    }
    return { documents: parsed.documents ?? [], messages: parsed.messages ?? [] };
  } catch {
    return { documents: [], messages: [] };
  }
}

async function writeStore(store: DevDocumentStore) {
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2));
}

export async function listDevDocuments(userId: string) {
  const store = await readStore();
  return store.documents
    .filter((document) => document.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createDevDocument(input: Omit<DevDocument, "id" | "created_at">) {
  const store = await readStore();
  const document: DevDocument = {
    ...input,
    id: randomUUID(),
    created_at: new Date().toISOString(),
  };
  store.documents.push(document);
  await writeStore(store);
  return document;
}

export async function deleteDevDocument(userId: string, documentId: string) {
  const store = await readStore();
  const document = store.documents.find((candidate) => candidate.user_id === userId && candidate.id === documentId);
  if (!document) {
    return null;
  }

  store.documents = store.documents.filter((candidate) => candidate.id !== documentId);
  store.messages = store.messages.filter((message) => message.document_id !== documentId);
  await writeStore(store);
  return document;
}

export async function updateDevDocument(
  userId: string,
  documentId: string,
  updates: Partial<Pick<DevDocument, "status" | "chunk_count" | "extracted_chars" | "file_size">>,
) {
  const store = await readStore();
  const document = store.documents.find((candidate) => candidate.user_id === userId && candidate.id === documentId);
  if (!document) {
    return null;
  }

  Object.assign(document, updates);
  await writeStore(store);
  return document;
}

export async function getDevDocument(userId: string, documentId: string) {
  const store = await readStore();
  return store.documents.find((document) => document.user_id === userId && document.id === documentId) ?? null;
}

export async function listDevDocumentMessages(userId: string, documentId: string) {
  const store = await readStore();
  const document = store.documents.find((candidate) => candidate.user_id === userId && candidate.id === documentId);
  if (!document) {
    return null;
  }

  return store.messages
    .filter((message) => message.user_id === userId && message.document_id === documentId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function appendDevDocumentQa(input: {
  userId: string;
  documentId: string;
  question: string;
  answer: string;
  references: DevDocumentMessage["references"];
}) {
  const store = await readStore();
  const document = store.documents.find((candidate) => candidate.user_id === input.userId && candidate.id === input.documentId);
  if (!document) {
    return null;
  }

  const userMessage: DevDocumentMessage = {
    id: randomUUID(),
    document_id: input.documentId,
    user_id: input.userId,
    role: "user",
    content: input.question,
    references: [],
    created_at: new Date().toISOString(),
  };
  const assistantMessage: DevDocumentMessage = {
    id: randomUUID(),
    document_id: input.documentId,
    user_id: input.userId,
    role: "assistant",
    content: input.answer,
    references: input.references,
    created_at: new Date(Date.now() + 1).toISOString(),
  };

  store.messages.push(userMessage, assistantMessage);
  await writeStore(store);
  return { userMessage, assistantMessage };
}
