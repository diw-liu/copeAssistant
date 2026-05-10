import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI

from app.api.ws import router as ws_router

load_dotenv()

app = FastAPI(title="Copassistant Backend", version="0.1.0")
app.include_router(ws_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
