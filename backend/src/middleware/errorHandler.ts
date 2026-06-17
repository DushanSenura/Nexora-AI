import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({ message: error.errors[0]?.message ?? "Invalid request" });
    return;
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    if (error.code === "28P01") {
      res.status(503).json({
        message: "Database login failed. Check DATABASE_URL in your .env file and restart the backend.",
      });
      return;
    }

    if (error.code === "3D000") {
      res.status(503).json({
        message: "Database not found. Create the configured PostgreSQL database or update DATABASE_URL.",
      });
      return;
    }

    if (error.code === "42P01") {
      res.status(503).json({
        message: "Database tables are missing. Run database/schema.sql before creating an account.",
      });
      return;
    }
  }

  console.error(error);
  res.status(500).json({ message: "Internal server error" });
};
