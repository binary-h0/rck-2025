"""Test pagination utilities."""

from app.utils.pagination import decode_cursor, encode_cursor


def test_encode_decode_dict_roundtrip() -> None:
    """Test encoding and decoding a dictionary."""
    data = {"offset": 100, "id": "abc123", "timestamp": "2025-11-02T00:00:00Z"}
    
    encoded = encode_cursor(data)
    assert encoded is not None
    assert isinstance(encoded, str)
    
    decoded = decode_cursor(encoded)
    assert decoded == data


def test_encode_decode_tuple_roundtrip() -> None:
    """Test encoding and decoding a tuple."""
    data = ("2025-11-02T00:00:00Z", "article_123")
    
    encoded = encode_cursor(data)
    assert encoded is not None
    
    decoded = decode_cursor(encoded)
    assert decoded is not None
    assert decoded["values"] == list(data)


def test_encode_none() -> None:
    """Test encoding None returns None."""
    encoded = encode_cursor(None)
    assert encoded is None


def test_decode_none() -> None:
    """Test decoding None returns None."""
    decoded = decode_cursor(None)
    assert decoded is None


def test_decode_empty_string() -> None:
    """Test decoding empty string returns None."""
    decoded = decode_cursor("")
    assert decoded is None


def test_decode_invalid_cursor() -> None:
    """Test decoding invalid cursor returns None."""
    decoded = decode_cursor("invalid-cursor-string!!!")
    assert decoded is None


def test_cursor_stability() -> None:
    """Test that cursors are stable for the same data."""
    data = {"key": "value", "number": 42}
    
    cursor1 = encode_cursor(data)
    cursor2 = encode_cursor(data)
    
    assert cursor1 == cursor2

