import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { query } from "../../database/pool.js";

export const documentsRouter = Router();
documentsRouter.use(requireAuth);

const documentSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileUrl: z.string().url(),
});

documentsRouter.get("/", async (req, res, next) => {
  try {
    const result = await query("select * from documents where user_id = $1 order by created_at desc", [req.user!.id]);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

documentsRouter.post("/", async (req, res, next) => {
  try {
    const input = documentSchema.parse(req.body);
    const result = await query(
      "insert into documents (user_id, file_name, file_type, file_url, status) values ($1, $2, $3, $4, 'uploaded') returning *",
      [req.user!.id, input.fileName, input.fileType, input.fileUrl],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

