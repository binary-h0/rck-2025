"""Dependency injection for database and other shared resources."""

from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings

# Global engine instance (initialized in lifespan)
_engine: AsyncEngine | None = None
_session_factory: sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    """Get the database engine.
    
    Returns:
        SQLAlchemy async engine
        
    Raises:
        RuntimeError: If engine is not initialized
    """
    if _engine is None:
        raise RuntimeError("Database engine not initialized")
    return _engine


def init_engine() -> AsyncEngine:
    """Initialize the database engine.
    
    Returns:
        SQLAlchemy async engine
    """
    global _engine, _session_factory
    
    _engine = create_async_engine(
        settings.db_dsn,
        echo=settings.log_level == "DEBUG",
        pool_pre_ping=True,
    )
    
    _session_factory = sessionmaker(
        _engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    return _engine


async def close_engine() -> None:
    """Close the database engine."""
    global _engine, _session_factory
    
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Get a database session.
    
    Yields:
        SQLAlchemy async session
    """
    if _session_factory is None:
        raise RuntimeError("Database session factory not initialized")
    
    async with _session_factory() as session:
        yield session


# Type aliases for dependency injection
DbSession = Annotated[AsyncSession, Depends(get_session)]

