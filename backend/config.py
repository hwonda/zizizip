from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env.local from the project root (two levels up from backend/)
_env_path = Path(__file__).resolve().parent.parent / ".env.local"
load_dotenv(_env_path)


class Settings:
    """Application settings loaded from environment variables."""

    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    VWORLD_API_KEY: str = os.getenv("NEXT_PUBLIC_VWORLD_API_KEY", "")
    LH_API_KEY: str = os.getenv("NEXT_PUBLIC_LH_API_KEY", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:8253")


settings = Settings()
