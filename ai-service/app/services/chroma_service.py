import hashlib
import json
from pathlib import Path
from typing import Any

from app.services.ollama_service import generate_chat_response

VECTOR_DIMENSIONS = 128
STORE_PATH = Path("data/document_vectors.json")


def create_embedding(text: str) -> list[float]:
    vector = [0.0] * VECTOR_DIMENSIONS
    words = text.lower().split()
    for word in words:
        digest = hashlib.sha256(word.encode("utf-8")).digest()
        index = int.from_bytes(digest[:2], "big") % VECTOR_DIMENSIONS
        vector[index] += 1.0

    magnitude = sum(value * value for value in vector) ** 0.5
    if magnitude == 0:
        return vector
    return [value / magnitude for value in vector]


def _cosine_similarity(left: list[float], right: list[float]) -> float:
    return sum(a * b for a, b in zip(left, right))


def _read_fallback_store() -> dict[str, Any]:
    if not STORE_PATH.exists():
        return {"chunks": []}
    return json.loads(STORE_PATH.read_text(encoding="utf-8"))


def _write_fallback_store(store: dict[str, Any]) -> None:
    STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STORE_PATH.write_text(json.dumps(store, indent=2), encoding="utf-8")


def _get_chroma_collection():
    try:
        import chromadb

        client = chromadb.PersistentClient(path="data/chroma")
        return client.get_or_create_collection(name="nexora_document_chunks")
    except Exception:
        return None


def store_document_chunks(document_id: str, chunks: list[str], file_name: str) -> None:
    collection = _get_chroma_collection()
    ids = [f"{document_id}:{index}" for index in range(len(chunks))]
    embeddings = [create_embedding(chunk) for chunk in chunks]
    metadatas = [
        {"document_id": document_id, "chunk_index": index, "file_name": file_name}
        for index in range(len(chunks))
    ]

    if collection is not None and chunks:
        collection.upsert(ids=ids, documents=chunks, embeddings=embeddings, metadatas=metadatas)
        return

    store = _read_fallback_store()
    store["chunks"] = [
        item for item in store["chunks"] if item.get("document_id") != document_id
    ]
    for index, chunk in enumerate(chunks):
        store["chunks"].append(
            {
                "id": ids[index],
                "document_id": document_id,
                "chunk_index": index,
                "file_name": file_name,
                "text": chunk,
                "embedding": embeddings[index],
            }
        )
    _write_fallback_store(store)


def retrieve_relevant_chunks(document_id: str, question: str, limit: int = 4) -> list[dict[str, Any]]:
    query_embedding = create_embedding(question)
    collection = _get_chroma_collection()

    if collection is not None:
        result = collection.query(
            query_embeddings=[query_embedding],
            n_results=limit,
            where={"document_id": document_id},
        )
        documents = result.get("documents", [[]])[0]
        metadatas = result.get("metadatas", [[]])[0]
        distances = result.get("distances", [[]])[0]
        return [
            {
                "text": text,
                "document_id": metadata.get("document_id"),
                "chunk_index": metadata.get("chunk_index"),
                "file_name": metadata.get("file_name"),
                "score": 1 - distance if isinstance(distance, (int, float)) else None,
            }
            for text, metadata, distance in zip(documents, metadatas, distances)
        ]

    store = _read_fallback_store()
    candidates = [
        item for item in store["chunks"] if item.get("document_id") == document_id
    ]
    ranked = sorted(
        candidates,
        key=lambda item: _cosine_similarity(query_embedding, item["embedding"]),
        reverse=True,
    )
    return [
        {
            "text": item["text"],
            "document_id": item["document_id"],
            "chunk_index": item["chunk_index"],
            "file_name": item["file_name"],
            "score": _cosine_similarity(query_embedding, item["embedding"]),
        }
        for item in ranked[:limit]
    ]


async def answer_from_document(document_id: str, question: str, model: str | None = None) -> dict[str, Any]:
    chunks = retrieve_relevant_chunks(document_id, question)
    if not chunks:
        return {
            "answer": "I could not find relevant context in this document.",
            "references": [],
        }

    context = "\n\n".join(
        f"[Chunk {chunk['chunk_index']}] {chunk['text']}" for chunk in chunks
    )
    prompt = (
        "Answer the question using only the document context below. "
        "If the answer is not in the context, say you could not find it in the document. "
        "Cite chunk numbers in the answer when useful.\n\n"
        f"Question: {question}\n\nDocument context:\n{context}"
    )
    answer, _selected_model = await generate_chat_response(prompt, model)
    references = [
        {
            "document_id": chunk["document_id"],
            "chunk_index": chunk["chunk_index"],
            "file_name": chunk["file_name"],
            "text": chunk["text"][:500],
            "score": chunk["score"],
        }
        for chunk in chunks
    ]
    return {"answer": answer, "references": references}

