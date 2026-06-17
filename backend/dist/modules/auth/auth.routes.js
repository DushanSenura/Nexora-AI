import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../../config/env.js";
import { query } from "../../database/pool.js";
import { HttpError } from "../../utils/httpError.js";
export const authRouter = Router();
const authSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email(),
    password: z.string().min(8),
});
function signToken(user) {
    const options = {
        expiresIn: env.JWT_EXPIRES_IN,
    };
    return jwt.sign(user, env.JWT_SECRET, options);
}
authRouter.post("/register", async (req, res, next) => {
    try {
        const input = authSchema.required({ name: true }).parse(req.body);
        const passwordHash = await bcrypt.hash(input.password, 12);
        const result = await query("insert into users (name, email, password_hash) values ($1, $2, $3) returning id, name, email, role, created_at", [input.name, input.email, passwordHash]);
        const user = result.rows[0];
        res.status(201).json({ user, token: signToken({ id: user.id, email: user.email, role: user.role }) });
    }
    catch (error) {
        if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
            next(new HttpError(409, "An account with this email already exists"));
            return;
        }
        next(error);
    }
});
authRouter.post("/login", async (req, res, next) => {
    try {
        const input = authSchema.omit({ name: true }).parse(req.body);
        const result = await query("select id, name, email, password_hash, role, created_at from users where email = $1", [input.email]);
        const user = result.rows[0];
        if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
            throw new HttpError(401, "Invalid email or password");
        }
        res.json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at },
            token: signToken({ id: user.id, email: user.email, role: user.role }),
        });
    }
    catch (error) {
        next(error);
    }
});
