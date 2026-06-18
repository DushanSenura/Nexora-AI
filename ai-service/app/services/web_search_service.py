from html import unescape
import re
from urllib.parse import parse_qs, unquote, urlparse

import httpx

from app.services.ollama_service import generate_chat_response


def _strip_tags(value: str) -> str:
    without_tags = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", unescape(without_tags)).strip()


def _clean_duckduckgo_url(value: str) -> str:
    parsed = urlparse(unescape(value))
    query = parse_qs(parsed.query)
    if "uddg" in query and query["uddg"]:
        return unquote(query["uddg"][0])
    return unescape(value)


async def search_web(query: str, limit: int = 5) -> list[dict[str, str]]:
    params = {"q": query}
    headers = {"User-Agent": "NexoraAI/0.1"}

    async with httpx.AsyncClient(timeout=20, follow_redirects=True, headers=headers) as client:
        response = await client.get("https://duckduckgo.com/html/", params=params)
        response.raise_for_status()

    html = response.text
    pattern = re.compile(
        r'<a rel="nofollow" class="result__a" href="(?P<url>.*?)".*?>(?P<title>.*?)</a>.*?'
        r'<a class="result__snippet".*?>(?P<snippet>.*?)</a>',
        re.DOTALL,
    )
    results: list[dict[str, str]] = []

    for match in pattern.finditer(html):
        title = _strip_tags(match.group("title"))
        snippet = _strip_tags(match.group("snippet"))
        url = _clean_duckduckgo_url(match.group("url"))
        if title and url:
            results.append({"title": title, "url": url, "snippet": snippet})
        if len(results) >= limit:
            break

    return results


async def answer_with_web_search(question: str, limit: int = 5, model: str | None = None) -> dict[str, object]:
    sources = await search_web(question, limit)
    if not sources:
        return {
            "answer": "I could not find web search results for that question. Try a more specific query.",
            "sources": [],
        }

    source_text = "\n".join(
        f"{index + 1}. {source['title']}\nURL: {source['url']}\nSnippet: {source['snippet']}"
        for index, source in enumerate(sources)
    )
    prompt = (
        "Answer the user's question using only the web search results below. "
        "Be concise, mention uncertainty when results are incomplete, and do not invent facts.\n\n"
        f"Question: {question}\n\nSearch results:\n{source_text}"
    )
    answer, _model = await generate_chat_response(prompt, model)
    return {"answer": answer, "sources": sources}

