from app.db.models import ChatMessage, ChatSession
from fastapi import Response, Request, Depends, APIRouter
from app.middleware.AuthMiddleware import auth_middleware
from sqlalchemy import select, text
from app.db.session import SessionLocal
from sqlalchemy.orm import selectinload
from app.utils.apiResponse import ApiResponse
from datetime import datetime, timedelta
router = APIRouter()


@router.get("/get_chat_session", dependencies=[Depends(auth_middleware)])
async def getChats(request: Request, response: Response):
    async with SessionLocal() as db:
        result = await db.execute(
            select(ChatSession)
            .options(selectinload(ChatSession.pdf))
            .where(
                ChatSession.user_id == request.state.user_id)
        )
        sessions = result.scalars().all()

    if not sessions:
        return ApiResponse(404, 'No records found', data={})
    return ApiResponse(200, 'Chat sessions fetched successfully!!', data={"chat_sessions": [session for session in sessions]})


@router.get('/chat_history', dependencies=[Depends(auth_middleware)])
async def get_history(request: Request, response: Response, session_id: str):
    async with SessionLocal() as db:
        query = text("""
    SELECT * FROM chat_messages 
    WHERE session_id = :s_id 
    ORDER BY created_at ASC 
    LIMIT 100
""")
        result = await db.execute(query, {
            "s_id": session_id,
        })
        messages = result.fetchall()

    if not messages:
        return ApiResponse(404, 'No chat message found for this session', data={}).to_dict()

    return ApiResponse(200, 'Fetched chat history', {
        "chat_history": [dict(row._mapping) for row in messages]
    }).to_dict()
