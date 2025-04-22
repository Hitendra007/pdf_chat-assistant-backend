from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine  # Ensure AsyncSession is imported
from sqlalchemy.orm import sessionmaker
from app.core.settings import settings
from app.db import models  # Import your models here
from sqlalchemy.future import select
from contextlib import asynccontextmanager

# Define your engine
engine = create_async_engine(settings.DATABASE_URL, echo=True, future=True)

# Define your session local
SessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

# Create tables function
async def create_tables():
    # Import models in the right place to make sure they're registered with the base
    async with engine.begin() as conn:
        # This will create all tables based on the models defined
        await conn.run_sync(models.Base.metadata.create_all)

# Lifespan context manager
@asynccontextmanager
async def lifespan(app):
    # Create tables if they don't exist on startup
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    yield  # Keeps the app running until shutdown
