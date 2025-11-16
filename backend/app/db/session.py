from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine  
from sqlalchemy.orm import sessionmaker
from app.core.settings import settings
from app.db import models  # Import your models here
from sqlalchemy.future import select
from contextlib import asynccontextmanager
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

def prepare_database_url(url: str) -> tuple[str, dict]:
    """
    Parse database URL and extract SSL parameters for asyncpg.
    asyncpg doesn't support 'sslmode' parameter, so we need to convert it.
    """
    parsed = urlparse(url)
    query_params = parse_qs(parsed.query)
    
    # Extract sslmode if present
    ssl_mode = None
    if 'sslmode' in query_params:
        ssl_mode = query_params['sslmode'][0].lower()
        # Remove sslmode from query params
        del query_params['sslmode']
    
    # Rebuild URL without sslmode
    new_query = urlencode(query_params, doseq=True)
    new_parsed = parsed._replace(query=new_query)
    clean_url = urlunparse(new_parsed)
    
    # Convert sslmode to asyncpg's ssl parameter
    # asyncpg accepts: True/False (bool) or ssl.SSLContext
    connect_args = {}
    if ssl_mode:
        if ssl_mode in ('require', 'verify-ca', 'verify-full'):
            # For Supabase and most cloud providers, we need SSL
            # Using True enables SSL without strict certificate verification
            connect_args['ssl'] = True
        elif ssl_mode == 'disable':
            connect_args['ssl'] = False
        else:
            # Default to require for security
            connect_args['ssl'] = True
    else:
        # If no sslmode specified but URL suggests SSL (e.g., Supabase), enable it
        if 'supabase' in url.lower() or 'pooler' in url.lower():
            connect_args['ssl'] = True
    
    return clean_url, connect_args

# Prepare database URL and connection args
db_url, connect_args = prepare_database_url(settings.DATABASE_URL)
engine = create_async_engine(db_url, echo=True, future=True, connect_args=connect_args)

SessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)

@asynccontextmanager
async def lifespan(app):
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    yield  # Keeps the app running until shutdown
