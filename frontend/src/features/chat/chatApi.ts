import { api } from "../../services/api";

export type ChatRecord = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type MessageRecord = {
  id: string;
  chat_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
  sources?: Array<{ title: string; url: string; snippet?: string }>;
  created_at: string;
};

export type SendMessageResponse = {
  userMessage: MessageRecord;
  assistantMessage: MessageRecord;
};

export async function listChats() {
  const response = await api.get<ChatRecord[]>("/chats");
  return response.data;
}

export async function createChat(title = "New chat") {
  const response = await api.post<ChatRecord>("/chats", { title });
  return response.data;
}

export async function renameChat(input: { chatId: string; title: string }) {
  const response = await api.patch<ChatRecord>(`/chats/${input.chatId}`, { title: input.title });
  return response.data;
}

export async function deleteChat(chatId: string) {
  await api.delete(`/chats/${chatId}`);
}

export async function clearChatMessages(chatId: string) {
  const response = await api.delete<ChatRecord>(`/chats/${chatId}/messages`);
  return response.data;
}

export async function listMessages(chatId: string) {
  const response = await api.get<MessageRecord[]>(`/messages/${chatId}`);
  return response.data;
}

export async function sendMessage(input: { chatId: string; content: string; model?: string; searchMode?: boolean }) {
  const response = await api.post<SendMessageResponse>("/messages", {
    chatId: input.chatId,
    content: input.content,
    model: input.model ?? "llama3.2",
    searchMode: input.searchMode ?? false,
  });
  return response.data;
}
