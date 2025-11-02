"""Authentication and authorization."""

from typing import Annotated

from fastapi import Depends, Header

from app.errors import Forbidden


async def parse_bearer_token(authorization: Annotated[str | None, Header()] = None) -> str | None:
    """Extract bearer token from Authorization header.
    
    Args:
        authorization: Authorization header value
        
    Returns:
        Token string or None if not present
    """
    if not authorization:
        return None
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    return parts[1]


def require_scope(scope: str) -> Annotated[str, Depends]:
    """Dependency that requires a specific OAuth scope.
    
    TODO: Implement proper JWT validation and scope checking.
    For now, this is a simplified bearer token check.
    
    Args:
        scope: Required OAuth scope (e.g., "holdings.read")
        
    Returns:
        User ID extracted from token
        
    Raises:
        Forbidden: If token is missing or invalid
    """
    
    async def _check_scope(token: Annotated[str | None, Depends(parse_bearer_token)]) -> str:
        if not token:
            raise Forbidden("Missing or invalid authorization token")
        
        # TODO: Implement JWT validation
        # - Verify JWT signature
        # - Check token expiration
        # - Extract user_id and scopes from claims
        # - Verify required scope is present
        
        # For now, return a mock user ID
        # In production, this would be extracted from validated JWT
        return "user_123"
    
    return Depends(_check_scope)

