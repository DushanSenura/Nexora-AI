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

const storePath = join(process.cwd(), "data", "dev-documents.json");

async function readDocuments(): Promise<DevDocument[]> {
  try {
    const content = await readFile(storePath, "utf8");
    return JSON.parse(content) as DevDocument[];
  } catch {
    return [];
  }
}

async function writeDocuments(documents: DevDocument[]) {
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(documents, null, 2));
}

export async function listDevDocuments(userId: string) {
  const documents = await readDocuments();
  return documents
    .filter((document) => document.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createDevDocument(input: Omit<DevDocument, "id" | "created_at">) {
  const documents = await readDocuments();
  const document: DevDocument = {
    ...input,
    id: randomUUID(),
    created_at: new Date().toISOString(),
  };
  documents.push(document);
  await writeDocuments(documents);
  return document;
}

export async function deleteDevDocument(userId: string, documentId: string) {
  const documents = await readDocuments();
  const document = documents.find((candidate) => candidate.user_id === userId && candidate.id === documentId);
  if (!document) {
    return null;
  }

  await writeDocuments(documents.filter((candidate) => candidate.id !== documentId));
  return document;
}

