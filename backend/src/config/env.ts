import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: "../.env" });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  BACKEND_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default("postgresql://nexora:nexora_password@localhost:5432/nexora_ai"),
  JWT_SECRET: z.string().default("replace-with-a-long-random-secret"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  AI_SERVICE_URL: z.string().default("http://localhost:8000"),
});

export const env = envSchema.parse(process.env);
