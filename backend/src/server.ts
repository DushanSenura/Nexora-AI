import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { chatsRouter } from "./modules/chats/chats.routes.js";
import { messagesRouter } from "./modules/messages/messages.routes.js";
import { documentsRouter } from "./modules/documents/documents.routes.js";
import { agentsRouter } from "./modules/agents/agents.routes.js";
import { analyticsRouter } from "./modules/analytics/analytics.routes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "backend" });
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/chats", chatsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/agents", agentsRouter);
app.use("/api/analytics", analyticsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.BACKEND_PORT, () => {
  console.log(`Backend API listening on port ${env.BACKEND_PORT}`);
});
