import { Router } from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { query } from "../../database/pool.js";

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth, requireAdmin);

analyticsRouter.get("/overview", async (_req, res, next) => {
  try {
    const [users, chats, documents, usage] = await Promise.all([
      query("select count(*)::int as count from users"),
      query("select count(*)::int as count from chats"),
      query("select count(*)::int as count from documents"),
      query("select coalesce(sum(tokens_used), 0)::int as total from usage_logs"),
    ]);

    res.json({
      users: users.rows[0],
      chats: chats.rows[0],
      documents: documents.rows[0],
      usage: usage.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

