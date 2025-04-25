from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from app.services.fetch_docs import relevent_chunks
from app.db.session import SessionLocal
from app.db.models import ChatMessage, ChatSession
from datetime import datetime
from sqlalchemy import select
from uuid import uuid4, UUID
from typing import Dict
from app.core.security import verify_token
from app.services.llm_bot import client, system_prompt

router = APIRouter()
active_connections: Dict[str, WebSocket] = {}

@router.websocket("/ws/chat/{pdf_id}")
async def chat_ws(websocket: WebSocket, pdf_id: str):
    await websocket.accept()
    print("🔌WebSocket connected")

    token = websocket.cookies.get('access_token')
    if not token:
        print("No token in cookies → closing")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    token_data = verify_token(token)
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

    chat_history = [{ 'role': 'system', 'content': system_prompt }]

    try:
        while True:
            data = await websocket.receive_json()
            question = data.get("message")
            pdf_hash = data.get("pdf_hash")

            if not question or not pdf_hash:
                await websocket.send_text("Missing question or PDF hash.")
                continue

            # Fetch relevant document chunks
            relevant_data = relevent_chunks(query=question, pdf_id=pdf_hash)
            context = " ".join([doc['text'] for doc in relevant_data])

            # Append user message to history
            chat_history.append({
                'role': 'user',
                'content': f"{question}\n\nContext:\n{context}"
            })

            # Stream LLM completion
            stream = client.chat.completions.create(
                model="gemini-2.0-flash",
                messages=chat_history,
                stream=True
            )

            full_response = ""
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    full_response += token
                    await websocket.send_text(token)

            # Signal end of stream
            await websocket.send_text("__END__")
            chat_history.append({ 'role': 'assistant', 'content': full_response })

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
