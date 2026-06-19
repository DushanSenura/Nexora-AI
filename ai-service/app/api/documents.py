from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.services.document_processing_service import process_document
from app.services.chroma_service import answer_from_document, store_document_chunks

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx"}


def _extension(filename: str) -> str:
    return "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


@router.post("/process")
async def process_upload(document_id: str = Form(...), file: UploadFile = File(...)) -> dict[str, object]:
    extension = _extension(file.filename or "")
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    content = await file.read()
    try:
        result = process_document(file.filename or "document", content)
        store_document_chunks(document_id, result["chunks"], file.filename or "document")
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Unable to extract document text: {error}") from error

    return {
        "file_name": file.filename,
        "file_type": file.content_type,
        **result,
    }


class DocumentAskRequest(BaseModel):
    document_id: str
    question: str
    model: str | None = None


@router.post("/ask")
async def ask_document(payload: DocumentAskRequest) -> dict[str, object]:
    return await answer_from_document(payload.document_id, payload.question, payload.model)
