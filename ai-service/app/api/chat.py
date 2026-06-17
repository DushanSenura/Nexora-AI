from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.ollama_service import generate_chat_response

router = APIRouter()


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    model: str | None = None


class ChatResponse(BaseModel):
    response: str
    model: str


@router.post("", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    response, model = await generate_chat_response(payload.message, payload.model)
    return ChatResponse(response=response, model=model)

