"""Markdown parsing and generation service."""

import re
from datetime import date
from typing import Any

import yaml


def parse_frontmatter(content: str) -> tuple[dict[str, Any], str]:
    """Parse frontmatter from markdown content.

    Args:
        content: Full markdown content with optional frontmatter.

    Returns:
        Tuple of (frontmatter dict, body content).
    """
    # Match frontmatter block
    pattern = r"^---\s*\n(.*?)\n---\s*\n(.*)$"
    match = re.match(pattern, content, re.DOTALL)

    if not match:
        return {}, content

    frontmatter_str = match.group(1)
    body = match.group(2)

    try:
        frontmatter = yaml.safe_load(frontmatter_str) or {}
    except yaml.YAMLError:
        frontmatter = {}

    return frontmatter, body


def generate_frontmatter(
    title: str,
    description: str,
    post_date: date,
    draft: bool = False,
    tags: list[str] | None = None,
) -> str:
    """Generate frontmatter YAML string.

    Args:
        title: Post title.
        description: Post description.
        post_date: Publication date.
        draft: Whether post is a draft.
        tags: Optional list of tags.

    Returns:
        Frontmatter YAML string with delimiters.
    """
    frontmatter: dict[str, Any] = {
        "title": title,
        "description": description,
        "date": post_date.strftime("%Y-%m-%d"),
    }

    if draft:
        frontmatter["draft"] = True

    if tags:
        frontmatter["tags"] = tags

    yaml_content = yaml.dump(
        frontmatter, default_flow_style=False, allow_unicode=True, sort_keys=False
    )

    return f"---\n{yaml_content}---\n"


def create_post_content(
    title: str,
    description: str,
    post_date: date,
    body: str,
    draft: bool = False,
    tags: list[str] | None = None,
) -> str:
    """Create complete post content with frontmatter.

    Args:
        title: Post title.
        description: Post description.
        post_date: Publication date.
        body: Markdown body content.
        draft: Whether post is a draft.
        tags: Optional list of tags.

    Returns:
        Complete markdown content with frontmatter.
    """
    frontmatter = generate_frontmatter(title, description, post_date, draft, tags)
    return f"{frontmatter}\n{body}"


def generate_slug(title: str) -> str:
    """Generate URL slug from title.

    Args:
        title: Post title.

    Returns:
        URL-safe slug.
    """
    # Convert to lowercase
    slug = title.lower()
    # Replace spaces and underscores with hyphens
    slug = re.sub(r"[\s_]+", "-", slug)
    # Remove non-alphanumeric characters except hyphens
    slug = re.sub(r"[^a-z0-9-]", "", slug)
    # Remove multiple consecutive hyphens
    slug = re.sub(r"-+", "-", slug)
    # Remove leading/trailing hyphens
    slug = slug.strip("-")

    return slug
