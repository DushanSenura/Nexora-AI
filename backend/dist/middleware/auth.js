import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
export function requireAuth(req, _res, next) {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) {
        next(new HttpError(401, "Authentication required"));
        return;
    }
    try {
        req.user = jwt.verify(token, env.JWT_SECRET);
        next();
    }
    catch {
        next(new HttpError(401, "Invalid or expired token"));
    }
}
export function requireAdmin(req, _res, next) {
    if (req.user?.role !== "admin") {
        next(new HttpError(403, "Admin access required"));
        return;
    }
    next();
}
