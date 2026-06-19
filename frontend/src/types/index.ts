export type Role = "user" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: Role;
  createdAt: string;
};

export type Chat = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
  createdAt: string;
};

export type Document = {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  status: "uploaded" | "processing" | "ready" | "failed";
  createdAt: string;
};

export type AgentTask = {
  id: string;
  agentType: "research" | "coding" | "study-planner";
  input: string;
  output?: string;
  status: "queued" | "running" | "complete" | "failed";
  createdAt: string;
};
