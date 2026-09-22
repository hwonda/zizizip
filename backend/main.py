from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.routers import health, housing, notices

# Vercel rewrites /api/py/* to this app without stripping the prefix,
# so routes and docs must carry it themselves.
API_PREFIX = "/api/py"

app = FastAPI(
    title="zizizip API",
    description="Backend API for zizizip real estate mapping application",
    version="0.1.0",
    docs_url=f"{API_PREFIX}/docs",
    redoc_url=f"{API_PREFIX}/redoc",
    openapi_url=f"{API_PREFIX}/openapi.json",
)

# CORS configuration
_allowed_origins: list[str] = [
    "http://localhost:8253",
    "http://localhost:3000",
]
if settings.FRONTEND_URL:
    _allowed_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router, prefix=API_PREFIX)
app.include_router(notices.router, prefix=API_PREFIX)
app.include_router(housing.router, prefix=API_PREFIX)
