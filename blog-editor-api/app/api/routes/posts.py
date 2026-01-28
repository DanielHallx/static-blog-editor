"""Posts CRUD API routes."""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.routes.auth import get_current_token
from app.core.errors import handle_internal_error
from app.schemas.post import (
    PostCreate,
    PostList,
    PostResponse,
    PostUpdate,
)
from app.services.github import GitHubService

router = APIRouter(prefix="/posts", tags=["posts"])


def get_github_service(token: str = Depends(get_current_token)) -> GitHubService:
    """Dependency to get GitHub service with current user's token."""
    return GitHubService(token)


@router.get("", response_model=PostList)
async def list_posts(
    include_drafts: bool = Query(True, description="Include draft posts"),
    github_service: GitHubService = Depends(get_github_service),
) -> PostList:
    """Get list of all blog posts."""
    try:
        posts = github_service.list_posts(include_drafts=include_drafts)
        return PostList(posts=posts, total=len(posts))
    except Exception as e:
        raise handle_internal_error("Failed to fetch posts", e)


@router.get("/{slug}", response_model=PostResponse)
async def get_post(
    slug: str,
    github_service: GitHubService = Depends(get_github_service),
) -> PostResponse:
    """Get a single post by slug."""
    post = github_service.get_post(slug)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with slug '{slug}' not found",
        )
    return post


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post: PostCreate,
    github_service: GitHubService = Depends(get_github_service),
) -> PostResponse:
    """Create a new blog post."""
    try:
        return github_service.create_post(post)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise handle_internal_error("Failed to create post", e)


@router.put("/{slug}", response_model=PostResponse)
async def update_post(
    slug: str,
    post_update: PostUpdate,
    github_service: GitHubService = Depends(get_github_service),
) -> PostResponse:
    """Update an existing blog post."""
    try:
        post = github_service.update_post(slug, post_update)
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Post with slug '{slug}' not found",
            )
        return post
    except HTTPException:
        raise
    except Exception as e:
        raise handle_internal_error("Failed to update post", e)


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    slug: str,
    github_service: GitHubService = Depends(get_github_service),
) -> None:
    """Delete a blog post."""
    try:
        deleted = github_service.delete_post(slug)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Post with slug '{slug}' not found",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise handle_internal_error("Failed to delete post", e)
