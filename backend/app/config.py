import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cih.db")
SECRET_KEY = os.getenv("SECRET_KEY", "aicte-cih-secret-key-2025-gov-portal-secure")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days for demo ease
AI_LLM_PROVIDER = os.getenv("AI_LLM_PROVIDER", "offline")  # offline (default) or openai/gemini
