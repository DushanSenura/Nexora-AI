import { Router } from "express";
import axios from "axios";
import { z } from "zod";
import { env } from "../../config/env.js";
import { requireAuth } from "../../middleware/auth.js";
import { query } from "../../database/pool.js";
export const messagesRouter = Router();
messagesRouter.use(requireAuth);
const messageSchema = z.object({
    chatId: z.string().uuid(),
    content: z.string().min(1),
    model: z.string().default("llama3.1"),
});
messagesRouter.get("/:chatId", async (req, res, next) => {
    try {
        const result = await query("select * from messages where chat_id = $1 order by created_at asc", [req.params.chatId]);
        res.json(result.rows);
    }
    catch (error) {
        next(error);
    }
});
messagesRouter.post("/", async (req, res, next) => {
    try {
        const input = messageSchema.parse(req.body);
        await query("insert into messages (chat_id, role, content, model) values ($1, 'user', $2, $3)", [input.chatId, input.content, input.model]);
        const aiResponse = await axios.post(`${env.AI_SERVICE_URL}/api/chat`, {
            message: input.content,
            model: input.model,
        });
        const saved = await query("insert into messages (chat_id, role, content, model) values ($1, 'assistant', $2, $3) returning *", [input.chatId, aiResponse.data.response, input.model]);
        res.status(201).json(saved.rows[0]);
    }
    catch (error) {
        next(error);
    }
});
