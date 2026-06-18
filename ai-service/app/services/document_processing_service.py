import re
from io import BytesIO


def clean_text(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def split_text(text: str, chunk_size: int = 1200, overlap: int = 160) -> list[str]:
    if not text:
        return []

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end].strip())
        if end == len(text):
            break
        start = max(0, end - overlap)
    return [chunk for chunk in chunks if chunk]


def extract_txt(content: bytes) -> str:
    return content.decode("utf-8", errors="ignore")


def extract_pdf(content: bytes) -> str:
    from pypdf import PdfReader

    reader = PdfReader(BytesIO(content))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n\n".join(pages)


def extract_docx(content: bytes) -> str:
    from docx import Document

    document = Document(BytesIO(content))
    return "\n".join(paragraph.text for paragraph in document.paragraphs)


def extract_text(filename: str, content: bytes) -> str:
    lower_name = filename.lower()
    if lower_name.endswith(".txt"):
        return extract_txt(content)
    if lower_name.endswith(".pdf"):
        return extract_pdf(content)
    if lower_name.endswith(".docx"):
        return extract_docx(content)
    raise ValueError("Unsupported document type")


def process_document(filename: str, content: bytes) -> dict[str, object]:
    raw_text = extract_text(filename, content)
    text = clean_text(raw_text)
    chunks = split_text(text)
    return {
        "text": text,
        "chunks": chunks,
        "chunk_count": len(chunks),
        "character_count": len(text),
    }

