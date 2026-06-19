import { api } from "../../services/api";

export type DocumentRecord = {
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

export type DocumentMessage = {
  id: string;
  document_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  references: Array<{ chunk_index: number; text: string; score?: number; file_name?: string }>;
  created_at: string;
};

export type DocumentChatResponse = {
  userMessage: DocumentMessage;
  assistantMessage: DocumentMessage;
};

export async function listDocuments() {
  const response = await api.get<DocumentRecord[]>("/documents");
  return response.data;
}

export async function getDocument(documentId: string) {
  const documents = await listDocuments();
  return documents.find((document) => document.id === documentId) ?? null;
}

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<DocumentRecord>("/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function deleteDocument(documentId: string) {
  await api.delete(`/documents/${documentId}`);
}

export async function listDocumentMessages(documentId: string) {
  const response = await api.get<DocumentMessage[]>(`/documents/${documentId}/chat`);
  return response.data;
}

export async function askDocument(input: { documentId: string; question: string }) {
  const response = await api.post<DocumentChatResponse>(`/documents/${input.documentId}/chat`, {
    question: input.question,
  });
  return response.data;
}
