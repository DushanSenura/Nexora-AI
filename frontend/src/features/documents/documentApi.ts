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

export async function listDocuments() {
  const response = await api.get<DocumentRecord[]>("/documents");
  return response.data;
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

