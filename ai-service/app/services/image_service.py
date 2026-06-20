import re

import httpx

from app.core.config import settings


IMAGE_REQUEST_PATTERNS = (
    re.compile(r"\b(?:create|generate|make|draw|design)\s+(?:an?\s+|the\s+)?(?:image|picture|illustration|logo|poster|banner|artwork|graphic)\b", re.IGNORECASE),
    re.compile(r"\bdraw\b", re.IGNORECASE),
    re.compile(r"\bvisuali[sz]e\b", re.IGNORECASE),
    re.compile(r"\b(?:image|picture|illustration|logo|poster|banner)\s+(?:of|for|showing)\b", re.IGNORECASE),
)


def is_image_request(message: str) -> bool:
    return any(pattern.search(message) for pattern in IMAGE_REQUEST_PATTERNS)


async def generate_image(prompt: str) -> tuple[str, str]:
    payload = {
        "prompt": prompt,
        "steps": settings.image_generation_steps,
        "width": settings.image_generation_width,
        "height": settings.image_generation_height,
    }

    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(
            f"{settings.image_generation_base_url.rstrip('/')}/sdapi/v1/txt2img",
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

    images = data.get("images") or []
    if not images:
        raise ValueError("The image service returned no images")

    encoded_image = images[0]
    image_url = encoded_image if encoded_image.startswith("data:") else f"data:image/png;base64,{encoded_image}"
    return image_url, "stable-diffusion"
