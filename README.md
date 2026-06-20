# Nexora AI

Nexora AI is a full-stack AI workspace with chat, document management, agent workflows, usage tracking, and admin dashboards.

## Stack

- Frontend: React, TypeScript, Tailwind CSS, ShadCN-style UI, Axios, TanStack Query
- Backend: Node.js, Express, TypeScript, JWT authentication, PostgreSQL
- AI service: Python, FastAPI, LangChain-ready service layer, Ollama-compatible chat endpoint
- Vector database: Qdrant by default, with room to swap ChromaDB

## Project Structure

```text
nexora-ai/
├── frontend/
├── backend/
├── ai-service/
├── database/
├── docker-compose.yml
├── .env.example
└── README.md
```

## Local Development

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Start infrastructure:

```bash
docker compose up postgres qdrant -d
```

3. Install and run each app:

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
cd ai-service && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000
```

Or run the whole stack with Docker:

```bash
docker compose up --build
```

## Local Image Generation

Image requests such as `Create a logo` are routed to a separate Stable Diffusion WebUI (Automatic1111) API. Start WebUI with API access enabled:

```bash
webui-user.bat --api
```

The default endpoint is `http://localhost:7860`. Override `IMAGE_GENERATION_BASE_URL` and the image dimensions in `.env` when needed. For an existing PostgreSQL database, apply the image message migration before sending image prompts:

```bash
psql "$DATABASE_URL" -f database/migrations/006_add_message_image_fields.sql
```

## Default Ports

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- AI service: http://localhost:8000
- PostgreSQL: localhost:5432
- Qdrant: http://localhost:6333
