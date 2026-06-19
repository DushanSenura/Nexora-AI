import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Router } from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import { z } from "zod";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { query } from "../../database/pool.js";
import {
  canUseDevAuthFallback,
  deleteDevUser,
  findDevUserById,
  listDevUsers,
  setDevUserDisabled,
  toPublicUser,
  updateDevUserPassword,
  updateDevUserProfile,
} from "../auth/devAuthStore.js";
import { HttpError } from "../../utils/httpError.js";

export const usersRouter = Router();

const avatarRoot = join(process.cwd(), "uploads", "avatars");
const profileSchema = z.object({ name: z.string().trim().min(2).max(80) });
const passwordSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) });
const avatarUpload = multer({
  storage: multer.diskStorage({
    async destination(_req, _file, callback) {
      await mkdir(avatarRoot, { recursive: true });
      callback(null, avatarRoot);
    },
    filename(_req, file, callback) {
      const extension = file.originalname.includes(".") ? file.originalname.slice(file.originalname.lastIndexOf(".")) : ".png";
      callback(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(_req, file, callback) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.mimetype)) {
      callback(new HttpError(400, "Only PNG, JPG, and WEBP images are supported"));
      return;
    }
    callback(null, true);
  },
});

usersRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const result = await query("select id, name, email, avatar_url, role, created_at from users where id = $1", [req.user!.id]);
    res.json(result.rows[0]);
  } catch (error) {
    if (canUseDevAuthFallback(error)) {
      const user = await findDevUserById(req.user!.id);

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

usersRouter.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const input = profileSchema.parse(req.body);
    const result = await query("update users set name = $1 where id = $2 returning id, name, email, avatar_url, role, created_at", [
      input.name,
      req.user!.id,
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    if (canUseDevAuthFallback(error)) {
      const input = profileSchema.parse(req.body);
      const user = await updateDevUserProfile(req.user!.id, { name: input.name });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json(user);
      return;
    }
    next(error);
  }
});

usersRouter.patch("/me/password", requireAuth, async (req, res, next) => {
  try {
    const input = passwordSchema.parse(req.body);
    const current = await query<{ password_hash: string }>("select password_hash from users where id = $1", [req.user!.id]);
    if (!current.rows[0] || !(await bcrypt.compare(input.currentPassword, current.rows[0].password_hash))) {
      res.status(401).json({ message: "Current password is incorrect" });
      return;
    }
    await query("update users set password_hash = $1 where id = $2", [await bcrypt.hash(input.newPassword, 12), req.user!.id]);
    res.json({ message: "Password updated" });
  } catch (error) {
    if (canUseDevAuthFallback(error)) {
      const input = passwordSchema.parse(req.body);
      const updated = await updateDevUserPassword(req.user!.id, input.newPassword);
      if (!updated) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json({ message: "Password updated" });
      return;
    }
    next(error);
  }
});

usersRouter.post("/me/avatar", requireAuth, avatarUpload.single("avatar"), async (req, res, next) => {
  const file = req.file;
  if (!file) {
    next(new HttpError(400, "Avatar image is required"));
    return;
  }
  const avatarUrl = `/uploads/avatars/${file.filename}`;
  try {
    const result = await query("update users set avatar_url = $1 where id = $2 returning id, name, email, avatar_url, role, created_at", [
      avatarUrl,
      req.user!.id,
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    if (canUseDevAuthFallback(error)) {
      const user = await updateDevUserProfile(req.user!.id, { avatar_url: avatarUrl });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json(user);
      return;
    }
    next(error);
  }
});

usersRouter.delete("/me", requireAuth, async (req, res, next) => {
  try {
    await query("delete from users where id = $1", [req.user!.id]);
    res.status(204).send();
  } catch (error) {
    if (canUseDevAuthFallback(error)) {
      await deleteDevUser(req.user!.id);
      res.status(204).send();
      return;
    }
    next(error);
  }
});

usersRouter.get("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const result = await query(
      "select id, name, email, role, disabled_at, created_at from users where ($1 = '' or name ilike $2 or email ilike $2) order by created_at desc",
      [search, `%${search}%`],
    );
    res.json(result.rows);
  } catch (error) {
    if (canUseDevAuthFallback(error)) {
      const search = typeof req.query.search === "string" ? req.query.search : "";
      res.json(await listDevUsers(search));
      return;
    }
    next(error);
  }
});

usersRouter.patch("/:userId/disabled", requireAuth, requireAdmin, async (req, res, next) => {
  const userId = String(req.params.userId);
  try {
    if (userId === req.user!.id) {
      res.status(400).json({ message: "You cannot disable your own account" });
      return;
    }

    const disabled = Boolean(req.body?.disabled);
    const result = await query(
      "update users set disabled_at = case when $1 then now() else null end where id = $2 returning id, name, email, role, disabled_at, created_at",
      [disabled, userId],
    );
    if (!result.rows[0]) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    if (canUseDevAuthFallback(error)) {
      if (userId === req.user!.id) {
        res.status(400).json({ message: "You cannot disable your own account" });
        return;
      }
      const user = await setDevUserDisabled(userId, Boolean(req.body?.disabled));
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json(user);
      return;
    }
    next(error);
  }
});

usersRouter.delete("/:userId", requireAuth, requireAdmin, async (req, res, next) => {
  const userId = String(req.params.userId);
  try {
    if (userId === req.user!.id) {
      res.status(400).json({ message: "You cannot delete your own account" });
      return;
    }

    const result = await query("delete from users where id = $1 returning id", [userId]);
    if (!result.rows[0]) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    if (canUseDevAuthFallback(error)) {
      if (userId === req.user!.id) {
        res.status(400).json({ message: "You cannot delete your own account" });
        return;
      }
      const deleted = await deleteDevUser(userId);
      if (!deleted) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.status(204).send();
      return;
    }
    next(error);
  }
});
