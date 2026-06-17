from fastapi import APIRouter
from pydantic import BaseModel

from app.agents.runner import run_agent

router = APIRouter()


class AgentRunRequest(BaseModel):
    agentType: str
    input: str


@router.post("/run")
async def run(payload: AgentRunRequest) -> dict[str, str]:
    output = await run_agent(payload.agentType, payload.input)
    return {"output": output}

