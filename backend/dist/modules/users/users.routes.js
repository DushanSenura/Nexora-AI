import { Router } from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { query } from "../../database/pool.js";
import { canUseDevAuthFallback, findDevUserById, toPublicUser } from "../auth/devAuthStore.js";
export const usersRouter = Router();
usersRouter.get("/me", requireAuth, async (req, res, next) => {
    try {
        const result = await query("select id, name, email, role, created_at from users where id = $1", [req.user.id]);
        res.json(result.rows[0]);
    }
    catch (error) {
        if (canUseDevAuthFallback(error)) {
            const user = await findDevUserById(req.user.id);
            if (!user) {
                res.status(404).json({ message: "Current user not found" });
                return;
            }
            res.json(toPublicUser(user));
            return;
        }
        next(error);
    }
});
usersRouter.get("/", requireAuth, requireAdmin, async (_req, res, next) => {
    try {
        const result = await query("select id, name, email, role, created_at from users order by created_at desc");
        res.json(result.rows);
    }
    catch (error) {
        next(error);
    }
});
