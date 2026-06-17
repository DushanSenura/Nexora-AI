from fastapi import APIRouter
from pydantic import BaseModel

from app.services.rag_service import answer_with_context

router = APIRouter()


class RagRequest(BaseModel):
    question: str
    document_ids: list[str] = []


@router.post("/ask")
async def ask(payload: RagRequest) -> dict[str, object]:
    answer = await answer_with_context(payload.question, payload.document_ids)
    return {"answer": answer, "sources": payload.document_ids}

