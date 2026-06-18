import { Router } from "express";
import axios from "axios";
import { z } from "zod";
import { env } from "../../config/env.js";
import { requireAuth } from "../../middleware/auth.js";
import { query } from "../../database/pool.js";
import { HttpError } from "../../utils/httpError.js";
import { canUseDevAuthFallback } from "../auth/devAuthStore.js";
import { appendDevMessagePair, listDevMessages } from "../chats/devChatStore.js";
export const messagesRouter = Router();
messagesRouter.use(requireAuth);
const messageSchema = z.object({
    chatId: z.string().uuid(),
    content: z.string().min(1),
    model: z.string().default("llama3.2"),
});
function generateChatTitle(content) {
    const compact = content.replace(/\s+/g, " ").trim();
    if (!compact) {
        return "New chat";
    }
    const withoutTrailingPunctuation = compact.replace(/[.!?]+$/, "");
    return withoutTrailingPunctuation.length > 48
        ? `${withoutTrailingPunctuation.slice(0, 45).trim()}...`
        : withoutTrailingPunctuation;
}
messagesRouter.get("/:chatId", async (req, res, next) => {
    try {
        const chat = await query("select id from chats where id = $1 and user_id = $2", [req.params.chatId, req.user.id]);
        if (!chat.rows[0]) {
            res.status(404).json({ message: "Chat not found" });
            return;
        }
        const result = await query("select * from messages where chat_id = $1 order by created_at asc", [req.params.chatId]);
        res.json(result.rows);
    }
    catch (error) {
        if (canUseDevAuthFallback(error)) {
            const messages = await listDevMessages(req.user.id, req.params.chatId);
            if (!messages) {
                res.status(404).json({ message: "Chat not found" });
                return;
            }
            res.json(messages);
            return;
        }
        next(error);
    }
});
messagesRouter.post("/", async (req, res, next) => {
    try {
        const input = messageSchema.parse(req.body);
        const chat = await query("select id from chats where id = $1 and user_id = $2", [input.chatId, req.user.id]);
        if (!chat.rows[0]) {
            res.status(404).json({ message: "Chat not found" });
            return;
        }
        const userSaved = await query("insert into messages (chat_id, role, content, model) values ($1, 'user', $2, $3) returning *", [input.chatId, input.content, input.model]);
        const aiResponse = await axios.post(`${env.AI_SERVICE_URL}/ai/chat`, {
            message: input.content,
            model: input.model,
        });
        const assistantSaved = await query("insert into messages (chat_id, role, content, model) values ($1, 'assistant', $2, $3) returning *", [input.chatId, aiResponse.data.response, input.model]);
        await query("update chats set title = case when title = 'New chat' then $1 else title end, updated_at = now() where id = $2", [
            generateChatTitle(input.content),
            input.chatId,
        ]);
        res.status(201).json({ userMessage: userSaved.rows[0], assistantMessage: assistantSaved.rows[0] });
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            next(new HttpError(502, "AI service is unavailable. Start the AI service and try again."));
            return;
        }
        if (canUseDevAuthFallback(error)) {
            const input = messageSchema.parse(req.body);
            try {
                const aiResponse = await axios.post(`${env.AI_SERVICE_URL}/ai/chat`, {
                    message: input.content,
                    model: input.model,
                });
                const saved = await appendDevMessagePair({
                    userId: req.user.id,
                    chatId: input.chatId,
                    userContent: input.content,
                    assistantContent: aiResponse.data.response,
                    model: input.model,
                });
                if (!saved) {
                    res.status(404).json({ message: "Chat not found" });
                    return;
                }
                res.status(201).json(saved);
                return;
            }
            catch (aiError) {
                if (axios.isAxiosError(aiError)) {
                    next(new HttpError(502, "AI service is unavailable. Start the AI service and try again."));
                    return;
                }
                next(aiError);
                return;
            }
        }
        next(error);
    }
});
