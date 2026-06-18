import { mkdir, readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import axios from "axios";
import { Router } from "express";
import multer from "multer";
import { env } from "../../config/env.js";
import { query } from "../../database/pool.js";
import { requireAuth } from "../../middleware/auth.js";
import { HttpError } from "../../utils/httpError.js";
import { canUseDevAuthFallback } from "../auth/devAuthStore.js";
import { createDevDocument, deleteDevDocument, listDevDocuments } from "./devDocumentStore.js";

export const documentsRouter = Router();
documentsRouter.use(requireAuth);

const uploadRoot = join(process.cwd(), "uploads", "documents");
const maxFileSize = 10 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const allowedExtensions = new Set([".pdf", ".txt", ".docx"]);

function getExtension(filename: string) {
  const index = filename.lastIndexOf(".");
  return index >= 0 ? filename.slice(index).toLowerCase() : "";
}

function isAllowedFile(file: Express.Multer.File) {
  return allowedMimeTypes.has(file.mimetype) && allowedExtensions.has(getExtension(file.originalname));
}

const upload = multer({
  storage: multer.diskStorage({
    async destination(_req, _file, callback) {
      await mkdir(uploadRoot, { recursive: true });
      callback(null, uploadRoot);
    },
    filename(_req, file, callback) {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-");
      callback(null, `${Date.now()}-${safeName}`);
    },
  }),
  limits: { fileSize: maxFileSize },
  fileFilter(_req, file, callback) {
    if (!isAllowedFile(file)) {
      callback(new HttpError(400, "Only PDF, TXT, and DOCX files are supported"));
      return;
    }
    callback(null, true);
  },
});

async function processWithAiService(file: Express.Multer.File) {
  const form = new FormData();
  const blob = new Blob([await readFile(file.path)], {
    type: file.mimetype,
  });
  form.append("file", blob, file.originalname);

  const response = await axios.post(`${env.AI_SERVICE_URL}/ai/documents/process`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
  return response.data as { chunk_count?: number; character_count?: number };
}

documentsRouter.get("/", async (req, res, next) => {
  try {
    const result = await query("select * from documents where user_id = $1 order by created_at desc", [req.user!.id]);
    res.json(result.rows);
  } catch (error) {
    if (canUseDevAuthFallback(error)) {
      res.json(await listDevDocuments(req.user!.id));
      return;
    }
    next(error);
  }
});

documentsRouter.post("/upload", upload.single("file"), async (req, res, next) => {
  const file = req.file;
  if (!file) {
    next(new HttpError(400, "File is required"));
    return;
  }

  const fileUrl = `/uploads/documents/${file.filename}`;

  try {
    const aiResult = await processWithAiService(file);
    const result = await query(
      "insert into documents (user_id, file_name, file_type, file_url, status) values ($1, $2, $3, $4, 'ready') returning *",
      [req.user!.id, file.originalname, file.mimetype, fileUrl],
    );

    res.status(201).json({
      ...result.rows[0],
      file_size: file.size,
      chunk_count: aiResult.chunk_count ?? 0,
      extracted_chars: aiResult.character_count ?? 0,
    });
  } catch (error) {
    if (canUseDevAuthFallback(error)) {
      try {
        const aiResult = await processWithAiService(file);
        const document = await createDevDocument({
          user_id: req.user!.id,
          file_name: file.originalname,
          file_type: file.mimetype,
          file_url: fileUrl,
          status: "ready",
          file_size: file.size,
          chunk_count: aiResult.chunk_count ?? 0,
          extracted_chars: aiResult.character_count ?? 0,
        });
        res.status(201).json(document);
        return;
      } catch (aiError) {
        const document = await createDevDocument({
          user_id: req.user!.id,
          file_name: file.originalname,
          file_type: file.mimetype,
          file_url: fileUrl,
          status: "failed",
          file_size: file.size,
        });
        res.status(502).json({ message: "Document uploaded, but processing failed", document });
        return;
      }
    }
    next(error);
  }
});

documentsRouter.delete("/:documentId", async (req, res, next) => {
  try {
    const result = await query("delete from documents where id = $1 and user_id = $2 returning file_url", [
      req.params.documentId,
      req.user!.id,
    ]);
    if (!result.rows[0]) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    await unlink(join(process.cwd(), result.rows[0].file_url.replace(/^\//, ""))).catch(() => undefined);
    res.status(204).send();
  } catch (error) {
    if (canUseDevAuthFallback(error)) {
      const document = await deleteDevDocument(req.user!.id, req.params.documentId);
      if (!document) {
        res.status(404).json({ message: "Document not found" });
        return;
      }
      await unlink(join(process.cwd(), document.file_url.replace(/^\//, ""))).catch(() => undefined);
      res.status(204).send();
      return;
    }
    next(error);
  }
});
