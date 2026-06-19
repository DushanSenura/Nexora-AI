import { api } from "../../services/api";

export type AgentType = "research" | "coding" | "image-generater";

export type AgentTask = {
  id: string;
  user_id: string;
  agent_type: AgentType;
  input: string;
  output: string;
  status: "queued" | "running" | "complete" | "failed";
  created_at: string;
};

export async function listAgentTasks(agentType?: AgentType) {
  const response = await api.get<AgentTask[]>("/agents", {
    params: agentType ? { agentType } : undefined,
  });
  return response.data;
}

export async function runAgent(input: { agentType: AgentType; input: string }) {
  const response = await api.post<AgentTask>("/agents", input);
  return response.data;
}

