"""GitHub OAuth authentication routes."""

import secrets
import time
from urllib.parse import urlencode
from typing import Annotated

import httpx
from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse

from app.config import get_settings
from app.core.errors import handle_internal_error
from app.services.github import GitHubService

router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory session store (token + expiry)
# WARNING: This is suitable for development and single-instance deployments only.
# For production with multiple instances, replace with Redis or another
# distributed session store. Sessions will be lost on server restart.
#
# Example Redis implementation:
#   import redis
#   redis_client = redis.Redis(host='localhost', port=6379, db=0)
#   def store_session(session_id: str, token: str) -> None:
#       redis_client.setex(session_id, 60 * 60 * 24 * 7, token)
#   def get_session(session_id: str) -> str | None:
#       return redis_client.get(session_id)
SESSION_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 days
OAUTH_STATE_TTL_SECONDS = 10 * 60  # 10 minutes

sessions: dict[str, tuple[str, float]] = {}
oauth_states: dict[str, float] = {}


def _now() -> float:
    return time.time()


def _cleanup_expired_states() -> None:
    now = _now()
    expired = [state for state, expires_at in oauth_states.items() if expires_at <= now]
    for state in expired:
        del oauth_states[state]


def _cleanup_expired_sessions() -> None:
    now = _now()
    expired = [sid for sid, (_, expires_at) in sessions.items() if expires_at <= now]
    for sid in expired:
        del sessions[sid]


def store_session(session_id: str, token: str) -> None:
    sessions[session_id] = (token, _now() + SESSION_TTL_SECONDS)


def get_session(session_id: str) -> str | None:
    _cleanup_expired_sessions()
    record = sessions.get(session_id)
    if not record:
        return None
    token, expires_at = record
    if expires_at <= _now():
        del sessions[session_id]
        return None
    return token


def get_current_token(
    session_id: Annotated[str | None, Cookie(alias="session_id")] = None,
) -> str:
    """Get current user's GitHub access token from session.

    Args:
        session_id: Session ID from cookie.

    Returns:
        GitHub access token.

    Raises:
        HTTPException: If not authenticated.
    """
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = get_session(session_id)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token


@router.get("/login")
async def login() -> RedirectResponse:
    """Initiate GitHub OAuth flow."""
    settings = get_settings()

    # Generate state for CSRF protection
    state = secrets.token_urlsafe(32)
    oauth_states[state] = _now() + OAUTH_STATE_TTL_SECONDS
    _cleanup_expired_states()

    # Build GitHub authorization URL
    params = {
        "client_id": settings.github_client_id,
        "redirect_uri": settings.github_redirect_uri,
        "scope": "repo read:user",
        "state": state,
    }

    query_string = urlencode(params)
    auth_url = f"https://github.com/login/oauth/authorize?{query_string}"

    return RedirectResponse(url=auth_url)


@router.get("/callback")
async def callback(
    code: Annotated[str, Query(description="Authorization code from GitHub")],
    state: Annotated[str, Query(description="State for CSRF protection")],
) -> RedirectResponse:
    """Handle GitHub OAuth callback."""
    settings = get_settings()

    # Verify state
    _cleanup_expired_states()
    expires_at = oauth_states.get(state)
    if not expires_at or expires_at <= _now():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid state parameter",
        )
    del oauth_states[state]

    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
                "redirect_uri": settings.github_redirect_uri,
            },
            headers={"Accept": "application/json"},
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to exchange code for token",
            )

        data = response.json()

        if "error" in data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=data.get("error_description", data["error"]),
            )

        access_token = data.get("access_token")
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No access token in response",
            )

    # Create session
    session_id = secrets.token_urlsafe(32)
    store_session(session_id, access_token)

    # Redirect to frontend with session cookie
    is_production = settings.environment == "production"
    response = RedirectResponse(url=settings.frontend_url)
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=is_production,
        samesite="strict",
        max_age=SESSION_TTL_SECONDS,
        path="/",
    )

    return response


@router.get("/me")
async def get_current_user(token: str = Depends(get_current_token)) -> dict:
    """Get current authenticated user info."""
    try:
        github_service = GitHubService(token)
        return github_service.get_user()
    except Exception as e:
        raise handle_internal_error("Failed to get user info", e)


@router.post("/logout")
async def logout(
    session_id: Annotated[str | None, Cookie(alias="session_id")] = None,
) -> RedirectResponse:
    """Logout current user."""
    if session_id and session_id in sessions:
        del sessions[session_id]

    response = RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
    response.delete_cookie("session_id", path="/")
    return response
