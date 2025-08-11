import os
import json
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from openai import AzureOpenAI
import requests

load_dotenv()

# Environment config
AZURE_ENDPOINT = os.getenv("ENDPOINT_URL")
AZURE_DEPLOYMENT = os.getenv("DEPLOYMENT_NAME")
AZURE_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")

if not AZURE_ENDPOINT or not AZURE_DEPLOYMENT or not AZURE_API_KEY:
    # We won't crash on import; requests will error later with clear messages
    pass

app = FastAPI(title="MTA Planner API", version="0.1.0")

# CORS (adjust in prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GroupInfo(BaseModel):
    total_persons: int = Field(..., ge=1)
    children: List[int] = Field(default_factory=list, description="Ages of children")
    seniors: List[int] = Field(default_factory=list, description="Ages of seniors")
    destination_hint: Optional[str] = Field(
        default=None, description="Optional destination, city, or country hint"
    )
    days: Optional[int] = Field(default=None, ge=1, description="Trip length in days")
    budget_level: Optional[str] = Field(
        default=None, description="low | medium | high"
    )


def search_perplexity(query: str) -> str:
    if not PERPLEXITY_API_KEY:
        raise HTTPException(status_code=500, detail="PERPLEXITY_API_KEY missing")
    url = "https://api.perplexity.ai/chat/completions"
    headers = {
        "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
        "Content-Type": "application/json",
    }
    data = {
        "model": "sonar",
        "messages": [{"role": "user", "content": query}],
    }
    try:
        r = requests.post(url, headers=headers, json=data, timeout=60)
        r.raise_for_status()
        result = r.json()
        if result and result.get("choices"):
            return result["choices"][0]["message"]["content"]
        return "No relevant search results found."
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Perplexity error: {exc}")


def get_azure_client() -> AzureOpenAI:
    if not (AZURE_ENDPOINT and AZURE_DEPLOYMENT and AZURE_API_KEY):
        raise HTTPException(status_code=500, detail="Azure OpenAI env vars missing")
    return AzureOpenAI(
        azure_endpoint=AZURE_ENDPOINT,
        api_key=AZURE_API_KEY,
        api_version="2024-05-01-preview",
    )


@app.post("/api/plan")
async def plan_trip(group: GroupInfo):
    # Build a precise query for Perplexity
    query_parts = [
        "Find family-friendly and senior-friendly travel suggestions with accessibility and kid activities as relevant.",
        f"Group size: {group.total_persons}.",
    ]
    if not group.children and not group.seniors:
        query_parts.append("No children or seniors; assume young adults only.")
    if group.children:
        query_parts.append(f"Children ages: {', '.join(map(str, group.children))}.")
    if group.seniors:
        query_parts.append(f"Seniors ages: {', '.join(map(str, group.seniors))}.")
    if group.destination_hint:
        query_parts.append(f"Destination hint: {group.destination_hint}.")
    if group.days:
        query_parts.append(f"Trip length: {group.days} days.")
    if group.budget_level:
        query_parts.append(f"Budget level: {group.budget_level}.")

    query_parts.append(
        "Return concise bullets of attractions, accommodations, transport tips, and meal suggestions with links where possible."
    )
    perplexity_query = " ".join(query_parts)

    web_context = search_perplexity(perplexity_query)

    # Let LLM synthesize a final plan
    client = get_azure_client()
    messages = [
        {
            "role": "system",
            "content": (
                "You are a travel planning assistant. Create a soothing, well-structured itinerary. "
                "Be considerate of children and seniors as provided. Include day-by-day plan, "
                "estimated pacing, accessibility notes, and links from provided web context."
            ),
        },
        {
            "role": "user",
            "content": json.dumps(
                {
                    "group": group.model_dump(),
                    "assumptions": (
                        "Assume young adults only (no kids/seniors)."
                        if not group.children and not group.seniors else ""
                    ),
                    "web_context": web_context,
                },
                ensure_ascii=False,
            ),
        },
    ]

    try:
        completion = client.chat.completions.create(
            model=AZURE_DEPLOYMENT,
            messages=messages,
            temperature=0.6,
            top_p=0.9,
            max_tokens=1200,
        )
        content = completion.choices[0].message.content
        return {"plan": content}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Azure OpenAI error: {exc}")


@app.get("/health")
async def health():
    return {"status": "ok"}
