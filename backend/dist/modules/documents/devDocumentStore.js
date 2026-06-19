import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
const storePath = join(process.cwd(), "data", "dev-documents.json");
async function readStore() {
    try {
        const content = await readFile(storePath, "utf8");
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
            return { documents: parsed, messages: [] };
        }
        return { documents: parsed.documents ?? [], messages: parsed.messages ?? [] };
    }
    catch {
        return { documents: [], messages: [] };
    }
}
async function writeStore(store) {
    await mkdir(dirname(storePath), { recursive: true });
    await writeFile(storePath, JSON.stringify(store, null, 2));
}
export async function listDevDocuments(userId) {
    const store = await readStore();
    return store.documents
        .filter((document) => document.user_id === userId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
export async function createDevDocument(input) {
    const store = await readStore();
    const document = {
        ...input,
        id: randomUUID(),
        created_at: new Date().toISOString(),
    };
    store.documents.push(document);
    await writeStore(store);
    return document;
}
export async function deleteDevDocument(userId, documentId) {
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
export async function updateDevDocument(userId, documentId, updates) {
    const store = await readStore();
    const document = store.documents.find((candidate) => candidate.user_id === userId && candidate.id === documentId);
    if (!document) {
        return null;
    }
    Object.assign(document, updates);
    await writeStore(store);
    return document;
}
export async function getDevDocument(userId, documentId) {
    const store = await readStore();
    return store.documents.find((document) => document.user_id === userId && document.id === documentId) ?? null;
}
export async function listDevDocumentMessages(userId, documentId) {
    const store = await readStore();
    const document = store.documents.find((candidate) => candidate.user_id === userId && candidate.id === documentId);
    if (!document) {
        return null;
    }
    return store.messages
        .filter((message) => message.user_id === userId && message.document_id === documentId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
}
export async function appendDevDocumentQa(input) {
    const store = await readStore();
    const document = store.documents.find((candidate) => candidate.user_id === input.userId && candidate.id === input.documentId);
    if (!document) {
        return null;
    }
    const userMessage = {
        id: randomUUID(),
        document_id: input.documentId,
        user_id: input.userId,
        role: "user",
        content: input.question,
        references: [],
        created_at: new Date().toISOString(),
    };
    const assistantMessage = {
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
