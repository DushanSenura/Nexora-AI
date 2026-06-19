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
import {
  appendDevDocumentQa,
  createDevDocument,
  deleteDevDocument,
  getDevDocument,
  listDevDocumentMessages,
  listDevDocuments,
  updateDevDocument,
} from "./devDocumentStore.js";

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

async function processWithAiService(file: Express.Multer.File, documentId: string) {
  const form = new FormData();
  const blob = new Blob([await readFile(file.path)], {
    type: file.mimetype,
  });
  form.append("file", blob, file.originalname);
  form.append("document_id", documentId);

  const response = await axios.post(`${env.AI_SERVICE_URL}/ai/documents/process`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
  return response.data as { chunk_count?: number; character_count?: number };
}

async function askDocumentWithAiService(documentId: string, question: string) {
  const response = await axios.post(`${env.AI_SERVICE_URL}/ai/documents/ask`, {
    document_id: documentId,
    question,
    model: "llama3.2",
  });
  return response.data as {
    answer: string;
    references: Array<{ chunk_index: number; text: string; score?: number; file_name?: string }>;
  };
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
    const inserted = await query(
      "insert into documents (user_id, file_name, file_type, file_url, status) values ($1, $2, $3, $4, 'processing') returning *",
      [req.user!.id, file.originalname, file.mimetype, fileUrl],
    );
    const aiResult = await processWithAiService(file, inserted.rows[0].id);
    const result = await query("update documents set status = 'ready' where id = $1 returning *", [inserted.rows[0].id]);

    res.status(201).json({
      ...result.rows[0],
      file_size: file.size,
      chunk_count: aiResult.chunk_count ?? 0,
      extracted_chars: aiResult.character_count ?? 0,
    });
  } catch (error) {
    if (canUseDevAuthFallback(error)) {
      try {
        const document = await createDevDocument({
          user_id: req.user!.id,
          file_name: file.originalname,
          file_type: file.mimetype,
          file_url: fileUrl,
          status: "processing",
          file_size: file.size,
        });
        const aiResult = await processWithAiService(file, document.id);
        const readyDocument = await updateDevDocument(req.user!.id, document.id, {
          status: "ready",
          chunk_count: aiResult.chunk_count ?? 0,
          extracted_chars: aiResult.character_count ?? 0,
        });
        res.status(201).json(readyDocument);
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

documentsRouter.get("/:documentId/chat", async (req, res, next) => {
  try {
    const document = await query("select id from documents where id = $1 and user_id = $2", [
      req.params.documentId,
      req.user!.id,
    ]);
    if (!document.rows[0]) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    const result = await query(
      "select id, document_id, user_id, role, content, chunk_references as references, created_at from document_messages where document_id = $1 and user_id = $2 order by created_at asc",
      [req.params.documentId, req.user!.id],
    );
    res.json(result.rows);
  } catch (error) {
    if (canUseDevAuthFallback(error)) {
      const messages = await listDevDocumentMessages(req.user!.id, req.params.documentId);
      if (!messages) {
        res.status(404).json({ message: "Document not found" });
        return;
      }
      res.json(messages);
      return;
    }
    next(error);
  }
});

documentsRouter.post("/:documentId/chat", async (req, res, next) => {
  const question = String(req.body?.question ?? "").trim();
  if (!question) {
    next(new HttpError(400, "Question is required"));
    return;
  }

  try {
    const document = await query("select id from documents where id = $1 and user_id = $2 and status = 'ready'", [
      req.params.documentId,
      req.user!.id,
    ]);
    if (!document.rows[0]) {
      res.status(404).json({ message: "Ready document not found" });
      return;
    }

    const aiResult = await askDocumentWithAiService(req.params.documentId, question);
    const userMessage = await query(
      "insert into document_messages (document_id, user_id, role, content) values ($1, $2, 'user', $3) returning id, document_id, user_id, role, content, chunk_references as references, created_at",
      [req.params.documentId, req.user!.id, question],
    );
    const assistantMessage = await query(
      "insert into document_messages (document_id, user_id, role, content, chunk_references) values ($1, $2, 'assistant', $3, $4::jsonb) returning id, document_id, user_id, role, content, chunk_references as references, created_at",
      [req.params.documentId, req.user!.id, aiResult.answer, JSON.stringify(aiResult.references ?? [])],
    );

    res.status(201).json({ userMessage: userMessage.rows[0], assistantMessage: assistantMessage.rows[0] });
  } catch (error) {
    if (canUseDevAuthFallback(error)) {
      const document = await getDevDocument(req.user!.id, req.params.documentId);
      if (!document || document.status !== "ready") {
        res.status(404).json({ message: "Ready document not found" });
        return;
      }

      try {
        const aiResult = await askDocumentWithAiService(req.params.documentId, question);
        const saved = await appendDevDocumentQa({
          userId: req.user!.id,
          documentId: req.params.documentId,
          question,
          answer: aiResult.answer,
          references: aiResult.references ?? [],
        });
        res.status(201).json(saved);
        return;
      } catch (aiError) {
        if (axios.isAxiosError(aiError)) {
          next(new HttpError(502, "AI document service is unavailable"));
          return;
        }
        next(aiError);
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
