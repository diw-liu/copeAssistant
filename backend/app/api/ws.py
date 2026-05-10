from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from app.models.chat import ChatRequest, StreamEvent
from app.services.ai_service import stream_chat_response

router = APIRouter()


@router.websocket("/ws")
async def websocket_chat_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()

    try:
        while True:
            payload = await websocket.receive_json()

            try:
                chat_request = ChatRequest.model_validate(payload)
            except ValidationError as exc:
                event = StreamEvent(type="error", message=f"Invalid payload: {exc}")
                await websocket.send_json(event.model_dump())
                continue

            await websocket.send_json(StreamEvent(type="start").model_dump())
            try:
                async for part in stream_chat_response(
                    user_message=chat_request.message,
                    history=chat_request.history,
                    persona=chat_request.persona,
                ):
                    await websocket.send_json(
                        StreamEvent(type="chunk", content=part).model_dump()
                    )
                await websocket.send_json(StreamEvent(type="done").model_dump())
            except Exception as exc:  # noqa: BLE001
                await websocket.send_json(
                    StreamEvent(type="error", message=str(exc)).model_dump()
                )
    except WebSocketDisconnect:
        return
