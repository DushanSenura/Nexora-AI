import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
const storePath = join(process.cwd(), "data", "dev-documents.json");
async function readDocuments() {
    try {
        const content = await readFile(storePath, "utf8");
        return JSON.parse(content);
    }
    catch {
        return [];
    }
}
async function writeDocuments(documents) {
    await mkdir(dirname(storePath), { recursive: true });
    await writeFile(storePath, JSON.stringify(documents, null, 2));
}
export async function listDevDocuments(userId) {
    const documents = await readDocuments();
    return documents
        .filter((document) => document.user_id === userId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
export async function createDevDocument(input) {
    const documents = await readDocuments();
    const document = {
        ...input,
        id: randomUUID(),
        created_at: new Date().toISOString(),
    };
    documents.push(document);
    await writeDocuments(documents);
    return document;
}
export async function deleteDevDocument(userId, documentId) {
    const documents = await readDocuments();
    const document = documents.find((candidate) => candidate.user_id === userId && candidate.id === documentId);
    if (!document) {
        return null;
    }
    await writeDocuments(documents.filter((candidate) => candidate.id !== documentId));
    return document;
}
