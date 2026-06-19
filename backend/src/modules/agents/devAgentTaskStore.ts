import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";

export type DevAgentTask = {
  id: string;
  user_id: string;
  agent_type: "research" | "coding" | "image-generater";
  input: string;
  output: string;
  status: "queued" | "running" | "complete" | "failed";
  created_at: string;
};

const storePath = join(process.cwd(), "data", "dev-agent-tasks.json");

async function readTasks(): Promise<DevAgentTask[]> {
  try {
    const content = await readFile(storePath, "utf8");
    return JSON.parse(content) as DevAgentTask[];
  } catch {
    return [];
  }
}

async function writeTasks(tasks: DevAgentTask[]) {
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(tasks, null, 2));
}

export async function listDevAgentTasks(userId: string, agentType?: DevAgentTask["agent_type"]) {
  const tasks = await readTasks();
  return tasks
    .filter((task) => task.user_id === userId && (!agentType || task.agent_type === agentType))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createDevAgentTask(input: Omit<DevAgentTask, "id" | "created_at" | "status">) {
  const tasks = await readTasks();
  const task: DevAgentTask = {
    ...input,
    id: randomUUID(),
    status: "complete",
    created_at: new Date().toISOString(),
  };
  tasks.push(task);
  await writeTasks(tasks);
  return task;
}

