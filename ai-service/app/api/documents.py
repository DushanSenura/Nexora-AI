from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.document_processing_service import process_document

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx"}


def _extension(filename: str) -> str:
    return "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


@router.post("/process")
async def process_upload(file: UploadFile = File(...)) -> dict[str, object]:
    extension = _extension(file.filename or "")
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    content = await file.read()
    try:
        result = process_document(file.filename or "document", content)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Unable to extract document text: {error}") from error

    return {
        "file_name": file.filename,
        "file_type": file.content_type,
        **result,
    }

