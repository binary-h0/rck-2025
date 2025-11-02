"""Cursor-based pagination utilities."""

import base64
import json
from typing import Any

from sqlalchemy import asc, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select


def encode_cursor(data: dict[str, Any] | tuple[Any, ...] | None) -> str | None:
    """Encode cursor data to an opaque base64url string.
    
    Args:
        data: Dictionary or tuple to encode, or None
        
    Returns:
        Base64url-encoded JSON string, or None if data is None
    """
    if data is None:
        return None
    
    if isinstance(data, tuple):
        data = {"values": list(data)}
    
    json_str = json.dumps(data, default=str, separators=(",", ":"))
    encoded = base64.urlsafe_b64encode(json_str.encode("utf-8")).decode("utf-8")
    return encoded.rstrip("=")


def decode_cursor(cursor: str | None) -> dict[str, Any] | None:
    """Decode an opaque cursor string to a dictionary.
    
    Args:
        cursor: Base64url-encoded cursor string, or None
        
    Returns:
        Decoded dictionary, or None if cursor is None or invalid
    """
    if not cursor:
        return None
    
    try:
        # Add padding if needed
        padding = 4 - (len(cursor) % 4)
        if padding != 4:
            cursor += "=" * padding
        
        decoded = base64.urlsafe_b64decode(cursor.encode("utf-8"))
        data = json.loads(decoded.decode("utf-8"))
        return data
    except (ValueError, json.JSONDecodeError):
        return None


async def paginate_query(
    session: AsyncSession,
    query: Select[Any],
    limit: int,
    cursor: dict[str, Any] | None,
    order_by: list[tuple[Any, str]] | None = None,
) -> tuple[list[Any], str | None]:
    """Apply cursor-based pagination to a SQLAlchemy query.
    
    Args:
        session: Async database session
        query: SQLAlchemy select statement
        limit: Maximum number of items to return
        cursor: Decoded cursor dict with keyset values
        order_by: List of (column, direction) tuples, e.g., [(Model.ts, 'desc'), (Model.id, 'asc')]
        
    Returns:
        Tuple of (items, next_cursor_string)
    """
    if order_by is None:
        order_by = []
    
    # Apply cursor filtering for keyset pagination
    if cursor and order_by:
        conditions = []
        for i, (col, direction) in enumerate(order_by):
            field_name = col.key
            if field_name in cursor:
                cursor_val = cursor[field_name]
                
                # Build composite condition for keyset pagination
                equality_conditions = []
                for j in range(i):
                    prev_col, _ = order_by[j]
                    prev_field = prev_col.key
                    if prev_field in cursor:
                        equality_conditions.append(prev_col == cursor[prev_field])
                
                if direction == "desc":
                    inequality = col < cursor_val
                else:
                    inequality = col > cursor_val
                
                if equality_conditions:
                    from sqlalchemy import and_
                    conditions.append(and_(*equality_conditions, inequality))
                else:
                    conditions.append(inequality)
        
        if conditions:
            from sqlalchemy import or_
            query = query.where(or_(*conditions))
    
    # Apply ordering
    for col, direction in order_by:
        if direction == "desc":
            query = query.order_by(desc(col))
        else:
            query = query.order_by(asc(col))
    
    # Fetch limit + 1 to check if there are more results
    query = query.limit(limit + 1)
    result = await session.execute(query)
    items = list(result.scalars().all())
    
    # Check if there are more results
    has_more = len(items) > limit
    if has_more:
        items = items[:limit]
    
    # Generate next cursor
    next_cursor = None
    if has_more and items and order_by:
        last_item = items[-1]
        cursor_data = {}
        for col, _ in order_by:
            field_name = col.key
            cursor_data[field_name] = getattr(last_item, field_name)
        next_cursor = encode_cursor(cursor_data)
    
    return items, next_cursor

