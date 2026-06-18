from fastapi import APIRouter
from pydantic import BaseModel

from app.services.vector_service import search_documents
from app.services.web_search_service import answer_with_web_search

router = APIRouter()


class SearchRequest(BaseModel):
    query: str
    limit: int = 5
    model: str | None = None


@router.post("")
async def search(payload: SearchRequest) -> dict[str, object]:
    results = await search_documents(payload.query, payload.limit)
    return {"results": results}


@router.post("/web")
async def web_search(payload: SearchRequest) -> dict[str, object]:
    return await answer_with_web_search(payload.query, payload.limit, payload.model)
