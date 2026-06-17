import httpx

from app.core.config import settings


async def generate_chat_response(message: str, model: str | None = None) -> tuple[str, str]:
    selected_model = model or settings.ollama_model
    payload = {
        "model": selected_model,
        "messages": [{"role": "user", "content": message}],
        "stream": False,
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(f"{settings.ollama_base_url}/api/chat", json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("message", {}).get("content", ""), selected_model
    except httpx.HTTPError:
        return (
            "Ollama is not reachable yet. Start Ollama locally or update OLLAMA_BASE_URL, then retry this prompt.",
            selected_model,
        )

