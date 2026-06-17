import { Router } from "express";
import axios from "axios";
import { z } from "zod";
import { env } from "../../config/env.js";
import { requireAuth } from "../../middleware/auth.js";
import { query } from "../../database/pool.js";

export const agentsRouter = Router();
agentsRouter.use(requireAuth);

const agentTaskSchema = z.object({
  agentType: z.enum(["research", "coding", "study-planner"]),
  input: z.string().min(1),
});

agentsRouter.get("/", async (req, res, next) => {
  try {
    const result = await query("select * from agent_tasks where user_id = $1 order by created_at desc", [req.user!.id]);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

agentsRouter.post("/", async (req, res, next) => {
  try {
    const input = agentTaskSchema.parse(req.body);
    const aiResponse = await axios.post(`${env.AI_SERVICE_URL}/api/agents/run`, input);
    const result = await query(
      "insert into agent_tasks (user_id, agent_type, input, output, status) values ($1, $2, $3, $4, 'complete') returning *",
      [req.user!.id, input.agentType, input.input, aiResponse.data.output],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

