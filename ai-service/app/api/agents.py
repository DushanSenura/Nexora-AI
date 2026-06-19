from fastapi import APIRouter
from pydantic import BaseModel

from app.agents.runner import run_agent

router = APIRouter()


class AgentRunRequest(BaseModel):
    input: str


async def _run(agent_type: str, payload: AgentRunRequest) -> dict[str, str]:
    output = await run_agent(agent_type, payload.input)
    return {"agent_type": agent_type, "output": output}


@router.post("/research")
async def research(payload: AgentRunRequest) -> dict[str, str]:
    return await _run("research", payload)


@router.post("/coding")
async def coding(payload: AgentRunRequest) -> dict[str, str]:
    return await _run("coding", payload)


@router.post("/image-generater")
async def image_generater(payload: AgentRunRequest) -> dict[str, str]:
    return await _run("image-generater", payload)


class LegacyAgentRunRequest(BaseModel):
    agentType: str
    input: str


@router.post("/run")
async def run(payload: LegacyAgentRunRequest) -> dict[str, str]:
    output = await run_agent(payload.agentType, payload.input)
    return {"agent_type": payload.agentType, "output": output}

