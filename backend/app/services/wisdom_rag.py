"""RAG over a local wisdom text file for the custom ("Me") persona. In-memory cache keyed by file mtime."""

from __future__ import annotations

import os
import re
from pathlib import Path

import numpy as np
from openai import AsyncOpenAI

_APP_DIR = Path(__file__).resolve().parent.parent
_DEFAULT_WISDOM = _APP_DIR / "data" / "wisdom.txt"

# Below this size, inject the full file (no embedding pass for retrieval).
FULL_FILE_MAX_CHARS = 4000
CHUNK_TARGET = 700
CHUNK_OVERLAP = 100
TOP_K = 4
EMBED_BATCH = 96

_cache_mtime: float | None = None
_cache_path: str | None = None
_cache_chunks: list[str] = []
_cache_matrix: np.ndarray | None = None


def wisdom_path() -> Path:
    raw = os.getenv("WISDOM_FILE", "").strip()
    if raw:
        return Path(raw).expanduser().resolve()
    return _DEFAULT_WISDOM


def _chunk_text(text: str) -> list[str]:
    text = text.strip()
    if not text:
        return []

    paragraphs = re.split(r"\n\s*\n+", text)
    chunks: list[str] = []
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        if len(para) <= CHUNK_TARGET:
            chunks.append(para)
            continue
        start = 0
        while start < len(para):
            end = min(start + CHUNK_TARGET, len(para))
            chunks.append(para[start:end])
            if end >= len(para):
                break
            start = end - CHUNK_OVERLAP
    return [c for c in chunks if c.strip()]


async def _embed_batch(client: AsyncOpenAI, model: str, inputs: list[str]) -> np.ndarray:
    if not inputs:
        return np.zeros((0, 1), dtype=np.float64)
    resp = await client.embeddings.create(model=model, input=inputs)
    ordered = sorted(resp.data, key=lambda d: d.index)
    arr = np.array([d.embedding for d in ordered], dtype=np.float64)
    norms = np.linalg.norm(arr, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    return arr / norms


async def _embed_matrix(client: AsyncOpenAI, model: str, texts: list[str]) -> np.ndarray:
    parts: list[np.ndarray] = []
    for i in range(0, len(texts), EMBED_BATCH):
        batch = texts[i : i + EMBED_BATCH]
        parts.append(await _embed_batch(client, model, batch))
    if not parts:
        return np.zeros((0, 1), dtype=np.float64)
    return np.vstack(parts)


async def _ensure_index(client: AsyncOpenAI, embedding_model: str, path: Path) -> None:
    global _cache_mtime, _cache_path, _cache_chunks, _cache_matrix

    mtime = path.stat().st_mtime
    key = str(path.resolve())
    if (
        _cache_matrix is not None
        and _cache_path == key
        and _cache_mtime == mtime
        and _cache_chunks
    ):
        return

    text = path.read_text(encoding="utf-8").strip()
    if not text:
        _cache_chunks = []
        _cache_matrix = np.zeros((0, 1), dtype=np.float64)
        _cache_mtime = mtime
        _cache_path = key
        return

    chunks = _chunk_text(text)
    _cache_chunks = chunks
    if not chunks:
        _cache_chunks = []
        _cache_matrix = np.zeros((0, 1), dtype=np.float64)
        _cache_mtime = mtime
        _cache_path = key
        return

    _cache_matrix = await _embed_matrix(client, embedding_model, chunks)
    _cache_mtime = mtime
    _cache_path = key


async def build_custom_wisdom_context(
    client: AsyncOpenAI,
    user_message: str,
    embedding_model: str,
) -> str:
    """Appendable block for the system prompt. Handles full-file vs RAG paths."""
    path = wisdom_path()
    if not path.is_file():
        return (
            "\n\nNo wisdom file found. Add a text file at "
            f"{path} or set WISDOM_FILE. You may still respond in a warm, concise, first-person reflective style."
        )

    text = path.read_text(encoding="utf-8").strip()
    if not text:
        return "\n\nThe wisdom file is empty."

    if len(text) <= FULL_FILE_MAX_CHARS:
        return (
            "\n\n--- Reference voice (your wisdom file, full text) ---\n"
            "Mirror tone and diction; this is stylistic reference, not biographical fact.\n\n"
            f"{text}"
        )

    await _ensure_index(client, embedding_model, path)

    global _cache_chunks, _cache_matrix
    if (
        _cache_matrix is None
        or not _cache_chunks
        or _cache_matrix.size == 0
        or _cache_matrix.shape[0] == 0
    ):
        return "\n\nCould not build embeddings for the wisdom file. Check EMBEDDING_MODEL and API access."

    qm = await _embed_matrix(client, embedding_model, [user_message])
    if qm.shape[0] == 0:
        return ""
    qv = qm[0]
    sims = _cache_matrix @ qv
    k = min(TOP_K, int(sims.shape[0]))
    top = np.argpartition(-sims, k - 1)[:k]
    top = top[np.argsort(-sims[top])]
    excerpts = [_cache_chunks[int(i)] for i in top]
    body = "\n\n---\n\n".join(excerpts)
    return (
        "\n\n--- Reference voice (retrieved excerpts from your wisdom file) ---\n"
        "Mirror tone and diction; this is stylistic reference, not biographical fact.\n\n"
        f"{body}"
    )
