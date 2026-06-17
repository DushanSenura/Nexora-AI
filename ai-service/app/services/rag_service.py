from app.services.ollama_service import generate_chat_response


async def answer_with_context(question: str, document_ids: list[str]) -> str:
    context_hint = ", ".join(document_ids) if document_ids else "the available document collection"
    prompt = f"Answer using {context_hint}. Question: {question}"
    answer, _model = await generate_chat_response(prompt)
    return answer

