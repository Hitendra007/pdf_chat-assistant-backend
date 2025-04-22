from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from app.services.fetch_docs import relevent_chunks
from app.db.session import SessionLocal
from app.db.models import ChatMessage,ChatSession
from datetime import datetime
from sqlalchemy import select
from uuid import uuid4,UUID
from typing import Dict
from app.core.security import verify_token
from app.services.llm_bot import client,system_prompt

router = APIRouter()
active_connections: Dict[str, WebSocket] = {}

@router.websocket("/ws/chat/{session_id}")
async def chat_ws(websocket: WebSocket, session_id: str):
    await websocket.accept()

    token = websocket.cookies.get('access_token')
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    payload = verify_token(token)
    user_id = payload.get("sub") if payload else None
    if not user_id:
        print('lskdfjdlsfjlj')
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    active_connections[session_id] = websocket
    chat_history=[]
    chat_history.append({'role':'system',"content":system_prompt})
    async with SessionLocal() as db:
        session_uuid = UUID(session_id)
        existing_session = await db.execute(
            select(ChatSession).where(ChatSession.id == session_uuid)
        )
        chat_session = existing_session.scalars().first()

        if not chat_session:
            chat_session = ChatSession(
                id=session_uuid,
                user_id=user_id,
            )
            db.add(chat_session)
            await db.commit()
    try:
        while True:
            data = await websocket.receive_json()
            question = data.get("message")
            pdf_hash = data.get("pdf_hash")

            if not question or not pdf_hash:
                await websocket.send_text("Missing question or PDF hash.")
                continue

            relevent_data = relevent_chunks(query=question, pdf_id=pdf_hash)
            print(relevent_data,"--------------------------------")
            print("+++++++++++++++++++++++",chat_history)
            context = " ".join([doc['text'] for doc in relevent_data])

            chat_history.append({
                "role": "user",
                "content": f"{question}\n\nContext:\n{context}"
            })

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
            await websocket.send_text("__END__")
            chat_history.append({'role':'assistant','content':full_response})
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
        await websocket.send_text(f"❌ Error: {str(e)}")
        print(f"WebSocket error: {str(e)}")
        await websocket.close()
