from app.services.ollama_service import generate_chat_response


AGENT_PROMPTS = {
    "research": (
        "Act as a research agent. Return a concise research brief with key findings, "
        "assumptions, suggested sources to verify, and next research steps."
    ),
    "coding": (
        "Act as a coding helper agent. Return a practical implementation plan, likely files to edit, "
        "risks, tests to run, and concise example code when useful."
    ),
    "image-generater": (
        "Act as an image generation agent. Convert the user request into a polished image prompt. "
        "Include subject, style, composition, lighting, colors, and negative prompt guidance."
    ),
    "study-planner": "Act as a study planner. Return a practical schedule with milestones.",
}


async def run_agent(agent_type: str, user_input: str) -> str:
    system_prompt = AGENT_PROMPTS.get(agent_type, "Act as a general AI task agent.")
    answer, _model = await generate_chat_response(f"{system_prompt}\n\nTask: {user_input}")
    return answer
