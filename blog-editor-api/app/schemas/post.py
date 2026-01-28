"""Pydantic models for blog posts."""

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, field_validator


def validate_tags_content(tags: list[str]) -> list[str]:
    """Validate tag content.

    Args:
        tags: List of tags to validate.

    Returns:
        Validated and cleaned list of tags.

    Raises:
        ValueError: If tag validation fails.
    """
    validated = []
    for tag in tags:
        # Strip whitespace
        tag = tag.strip()
        # Skip empty tags
        if not tag:
            continue
        # Validate length
        if len(tag) > 50:
            raise ValueError(
                f"Tag '{tag[:20]}...' exceeds maximum length of 50 characters"
            )
        # Validate characters (alphanumeric, hyphens, spaces)
        if not all(c.isalnum() or c in "- " for c in tag):
            raise ValueError(f"Tag '{tag}' contains invalid characters")
        validated.append(tag)
    return validated


class PostBase(BaseModel):
    """Base post schema with common fields."""

    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=500)
    date: date
    draft: bool = False
    tags: list[str] = Field(default_factory=list, max_length=20)

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list[str]) -> list[str]:
        """Validate tags content."""
        return validate_tags_content(v)


class PostCreate(PostBase):
    """Schema for creating a new post."""

    slug: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    content: str = ""


class PostUpdate(BaseModel):
    """Schema for updating an existing post."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    date: Optional[date] = None
    draft: Optional[bool] = None
    tags: Optional[list[str]] = Field(None, max_length=20)
    content: Optional[str] = None

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list[str] | None) -> list[str] | None:
        """Validate tags content."""
        if v is None:
            return v
        return validate_tags_content(v)


class PostResponse(PostBase):
    """Schema for post response."""

    slug: str
    content: str
    file_path: str


class PostListItem(BaseModel):
    """Schema for post list item (without full content)."""

    slug: str
    title: str
    description: str
    date: date
    draft: bool
    tags: list[str]


class PostList(BaseModel):
    """Schema for list of posts."""

    posts: list[PostListItem]
    total: int
