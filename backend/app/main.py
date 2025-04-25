from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.api.v1 import auth,chat,pdf,ping,chat_data
from app.middleware.cors import setup_cors
from app.db.session import create_tables,lifespan

app = FastAPI(lifespan=lifespan)
setup_cors(app)

app.include_router(auth.router,prefix="/api/v1/auth"),
app.include_router(pdf.router,prefix="/api/v1/pdf")
app.include_router(chat.router,prefix="/api/v1/chat")
app.include_router(chat_data.router,prefix="/api/v1/chat_data")


@app.get('/')
async def root():
    return {"message":"chat with pdf AI is live"}