"""Image upload and proxy API routes."""

import base64
import io
import re
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response
from github.GithubException import UnknownObjectException
from PIL import Image

from app.api.routes.auth import get_current_token
from app.config import get_settings
from app.core.errors import handle_internal_error
from app.services.github import GitHubService

router = APIRouter(prefix="/images", tags=["images"])

# Allowed image types
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def get_github_service(token: str = Depends(get_current_token)) -> GitHubService:
    """Dependency to get GitHub service with current user's token."""
    return GitHubService(token)


def optimize_image(content: bytes, content_type: str) -> tuple[bytes, str]:
    """Optimize image by compressing and resizing if needed.

    Args:
        content: Original image bytes.
        content_type: MIME type of the image.

    Returns:
        Tuple of (optimized bytes, extension).
    """
    # Get format from content type
    format_map = {
        "image/jpeg": ("JPEG", ".jpg"),
        "image/png": ("PNG", ".png"),
        "image/gif": ("GIF", ".gif"),
        "image/webp": ("WEBP", ".webp"),
    }

    img_format, extension = format_map.get(content_type, ("JPEG", ".jpg"))

    try:
        # Avoid optimizing GIFs to prevent losing animation
        if img_format == "GIF":
            return content, extension

        img = Image.open(io.BytesIO(content))

        # Convert RGBA to RGB for JPEG
        if img_format == "JPEG" and img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        # Resize if too large (max 1920px on longest side)
        max_size = 1920
        if max(img.size) > max_size:
            img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)

        # Save with optimization
        output = io.BytesIO()
        save_kwargs = {"format": img_format}

        if img_format in ("JPEG", "WEBP"):
            save_kwargs["quality"] = 85
            save_kwargs["optimize"] = True
        elif img_format == "PNG":
            save_kwargs["optimize"] = True

        img.save(output, **save_kwargs)
        return output.getvalue(), extension

    except Exception:
        # Return original if optimization fails
        return content, format_map.get(content_type, ("JPEG", ".jpg"))[1]


@router.post("/upload/{slug}")
async def upload_image(
    slug: str,
    file: Annotated[UploadFile, File(description="Image file to upload")],
    github_service: GitHubService = Depends(get_github_service),
) -> dict:
    """Upload an image for a blog post.

    The image will be stored in the post's images directory:
    src/content/blog/{slug}/images/
    """
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_TYPES)}",
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024 * 1024)}MB",
        )

    # Optimize image
    optimized_content, extension = optimize_image(content, file.content_type)

    # Generate unique filename
    original_name = file.filename or "image"
    base_name = original_name.rsplit(".", 1)[0] if "." in original_name else original_name
    # Sanitize filename
    base_name = "".join(c if c.isalnum() or c in "-_" else "-" for c in base_name)
    unique_id = str(uuid.uuid4())[:8]
    filename = f"{base_name}-{unique_id}{extension}"

    try:
        result = github_service.upload_image(slug, filename, optimized_content)
        return {
            "success": True,
            "filename": filename,
            "path": result["path"],
            "relative_path": result["relative_path"],
            "markdown": result["markdown"],
        }
    except Exception as e:
        raise handle_internal_error("Failed to upload image", e)


# Content type mapping for image extensions
EXTENSION_CONTENT_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
}


def validate_image_filename(filename: str) -> str:
    """Validate and sanitize image filename to prevent path traversal.

    Args:
        filename: The filename from the URL path.

    Returns:
        Sanitized filename.

    Raises:
        HTTPException: If filename is invalid or contains traversal attempts.
    """
    # Normalize path separators
    normalized = filename.replace("\\", "/")

    # Check for path traversal attempts
    if ".." in normalized or normalized.startswith("/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename",
        )

    # Validate filename characters (alphanumeric, hyphens, underscores, dots, single slash)
    if not re.match(r"^[a-zA-Z0-9_\-./]+$", normalized):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename characters",
        )

    # Validate extension
    ext = "." + normalized.rsplit(".", 1)[-1].lower() if "." in normalized else ""
    if ext not in EXTENSION_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image type",
        )

    return normalized


@router.get("/proxy/{slug}/{filename:path}")
async def proxy_image(
    slug: str,
    filename: str,
    github_service: GitHubService = Depends(get_github_service),
) -> Response:
    """Proxy images from GitHub for preview.

    This endpoint fetches images from the GitHub repository and returns them
    directly, allowing the frontend to display images in the preview mode.

    Args:
        slug: Post slug.
        filename: Image filename (can include subdirectory path).

    Returns:
        Image content as binary response.
    """
    # Validate filename to prevent path traversal
    safe_filename = validate_image_filename(filename)

    settings = get_settings()
    image_path = f"{settings.blog_content_path}/{slug}/images/{safe_filename}"

    try:
        repo = github_service._get_repo()
        content_file = repo.get_contents(image_path, ref=settings.github_branch)

        if isinstance(content_file, list):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found",
            )

        # Decode the base64 content
        image_data = base64.b64decode(content_file.content)

        # Determine content type from extension
        ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        content_type = EXTENSION_CONTENT_TYPES.get(ext, "application/octet-stream")

        return Response(
            content=image_data,
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=3600",  # Cache for 1 hour
            },
        )

    except UnknownObjectException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    except Exception as e:
        raise handle_internal_error("Failed to fetch image", e)
