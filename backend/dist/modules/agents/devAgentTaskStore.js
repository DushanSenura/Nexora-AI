import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
const storePath = join(process.cwd(), "data", "dev-agent-tasks.json");
async function readTasks() {
    try {
        const content = await readFile(storePath, "utf8");
        return JSON.parse(content);
    }
    catch {
        return [];
    }
}
async function writeTasks(tasks) {
    await mkdir(dirname(storePath), { recursive: true });
    await writeFile(storePath, JSON.stringify(tasks, null, 2));
}
export async function listDevAgentTasks(userId, agentType) {
    const tasks = await readTasks();
    return tasks
        .filter((task) => task.user_id === userId && (!agentType || task.agent_type === agentType))
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
export async function createDevAgentTask(input) {
    const tasks = await readTasks();
    const task = {
        ...input,
        id: randomUUID(),
        status: "complete",
        created_at: new Date().toISOString(),
    };
    tasks.push(task);
    await writeTasks(tasks);
    return task;
}
