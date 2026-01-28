"""FastAPI application entry point for Blog Editor API."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, images, posts
from app.config import get_settings
from app.core.logging import setup_logging

settings = get_settings()

# Configure logging
setup_logging(settings.log_level)

app = FastAPI(
    title="Blog Editor API",
    description="API for managing Astro blog content via GitHub",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Cookie"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(posts.router, prefix="/api")
app.include_router(images.router, prefix="/api")


@app.get("/")
async def root() -> dict:
    """Root endpoint."""
    return {
        "name": "Blog Editor API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health() -> dict:
    """Health check endpoint."""
    return {"status": "healthy"}
