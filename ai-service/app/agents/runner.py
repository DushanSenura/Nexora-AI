from app.services.ollama_service import generate_chat_response


AGENT_PROMPTS = {
    "research": "Act as a research agent. Return a concise research brief with sources to verify.",
    "coding": "Act as a coding agent. Return implementation steps, risks, and example code when useful.",
    "study-planner": "Act as a study planner. Return a practical schedule with milestones.",
}


async def run_agent(agent_type: str, user_input: str) -> str:
    system_prompt = AGENT_PROMPTS.get(agent_type, "Act as a general AI task agent.")
    answer, _model = await generate_chat_response(f"{system_prompt}\n\nTask: {user_input}")
    return answer

