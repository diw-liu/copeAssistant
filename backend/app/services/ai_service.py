import os
import re
from collections.abc import AsyncGenerator

from openai import AsyncOpenAI

from app.models.chat import ChatHistoryItem

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_MODEL = "moonshotai/kimi-k2.6"

SYSTEM_PROMPT = """You are Copium Frog, a supportive companion for software engineers.
You are grounded, practical, and gently witty.
You help users stay calm, clarify problems, and move toward the next concrete step.
Keep replies concise, actionable, and encouraging without being cheesy.
When appropriate, acknowledge uncertainty and suggest a small experiment."""


def _openrouter_client() -> AsyncOpenAI:
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    app_url = os.getenv("APP_URL", "").strip()
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not set. Add it to your .env file.")

    return AsyncOpenAI(
        api_key=api_key,
        base_url=OPENROUTER_BASE_URL
    )


def _split_complete_words(buffer: str, is_final: bool = False) -> tuple[list[str], str]:
    if not buffer:
        return [], ""

    if is_final:
        return [buffer], ""

    last_ws = max(buffer.rfind(" "), buffer.rfind("\n"), buffer.rfind("\t"))
    if last_ws == -1:
        return [], buffer

    complete_part = buffer[: last_ws + 1]
    remainder = buffer[last_ws + 1 :]
    words = [segment for segment in re.findall(r"\S+\s*", complete_part) if segment]
    return words, remainder


async def stream_chat_response(
    user_message: str, history: list[ChatHistoryItem] | None = None
) -> AsyncGenerator[str, None]:
    client = _openrouter_client()
    history = history or []

    messages: list[dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend({"role": item.role, "content": item.content} for item in history)
    messages.append({"role": "user", "content": user_message})

    stream = await client.chat.completions.create(
        model=OPENROUTER_MODEL,
        messages=messages,
        stream=True,
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
