"""Base repository functionality."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings


class BaseRepository:
    """Base repository with common functionality."""
    
    def __init__(self, session: AsyncSession) -> None:
        """Initialize repository.
        
        Args:
            session: SQLAlchemy async session
        """
        self.session = session
    
    @staticmethod
    def is_memory_mode() -> bool:
        """Check if running in in-memory fake data mode.
        
        Returns:
            True if DB_DSN starts with "memory://"
        """
        return settings.db_dsn.startswith("memory://")

