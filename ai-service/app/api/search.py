from fastapi import APIRouter
from pydantic import BaseModel

from app.services.vector_service import search_documents

router = APIRouter()


class SearchRequest(BaseModel):
    query: str
    limit: int = 5


@router.post("")
async def search(payload: SearchRequest) -> dict[str, object]:
    results = await search_documents(payload.query, payload.limit)
    return {"results": results}

