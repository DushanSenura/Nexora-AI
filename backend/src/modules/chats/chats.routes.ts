import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { query } from "../../database/pool.js";

export const chatsRouter = Router();
chatsRouter.use(requireAuth);

const chatSchema = z.object({ title: z.string().min(1).default("New chat") });

chatsRouter.get("/", async (req, res, next) => {
  try {
    const result = await query("select * from chats where user_id = $1 order by updated_at desc", [req.user!.id]);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

chatsRouter.post("/", async (req, res, next) => {
  try {
    const input = chatSchema.parse(req.body);
    const result = await query("insert into chats (user_id, title) values ($1, $2) returning *", [req.user!.id, input.title]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

