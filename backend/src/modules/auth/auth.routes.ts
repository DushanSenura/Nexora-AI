import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../../config/env.js";
import { query } from "../../database/pool.js";
import { HttpError } from "../../utils/httpError.js";
import {
  canUseDevAuthFallback,
  createDevUser,
  findDevUserByCredentials,
  toPublicUser,
} from "./devAuthStore.js";

export const authRouter = Router();

const authSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().trim().email("Enter a valid email address").transform((email) => email.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function signToken(user: { id: string; email: string; role: string }) {
  const options: jwt.SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(user, env.JWT_SECRET, options);
}

authRouter.post("/register", async (req, res, next) => {
  try {
    const input = authSchema.required({ name: true }).parse(req.body);
    const passwordHash = await bcrypt.hash(input.password, 12);
    const result = await query<{ id: string; name: string; email: string; role: string; created_at: string }>(
      "insert into users (name, email, password_hash) values ($1, $2, $3) returning id, name, email, role, created_at",
      [input.name, input.email, passwordHash],
    );
    const user = result.rows[0];
    res.status(201).json({ user, token: signToken({ id: user.id, email: user.email, role: user.role }) });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      next(new HttpError(409, "An account with this email already exists"));
      return;
    }

    if (canUseDevAuthFallback(error)) {
      const input = authSchema.required({ name: true }).parse(req.body);
      const user = await createDevUser(input);

      if (!user) {
        next(new HttpError(409, "An account with this email already exists"));
        return;
      }

      res.status(201).json({
        user: toPublicUser(user),
        token: signToken({ id: user.id, email: user.email, role: user.role }),
        mode: "development-fallback",
      });
      return;
    }

    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = authSchema.omit({ name: true }).parse(req.body);
    const result = await query<{ id: string; name: string; email: string; password_hash: string; role: string; disabled_at: string | null; created_at: string }>(
      "select id, name, email, password_hash, role, disabled_at, created_at from users where email = $1",
      [input.email],
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
      throw new HttpError(401, "Invalid email or password");
    }

    if (user.disabled_at) {
      throw new HttpError(403, "This account has been disabled");
    }

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at },
      token: signToken({ id: user.id, email: user.email, role: user.role }),
    });
  } catch (error) {
    if (canUseDevAuthFallback(error)) {
      const input = authSchema.omit({ name: true }).parse(req.body);
      const user = await findDevUserByCredentials(input);

      if (!user) {
        next(new HttpError(401, "Invalid email or password"));
        return;
      }

      res.json({
        user: toPublicUser(user),
        token: signToken({ id: user.id, email: user.email, role: user.role }),
        mode: "development-fallback",
      });
      return;
    }

    next(error);
  }
});
