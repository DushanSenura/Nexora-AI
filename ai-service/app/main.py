from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.agents import router as agents_router
from app.api.chat import router as chat_router
from app.api.rag import router as rag_router
from app.api.search import router as search_router
from app.core.config import settings

app = FastAPI(title="Nexora AI Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-service"}


app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(chat_router, prefix="/ai/chat", tags=["chat"])
app.include_router(rag_router, prefix="/api/rag", tags=["rag"])
app.include_router(search_router, prefix="/api/search", tags=["search"])
app.include_router(agents_router, prefix="/api/agents", tags=["agents"])
