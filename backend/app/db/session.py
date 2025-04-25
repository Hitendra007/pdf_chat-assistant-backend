from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine  
from sqlalchemy.orm import sessionmaker
from app.core.settings import settings
from app.db import models  # Import your models here
from sqlalchemy.future import select
from contextlib import asynccontextmanager

engine = create_async_engine(settings.DATABASE_URL, echo=True, future=True)

SessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)

@asynccontextmanager
async def lifespan(app):
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    yield  # Keeps the app running until shutdown
