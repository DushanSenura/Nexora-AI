from typing import Any


async def search_documents(query: str, limit: int = 5) -> list[dict[str, Any]]:
    return [
        {
            "id": f"placeholder-{index + 1}",
            "score": round(0.92 - index * 0.07, 2),
            "text": f"Vector search placeholder result for '{query}'.",
        }
        for index in range(max(0, min(limit, 10)))
    ]

