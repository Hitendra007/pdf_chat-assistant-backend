from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from app.services.fetch_docs import relevent_chunks
from app.db.session import SessionLocal
from app.db.models import ChatMessage, ChatSession
from app.core.settings import settings
from datetime import datetime
from sqlalchemy import select
from uuid import uuid4, UUID
from typing import Dict
from app.core.security import verify_token
from app.services.llm_bot import system_prompt
from app.services.llm_fallback import stream_with_fallback
import asyncio

router = APIRouter()
active_connections: Dict[str, WebSocket] = {}

requests_times = []
RATE_LIMIT = settings.RATE_LIMIT
TIME_WINDOW = settings.TIME_WINDOW_SECONDS


def can_send():
    now = datetime.now()

    req_count_in_window = [t for t in requests_times if (now - t).total_seconds() < TIME_WINDOW]

    if len(req_count_in_window) >= RATE_LIMIT:
        return False

    requests_times.append(now)
    return True


def is_with_in_time_limits(timestamp):
    return (datetime.now() - timestamp).total_seconds() < TIME_WINDOW


async def cleanup_request_times():
    global requests_times
    while True:
        await asyncio.sleep(5)
        requests_times = list(filter(is_with_in_time_limits, requests_times))


@router.websocket("/ws/chat/{pdf_id}")
async def chat_ws(websocket: WebSocket, pdf_id: str):
    await websocket.accept()
    print("🔌WebSocket connected")

    auth_token = websocket.cookies.get('access_token')
    if not auth_token:
        print("No token in cookies → closing")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    token_data = verify_token(auth_token)
    user_id = token_data.get("sub") if token_data else None
    if not user_id:
        print("Invalid token → closing")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        init_payload = await websocket.receive_json()
        print("Received init payload:", init_payload)
    except Exception as e:
        print("Error while receiving init payload:", e)
        await websocket.close(code=status.WS_1003_UNSUPPORTED_DATA)
        return

    session_id = init_payload.get("session_id")
    is_legal_doc = init_payload.get("is_legal_doc")
    active_connections[session_id] = websocket

    async with SessionLocal() as db:
        session_uuid = UUID(session_id)
        result = await db.execute(
            select(ChatSession).where(ChatSession.id == session_uuid)
        )
        chat_session = result.scalars().first()
        if not chat_session:
            chat_session = ChatSession(
                id=session_uuid,
                user_id=user_id,
                pdf_id=pdf_id,
            )
            db.add(chat_session)
            await db.commit()

    chat_history = [{'role': 'system', 'content': system_prompt}]

    try:
        while True:
            data = await websocket.receive_json()
            question = data.get("message")
            pdf_hash = data.get("pdf_hash")

            if not question or not pdf_hash:
                await websocket.send_text("Missing question or PDF hash.")
                continue

            # Run blocking retrieval off the event loop
            relevant_data = await asyncio.to_thread(
                relevent_chunks, query=question, pdf_id=pdf_hash
            )
            context = " ".join([doc['text'] for doc in relevant_data])

            if not can_send():
                await websocket.send_text("As it is free tier,⚠️ Rate limit exceeded: Too many user requests, please wait a minute.")
                await websocket.send_text("__END__")
                continue

            chat_history.append({
                'role': 'user',
                'content': f"{question}\n\nContext:\n{context}"
            })

            full_response = ""
            try:
                async for piece in stream_with_fallback(chat_history):
                    full_response += piece
                    await websocket.send_text(piece)
            except RuntimeError:
                await websocket.send_text("All AI models are busy right now. Please try again in a minute.")
                await websocket.send_text("__END__")
                chat_history.pop()  # remove the unanswered question
                continue

            # Signal end of stream
            await websocket.send_text("__END__")
            chat_history.append({'role': 'assistant', 'content': full_response})

            # Persist messages to database
            async with SessionLocal() as db:
                db.add_all([
                    ChatMessage(
                        id=uuid4(),
                        session_id=session_id,
                        role="user",
                        content=question,
                        created_at=datetime.now()
                    ),
                    ChatMessage(
                        id=uuid4(),
                        session_id=session_id,
                        role="assistant",
                        content=full_response,
                        created_at=datetime.now()
                    )
                ])
                await db.commit()

    except WebSocketDisconnect:
        active_connections.pop(session_id, None)
        print(f"Disconnected: {session_id}")

    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()