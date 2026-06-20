import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.ollama_service import generate_chat_response
from app.services.image_service import generate_image, is_image_request

router = APIRouter()


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    model: str | None = None


class ChatResponse(BaseModel):
    response: str
    model: str
    content_type: str = "text"
    image_url: str | None = None


@router.post("", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    if is_image_request(payload.message):
        try:
            image_url, model = await generate_image(payload.message)
        except (httpx.HTTPError, ValueError) as error:
            raise HTTPException(
                status_code=503,
                detail="Image generation is unavailable. Start Stable Diffusion WebUI with --api and try again.",
            ) from error
        return ChatResponse(
            response="Generated image",
            model=model,
            content_type="image",
            image_url=image_url,
        )

    response, model = await generate_chat_response(payload.message, payload.model)
    return ChatResponse(response=response, model=model)
