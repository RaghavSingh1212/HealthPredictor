from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://root:example@localhost:27017/med_db?authSource=admin"
    GEMINI_API_KEY: str = "dev-mock-key"
    ENCRYPTION_KEY: str = "0123456789abcdef0123456789abcdef"
    PORT: int = 8000
    USE_IN_MEMORY_DB: bool = True

    class Config:
        env_file = ".env"

settings = Settings()
