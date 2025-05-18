from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGO: str = "HS256"
    ACCESS_TOKEN_EXPIRE: int = 1
    REFRESH_TOKEN_EXPIRE: int = 2
    QDRANT_URL: str
    QDRANT_API_KEY: str
    GEMINI_API_KEY: str
    RATE_LIMIT: int = 15
    TIME_WINDOW_SECONDS: int = 60

    class Config:
        env_file = ".env"

settings = Settings()