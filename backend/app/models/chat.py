from typing import Literal

from pydantic import BaseModel, Field


class ChatHistoryItem(BaseModel):
    role: Literal["user", "assistant"] = Field(..., description="Role for history item")
    content: str = Field(..., min_length=1, description="Message content")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Current user message")
    history: list[ChatHistoryItem] = Field(
        default_factory=list, description="Prior turns in chat session"
    )


class StreamEvent(BaseModel):
    type: Literal["start", "chunk", "done", "error"]
    content: str | None = None
    message: str | None = None
