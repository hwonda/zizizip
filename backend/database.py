from __future__ import annotations

from supabase import Client, create_client

from backend.config import settings

_client: Client | None = None


def get_supabase() -> Client:
    """Return a Supabase client instance (singleton)."""
    global _client
    if _client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_KEY must be set in environment variables."
            )
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return _client
