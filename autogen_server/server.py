"""
AutoGen Multi-Agent Sidecar
FastAPI server running two AutoGen agents in a RoundRobinGroupChat.
Agents have a real back-and-forth conversation about the user's query.
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_agentchat.conditions import MaxMessageTermination
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_ext.models.openai import _openai_client as _oai_mod
from autogen_core.models import RequestUsage

# ---------- Monkey-patch: Abacus RouteLLM returns None for usage tokens ----------
_orig_add_usage = _oai_mod._add_usage


def _safe_add_usage(u1: RequestUsage, u2: RequestUsage) -> RequestUsage:
    """Handle None token counts returned by non-OpenAI endpoints."""
    return RequestUsage(
        prompt_tokens=(u1.prompt_tokens or 0) + (u2.prompt_tokens or 0),
        completion_tokens=(u1.completion_tokens or 0) + (u2.completion_tokens or 0),
    )


_oai_mod._add_usage = _safe_add_usage
# ---------------------------------------------------------------------------------

# Load .env from parent directory (shared with Next.js)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

app = FastAPI(title="AutoGen Multi-Agent Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


def get_model_client() -> OpenAIChatCompletionClient:
    return OpenAIChatCompletionClient(
        model="route-llm",
        base_url=os.environ.get("ABACUS_BASE_URL", "https://routellm.abacus.ai/v1"),
        api_key=os.environ["ABACUS_API_KEY"],
        model_info={
            "vision": False,
            "function_calling": True,
            "json_output": True,
            "family": "unknown",
            "structured_output": True,
        },
    )


class ChatRequest(BaseModel):
    query: str
    max_rounds: int = 8


class AgentMsg(BaseModel):
    agent: str
    content: str


class ChatResponse(BaseModel):
    messages: list[AgentMsg]


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    model_client = get_model_client()

    analyst = AssistantAgent(
        "Analyst",
        model_client=model_client,
        system_message=(
            "You are an Analyst. Given a topic, provide thorough, structured analysis "
            "with evidence and multiple perspectives. Respond to the Critic's feedback "
            "by refining your analysis. Be concise but comprehensive."
        ),
    )

    critic = AssistantAgent(
        "Critic",
        model_client=model_client,
        system_message=(
            "You are a Critic. Review the Analyst's work and provide constructive feedback. "
            "Challenge assumptions, point out gaps, and ask probing questions. "
            "When the analysis is thorough enough, say 'I'm satisfied with this analysis' "
            "to indicate completion."
        ),
    )

    termination = MaxMessageTermination(max_messages=req.max_rounds)
    team = RoundRobinGroupChat(
        [analyst, critic],
        termination_condition=termination,
    )

    messages: list[AgentMsg] = []

    result = await team.run(task=req.query)

    for msg in result.messages:
        if msg.source == "user":
            continue
        content = msg.content if isinstance(msg.content, str) else str(msg.content)
        if content.strip():
            messages.append(AgentMsg(agent=msg.source, content=content))

    return ChatResponse(messages=messages)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8100, log_level="info")
