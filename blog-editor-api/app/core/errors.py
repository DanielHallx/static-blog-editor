"""Centralized error handling utilities."""

import logging

from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


def handle_internal_error(operation: str, error: Exception) -> HTTPException:
    """Log error details and return generic HTTP exception.

    Args:
        operation: Description of the operation that failed.
        error: The caught exception.

    Returns:
        HTTPException with generic message for client.
    """
    logger.error(f"{operation} failed: {error}", exc_info=True)
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"{operation} failed. Please try again later.",
    )
