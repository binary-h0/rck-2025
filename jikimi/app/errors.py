"""Custom error classes and HTTP exceptions."""

from fastapi import HTTPException, status


class AppError(HTTPException):
    """Base application error."""
    
    def __init__(self, detail: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR) -> None:
        super().__init__(status_code=status_code, detail=detail)


class NotFound(AppError):
    """Resource not found error."""
    
    def __init__(self, detail: str = "Resource not found") -> None:
        super().__init__(detail=detail, status_code=status.HTTP_404_NOT_FOUND)


class Forbidden(AppError):
    """Forbidden access error."""
    
    def __init__(self, detail: str = "Forbidden") -> None:
        super().__init__(detail=detail, status_code=status.HTTP_403_FORBIDDEN)


class SchemaViolation(AppError):
    """Schema validation error."""
    
    def __init__(self, detail: str = "Schema validation failed") -> None:
        super().__init__(detail=detail, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


class Unprocessable(AppError):
    """Unprocessable entity error."""
    
    def __init__(self, detail: str = "Unprocessable entity") -> None:
        super().__init__(detail=detail, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


class AIProviderError(AppError):
    """Error from AI provider (OpenAI, etc.)."""
    
    def __init__(self, detail: str = "AI provider error") -> None:
        super().__init__(detail=detail, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)


# Aliases for convenience
NotFoundError = NotFound
ValidationError = Unprocessable

