import { Router } from "express";
import axios from "axios";
import { z } from "zod";
import { env } from "../../config/env.js";
import { query } from "../../database/pool.js";
import { requireAuth } from "../../middleware/auth.js";
import { HttpError } from "../../utils/httpError.js";
import { canUseDevAuthFallback } from "../auth/devAuthStore.js";
import { createDevAgentTask, listDevAgentTasks } from "./devAgentTaskStore.js";

export const agentsRouter = Router();
agentsRouter.use(requireAuth);

const agentTaskSchema = z.object({
  agentType: z.enum(["research", "coding", "image-generater"]),
  input: z.string().min(1),
});

function endpointForAgent(agentType: z.infer<typeof agentTaskSchema>["agentType"]) {
  return `${env.AI_SERVICE_URL}/ai/agents/${agentType}`;
}

agentsRouter.get("/", async (req, res, next) => {
  try {
    const agentType = typeof req.query.agentType === "string" ? req.query.agentType : undefined;
    const params: unknown[] = [req.user!.id];
    const filter = agentType ? "and agent_type = $2" : "";
    if (agentType) {
      params.push(agentType);
    }
    const result = await query(
      `select * from agent_tasks where user_id = $1 ${filter} order by created_at desc`,
      params,
    );
    res.json(result.rows);
  } catch (error) {
    if (canUseDevAuthFallback(error)) {
      const agentType = agentTaskSchema.shape.agentType.safeParse(req.query.agentType).success
        ? (req.query.agentType as "research" | "coding" | "image-generater")
        : undefined;
      res.json(await listDevAgentTasks(req.user!.id, agentType));
      return;
    }
    next(error);
  }
});

agentsRouter.post("/", async (req, res, next) => {
  try {
    const input = agentTaskSchema.parse(req.body);
    const aiResponse = await axios.post(endpointForAgent(input.agentType), { input: input.input });
    const result = await query(
      "insert into agent_tasks (user_id, agent_type, input, output, status) values ($1, $2, $3, $4, 'complete') returning *",
      [req.user!.id, input.agentType, input.input, aiResponse.data.output],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      next(new HttpError(502, "AI agent service is unavailable"));
      return;
    }

    if (canUseDevAuthFallback(error)) {
      const input = agentTaskSchema.parse(req.body);
      try {
        const aiResponse = await axios.post(endpointForAgent(input.agentType), { input: input.input });
        const task = await createDevAgentTask({
          user_id: req.user!.id,
          agent_type: input.agentType,
          input: input.input,
          output: aiResponse.data.output,
        });
        res.status(201).json(task);
        return;
      } catch (aiError) {
        if (axios.isAxiosError(aiError)) {
          next(new HttpError(502, "AI agent service is unavailable"));
          return;
        }
        next(aiError);
        return;
      }
    }

    next(error);
  }
});

