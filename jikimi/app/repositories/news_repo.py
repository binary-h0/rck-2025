"""News repository."""

import uuid
from datetime import datetime, timedelta

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import NewsArticleModel
from app.repositories.base import BaseRepository
from app.schemas.common import Sentiment
from app.schemas.intelligence import Article
from app.utils.pagination import decode_cursor, encode_cursor
from app.utils.time import now_utc


class NewsRepository(BaseRepository):
    """Repository for news articles."""
    
    async def fetch_news(
        self,
        company_id: str,
        start: datetime | None = None,
        end: datetime | None = None,
        limit: int = 50,
        cursor: str | None = None,
        sources: list[str] | None = None,
    ) -> tuple[list[Article], str | None]:
        """Fetch news articles for a company.
        
        Args:
            company_id: Company identifier
            start: Start timestamp (inclusive)
            end: End timestamp (exclusive)
            limit: Maximum number of results
            cursor: Pagination cursor
            sources: Filter by news sources
            
        Returns:
            Tuple of (articles, next_cursor)
        """
        if self.is_memory_mode():
            return await self._fetch_news_memory(company_id, start, end, limit, cursor, sources)
        
        # Build query
        query = select(NewsArticleModel).where(NewsArticleModel.company_id == company_id)
        
        # Apply time range filters
        if start:
            query = query.where(NewsArticleModel.published_at >= start)
        if end:
            query = query.where(NewsArticleModel.published_at < end)
        
        # Apply source filter
        if sources:
            query = query.where(NewsArticleModel.source.in_(sources))
        
        # Apply keyset pagination
        cursor_dict = decode_cursor(cursor)
        if cursor_dict:
            cursor_published_at = cursor_dict.get("published_at")
            cursor_id = cursor_dict.get("id")
            if cursor_published_at and cursor_id:
                # Parse datetime if string
                if isinstance(cursor_published_at, str):
                    from app.utils.time import parse_ts
                    cursor_published_at = parse_ts(cursor_published_at)
                
                # Keyset condition: (published_at, id) < (cursor_published_at, cursor_id)
                # For DESC ordering: published_at < cursor OR (published_at = cursor AND id > cursor)
                query = query.where(
                    or_(
                        NewsArticleModel.published_at < cursor_published_at,
                        and_(
                            NewsArticleModel.published_at == cursor_published_at,
                            NewsArticleModel.id > cursor_id
                        )
                    )
                )
        
        # Order by (published_at DESC, id ASC) for deterministic pagination
        query = query.order_by(NewsArticleModel.published_at.desc(), NewsArticleModel.id.asc())
        
        # Fetch limit + 1
        query = query.limit(limit + 1)
        result = await self.session.execute(query)
        rows = list(result.scalars().all())
        
        # Check for more results
        has_more = len(rows) > limit
        if has_more:
            rows = rows[:limit]
        
        # Convert to schema
        articles = [
            Article(
                id=row.id,
                title=row.title,
                source=row.source,
                url=row.url,
                published_at=row.published_at,
                summary=row.summary,
                sentiment=Sentiment(**row.sentiment) if row.sentiment else None,
                company_id=row.company_id,
            )
            for row in rows
        ]
        
        # Generate next cursor
        next_cursor = None
        if has_more and articles:
            last = articles[-1]
            from app.utils.time import to_rfc3339
            next_cursor = encode_cursor({
                "published_at": to_rfc3339(last.published_at),
                "id": last.id
            })
        
        return articles, next_cursor
    
    async def _fetch_news_memory(
        self,
        company_id: str,
        start: datetime | None,
        end: datetime | None,
        limit: int,
        cursor: str | None,
        sources: list[str] | None,
    ) -> tuple[list[Article], str | None]:
        """In-memory implementation of fetch_news."""
        base_time = now_utc()
        
        # Deterministic fake data
        all_articles = [
            Article(
                id=f"article_{i}",
                title=f"{company_id} 관련 뉴스 {i}",
                source="한국경제" if i % 2 == 0 else "매일경제",
                url=f"https://example.com/article/{i}",
                published_at=base_time - timedelta(hours=i),
                summary=f"기사 요약 내용 {i}",
                sentiment=Sentiment(label="positive" if i % 3 == 0 else "neutral", score=0.5, confidence=0.8),
                company_id=company_id,
            )
            for i in range(5)
        ]
        
        # Filter by time range
        if start:
            all_articles = [a for a in all_articles if a.published_at >= start]
        if end:
            all_articles = [a for a in all_articles if a.published_at < end]
        
        # Filter by sources
        if sources:
            all_articles = [a for a in all_articles if a.source in sources]
        
        # Simple offset-based pagination
        cursor_dict = decode_cursor(cursor)
        offset = cursor_dict.get("offset", 0) if cursor_dict else 0
        
        page = all_articles[offset : offset + limit]
        
        next_cursor = None
        if offset + limit < len(all_articles):
            next_cursor = encode_cursor({"offset": offset + limit})
        
        return page, next_cursor
    
    async def create_article(
        self,
        title: str,
        source: str,
        company_id: str,
        published_at: datetime,
        url: str | None = None,
        summary: str | None = None,
        sentiment: Sentiment | None = None,
    ) -> Article:
        """Create a new news article.
        
        Args:
            title: Article title
            source: News source
            company_id: Related company ID
            published_at: Publication timestamp
            url: Article URL
            summary: Article summary
            sentiment: Pre-analyzed sentiment
            
        Returns:
            Created article
        """
        article_id = f"article_{uuid.uuid4().hex[:12]}"
        
        # Convert sentiment to dict
        sentiment_dict = sentiment.model_dump() if sentiment else None
        
        # Create model
        model = NewsArticleModel(
            id=article_id,
            title=title,
            source=source,
            url=url,
            published_at=published_at,
            summary=summary,
            sentiment=sentiment_dict,
            company_id=company_id,
        )
        
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        
        # Convert to schema
        return Article(
            id=model.id,
            title=model.title,
            source=model.source,
            url=model.url,
            published_at=model.published_at,
            summary=model.summary,
            sentiment=Sentiment(**model.sentiment) if model.sentiment else None,
            company_id=model.company_id,
        )


async def get_news_repo(session: AsyncSession) -> NewsRepository:
    """Factory function for NewsRepository.
    
    Args:
        session: SQLAlchemy async session
        
    Returns:
        NewsRepository instance
    """
    return NewsRepository(session)

