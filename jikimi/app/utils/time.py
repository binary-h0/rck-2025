"""Time and timezone utilities."""

from datetime import datetime, timezone


def now_utc() -> datetime:
    """Return current UTC time as timezone-aware datetime.
    
    Returns:
        Current UTC datetime with tzinfo set
    """
    return datetime.now(timezone.utc)


def parse_ts(s: str) -> datetime:
    """Parse RFC3339 timestamp string to timezone-aware datetime.
    
    Args:
        s: RFC3339 formatted timestamp string
        
    Returns:
        Parsed datetime with tzinfo
        
    Raises:
        ValueError: If timestamp format is invalid
    """
    try:
        # Parse ISO 8601 / RFC3339 format
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        
        # Ensure timezone-aware
        if dt.tzinfo is None:
            raise ValueError("Timestamp must include timezone information")
        
        return dt
    except (ValueError, AttributeError) as e:
        raise ValueError(f"Invalid RFC3339 timestamp: {s}") from e


def to_rfc3339(dt: datetime) -> str:
    """Convert datetime to RFC3339 string.
    
    Args:
        dt: Datetime to convert (should be timezone-aware)
        
    Returns:
        RFC3339 formatted string
    """
    if dt.tzinfo is None:
        # Assume UTC if naive
        dt = dt.replace(tzinfo=timezone.utc)
    
    # Convert to UTC and format
    dt_utc = dt.astimezone(timezone.utc)
    return dt_utc.isoformat().replace("+00:00", "Z")

