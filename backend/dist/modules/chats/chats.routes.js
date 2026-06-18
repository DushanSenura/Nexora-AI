import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { query } from "../../database/pool.js";
import { canUseDevAuthFallback } from "../auth/devAuthStore.js";
import { clearDevMessages, createDevChat, deleteDevChat, getDevChat, listDevChats, renameDevChat, } from "./devChatStore.js";
export const chatsRouter = Router();
chatsRouter.use(requireAuth);
const chatSchema = z.object({ title: z.string().min(1).default("New chat") });
const renameChatSchema = z.object({ title: z.string().trim().min(1).max(80) });
chatsRouter.get("/", async (req, res, next) => {
    try {
        const result = await query("select * from chats where user_id = $1 order by updated_at desc", [req.user.id]);
        res.json(result.rows);
    }
    catch (error) {
        if (canUseDevAuthFallback(error)) {
            res.json(await listDevChats(req.user.id));
            return;
        }
        next(error);
    }
});
chatsRouter.get("/:chatId", async (req, res, next) => {
    try {
        const result = await query("select * from chats where id = $1 and user_id = $2", [req.params.chatId, req.user.id]);
        if (!result.rows[0]) {
            res.status(404).json({ message: "Chat not found" });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        if (canUseDevAuthFallback(error)) {
            const chat = await getDevChat(req.user.id, req.params.chatId);
            if (!chat) {
                res.status(404).json({ message: "Chat not found" });
                return;
            }
            res.json(chat);
            return;
        }
        next(error);
    }
});
chatsRouter.post("/", async (req, res, next) => {
    try {
        const input = chatSchema.parse(req.body);
        const result = await query("insert into chats (user_id, title) values ($1, $2) returning *", [req.user.id, input.title]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        if (canUseDevAuthFallback(error)) {
            const input = chatSchema.parse(req.body);
            res.status(201).json(await createDevChat(req.user.id, input.title));
            return;
        }
        next(error);
    }
});
chatsRouter.patch("/:chatId", async (req, res, next) => {
    try {
        const input = renameChatSchema.parse(req.body);
        const result = await query("update chats set title = $1, updated_at = now() where id = $2 and user_id = $3 returning *", [input.title, req.params.chatId, req.user.id]);
        if (!result.rows[0]) {
            res.status(404).json({ message: "Chat not found" });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        if (canUseDevAuthFallback(error)) {
            const input = renameChatSchema.parse(req.body);
            const chat = await renameDevChat(req.user.id, req.params.chatId, input.title);
            if (!chat) {
                res.status(404).json({ message: "Chat not found" });
                return;
            }
            res.json(chat);
            return;
        }
        next(error);
    }
});
chatsRouter.delete("/:chatId", async (req, res, next) => {
    try {
        const result = await query("delete from chats where id = $1 and user_id = $2 returning id", [
            req.params.chatId,
            req.user.id,
        ]);
        if (!result.rows[0]) {
            res.status(404).json({ message: "Chat not found" });
            return;
        }
        res.status(204).send();
    }
    catch (error) {
        if (canUseDevAuthFallback(error)) {
            const deleted = await deleteDevChat(req.user.id, req.params.chatId);
            if (!deleted) {
                res.status(404).json({ message: "Chat not found" });
                return;
            }
            res.status(204).send();
            return;
        }
        next(error);
    }
});
chatsRouter.delete("/:chatId/messages", async (req, res, next) => {
    try {
        const chat = await query("select id from chats where id = $1 and user_id = $2", [req.params.chatId, req.user.id]);
        if (!chat.rows[0]) {
            res.status(404).json({ message: "Chat not found" });
            return;
        }
        await query("delete from messages where chat_id = $1", [req.params.chatId]);
        const result = await query("update chats set title = 'New chat', updated_at = now() where id = $1 returning *", [
            req.params.chatId,
        ]);
        res.json(result.rows[0]);
    }
    catch (error) {
        if (canUseDevAuthFallback(error)) {
            const chat = await clearDevMessages(req.user.id, req.params.chatId);
            if (!chat) {
                res.status(404).json({ message: "Chat not found" });
                return;
            }
            res.json(chat);
            return;
        }
        next(error);
    }
});
