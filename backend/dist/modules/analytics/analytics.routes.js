import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Router } from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { query } from "../../database/pool.js";
import { canUseDevAuthFallback } from "../auth/devAuthStore.js";
export const analyticsRouter = Router();
analyticsRouter.use(requireAuth, requireAdmin);
async function readJson(fileName, fallback) {
    try {
        const content = await readFile(join(process.cwd(), "data", fileName), "utf8");
        return JSON.parse(content);
    }
    catch {
        return fallback;
    }
}
async function devStats() {
    const users = await readJson("dev-users.json", []);
    const chatStore = await readJson("dev-chats.json", {});
    const documentStore = await readJson("dev-documents.json", {});
    const agentTasks = await readJson("dev-agent-tasks.json", []);
    return {
        users: { count: users.length, disabled: users.filter((user) => user.disabled_at).length },
        chats: { count: chatStore.chats?.length ?? 0, messages: chatStore.messages?.length ?? 0 },
        documents: {
            count: documentStore.documents?.length ?? 0,
            ready: documentStore.documents?.filter((document) => document.status === "ready").length ?? 0,
            failed: documentStore.documents?.filter((document) => document.status === "failed").length ?? 0,
        },
        agents: {
            count: agentTasks.length,
            research: agentTasks.filter((task) => task.agent_type === "research").length,
            coding: agentTasks.filter((task) => task.agent_type === "coding").length,
            image: agentTasks.filter((task) => task.agent_type === "image-generater").length,
        },
        usage: { total: 0, logs: [] },
    };
}
analyticsRouter.get("/overview", async (_req, res, next) => {
    try {
        const [users, disabledUsers, chats, messages, documents, readyDocuments, failedDocuments, agents, usage] = await Promise.all([
            query("select count(*)::int as count from users"),
            query("select count(*)::int as count from users where disabled_at is not null"),
            query("select count(*)::int as count from chats"),
            query("select count(*)::int as count from messages"),
            query("select count(*)::int as count from documents"),
            query("select count(*)::int as count from documents where status = 'ready'"),
            query("select count(*)::int as count from documents where status = 'failed'"),
            query(`
        select
          count(*)::int as count,
          count(*) filter (where agent_type = 'research')::int as research,
          count(*) filter (where agent_type = 'coding')::int as coding,
          count(*) filter (where agent_type = 'image-generater')::int as image
        from agent_tasks
      `),
            query("select coalesce(sum(tokens_used), 0)::int as total from usage_logs"),
        ]);
        res.json({
            users: { count: users.rows[0].count, disabled: disabledUsers.rows[0].count },
            chats: { count: chats.rows[0].count, messages: messages.rows[0].count },
            documents: {
                count: documents.rows[0].count,
                ready: readyDocuments.rows[0].count,
                failed: failedDocuments.rows[0].count,
            },
            agents: agents.rows[0],
            usage: usage.rows[0],
        });
    }
    catch (error) {
        if (canUseDevAuthFallback(error)) {
            res.json(await devStats());
            return;
        }
        next(error);
    }
});
analyticsRouter.get("/usage-logs", async (_req, res, next) => {
    try {
        const result = await query(`
      select usage_logs.id, usage_logs.action, usage_logs.tokens_used, usage_logs.created_at,
             users.email as user_email
      from usage_logs
      join users on users.id = usage_logs.user_id
      order by usage_logs.created_at desc
      limit 100
    `);
        res.json(result.rows);
    }
    catch (error) {
        if (canUseDevAuthFallback(error)) {
            res.json([]);
            return;
        }
        next(error);
    }
});
