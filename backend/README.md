# Copassistant FastAPI Backend

## Setup

1. Create and activate a Python virtual environment.
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Create env file:
   - `cp .env.example .env`
   - Fill in `OPENROUTER_API_KEY`
   - Optionally set `APP_URL` (used as OpenRouter referer header)

## Run

From `backend/`:

`uvicorn app.main:app --reload --port 8080`

The backend will expose:
- `GET /health`
- `WS /ws`

## WebSocket payload format

Send:

```json
{
  "message": "Help me debug my flaky test",
  "history": [
    {"role": "user", "content": "I have CI failures"},
    {"role": "assistant", "content": "Let's inspect the logs first."}
  ]
}
```

Receive event stream:
- `{"type":"start"}`
- `{"type":"chunk","content":"..."}` (word-by-word chunks)
- `{"type":"done"}`
- `{"type":"error","message":"..."}` on failures
