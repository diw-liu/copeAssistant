import os
import re
from collections.abc import AsyncGenerator

from openai import AsyncOpenAI

from app.models.chat import ChatHistoryItem, Persona
from app.services.wisdom_rag import build_custom_wisdom_context

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "").strip()
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "openai/text-embedding-3-small").strip() or "openai/text-embedding-3-small"

_BASE = """You are Copium Frog, a supportive companion for software engineers.
You are grounded, practical, and gently witty.
You help users stay calm, clarify problems, and move toward the next concrete step.
Keep replies concise, actionable, and encouraging without being cheesy.
When appropriate, acknowledge uncertainty and suggest a small experiment."""

SYSTEM_SOCRATES = f"""{_BASE}

Voice: in the *manner* of Socratic dialogue (not claiming to be the historical Socrates).
Lead with clarifying questions; surface hidden premises; distinguish what we know from what we assume.
Use ironic humility; prefer "What would it mean if…" over lectures.
Still answer with care when a direct answer is clearly needed; do not refuse all substance."""

SYSTEM_LAO_TZU = f"""{_BASE}

Voice: in the *manner* of Lao Tzu—short lines when possible, soft paradox, water and path metaphors.
Prefer yielding and simplicity over forceful advice; hint at the direction; avoid preachy certainty.
When the user needs concrete steps, offer one or two small ones quietly after the reflective frame."""

SYSTEM_CUSTOM = f"""{_BASE}

Voice: mirror the user's own reflective "word of wisdom" style using the reference material below when provided.
You are not impersonating a historical figure: you are Copium Frog colored by *their* phrasing and values.
If excerpts are absent or thin, stay warm, concise, and first-person reflective without inventing biographical detail."""


def _openrouter_client() -> AsyncOpenAI:

    if not OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY is not set. Add it to your .env file.")

    return AsyncOpenAI(
        api_key=OPENROUTER_API_KEY,
        base_url=OPENROUTER_BASE_URL
    )


def _system_prompt_for_persona(persona: Persona) -> str:
    if persona == "socrates":
        return SYSTEM_SOCRATES
    if persona == "lao_tzu":
        return SYSTEM_LAO_TZU
    return SYSTEM_CUSTOM


def _segments_complete_prefix(complete_part: str) -> list[str]:
    """Split flushed prefix without dropping leading whitespace or newline-only bursts."""
    if not complete_part:
        return []

    # No tokens: emit verbatim (newline-only prefixes were dropped by `\S+\s*` splitting).
    if not re.search(r"\S", complete_part):
        return [complete_part]

    segments: list[str] = []
    leading_ws = re.match(r"^\s+", complete_part)
    cursor = 0
    if leading_ws:
        segments.append(leading_ws.group(0))
        cursor = leading_ws.end()
    body = complete_part[cursor:]
    if body:
        segments.extend(segment for segment in re.findall(r"\S+\s*", body) if segment)
    return segments


def _split_complete_words(buffer: str, is_final: bool = False) -> tuple[list[str], str]:
    if not buffer:
        return [], ""

    if is_final:
        return _segments_complete_prefix(buffer), ""

    last_ws = max(buffer.rfind(" "), buffer.rfind("\n"), buffer.rfind("\t"))
    if last_ws == -1:
        return [], buffer

    complete_part = buffer[: last_ws + 1]
    remainder = buffer[last_ws + 1 :]
    return _segments_complete_prefix(complete_part), remainder


async def stream_chat_response(
    user_message: str,
    history: list[ChatHistoryItem] | None = None,
    persona: Persona = "socrates",
) -> AsyncGenerator[str, None]:
    client = _openrouter_client()
    history = history or []

    system_content = _system_prompt_for_persona(persona)
    if persona == "custom":
        extra = await build_custom_wisdom_context(
            client, user_message, EMBEDDING_MODEL
        )
        system_content += extra

    messages: list[dict[str, str]] = [{"role": "system", "content": system_content}]
    messages.extend({"role": item.role, "content": item.content} for item in history)
    messages.append({"role": "user", "content": user_message})

    stream = await client.chat.completions.create(
        model=OPENROUTER_MODEL,
        messages=messages,
        stream=True,
        max_tokens=1000
    )

    buffered = ""
    async for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta.content or ""
        if not delta:
            continue

        buffered += delta
        words, buffered = _split_complete_words(buffered, is_final=False)
        for word in words:
            yield word

    if buffered:
        words, _ = _split_complete_words(buffered, is_final=True)
        for word in words:
            yield word
