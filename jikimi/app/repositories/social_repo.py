"""Social media repository (블라인드, 네이버 종토방)."""

import uuid
from datetime import datetime, timedelta
from typing import Literal

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import SocialPostModel
from app.repositories.base import BaseRepository
from app.schemas.common import Sentiment
from app.schemas.intelligence import SocialPost
from app.utils.pagination import decode_cursor, encode_cursor
from app.utils.time import now_utc


class SocialRepository(BaseRepository):
    """Repository for social media posts."""
    
    async def fetch_social(
        self,
        company_id: str,
        platform: str,
        start: datetime | None = None,
        end: datetime | None = None,
        limit: int = 50,
        cursor: str | None = None,
        dept: str | None = None,
    ) -> tuple[list[SocialPost], str | None]:
        """Fetch social media posts for a company.
        
        Args:
            company_id: Company identifier
            platform: Platform ("blind" or "naver_forum")
            start: Start timestamp (inclusive)
            end: End timestamp (exclusive)
            limit: Maximum number of results
            cursor: Pagination cursor
            dept: Department filter (블라인드 only)
            
        Returns:
            Tuple of (posts, next_cursor)
        """
        if self.is_memory_mode():
            return await self._fetch_social_memory(company_id, platform, start, end, limit, cursor, dept)
        
        # Build query
        query = select(SocialPostModel).where(
            SocialPostModel.company_id == company_id,
            SocialPostModel.platform == platform
        )
        
        # Apply time range filters
        if start:
            query = query.where(SocialPostModel.posted_at >= start)
        if end:
            query = query.where(SocialPostModel.posted_at < end)
        
        # Apply dept filter (블라인드 only)
        if dept:
            query = query.where(SocialPostModel.dept == dept)
        
        # Apply keyset pagination
        cursor_dict = decode_cursor(cursor)
        if cursor_dict:
            cursor_posted_at = cursor_dict.get("posted_at")
            cursor_id = cursor_dict.get("id")
            if cursor_posted_at and cursor_id:
                if isinstance(cursor_posted_at, str):
                    from app.utils.time import parse_ts
                    cursor_posted_at = parse_ts(cursor_posted_at)
                
                query = query.where(
                    or_(
                        SocialPostModel.posted_at < cursor_posted_at,
                        and_(
                            SocialPostModel.posted_at == cursor_posted_at,
                            SocialPostModel.id > cursor_id
                        )
                    )
                )
        
        # Order by (posted_at DESC, id ASC)
        query = query.order_by(SocialPostModel.posted_at.desc(), SocialPostModel.id.asc())
        
        # Fetch limit + 1
        query = query.limit(limit + 1)
        result = await self.session.execute(query)
        rows = list(result.scalars().all())
        
        # Check for more
        has_more = len(rows) > limit
        if has_more:
            rows = rows[:limit]
        
        # Convert to schema
        posts = [
            SocialPost(
                id=row.id,
                platform=row.platform,  # type: ignore
                title=row.title,
                content=row.content,
                author=row.author,
                dept=row.dept,
                posted_at=row.posted_at,
                sentiment=Sentiment(**row.sentiment) if row.sentiment else None,
                company_id=row.company_id,
                reply_count=row.reply_count,
                like_count=row.like_count,
            )
            for row in rows
        ]
        
        # Generate next cursor
        next_cursor = None
        if has_more and posts:
            last = posts[-1]
            from app.utils.time import to_rfc3339
            next_cursor = encode_cursor({
                "posted_at": to_rfc3339(last.posted_at),
                "id": last.id
            })
        
        return posts, next_cursor
    
    async def _fetch_social_memory(
        self,
        company_id: str,
        platform: str,
        start: datetime | None,
        end: datetime | None,
        limit: int,
        cursor: str | None,
        dept: str | None,
    ) -> tuple[list[SocialPost], str | None]:
        """In-memory implementation of fetch_social."""
        base_time = now_utc()
        
        # Deterministic fake data
        all_posts = [
            SocialPost(
                id=f"post_{platform}_{i}",
                platform=platform,  # type: ignore
                title=f"게시글 제목 {i}",
                content=f"게시글 내용입니다 {i}",
                author=f"익명_{i}",
                dept="경영지원" if platform == "blind" and i % 2 == 0 else None,
                posted_at=base_time - timedelta(hours=i),
                sentiment=Sentiment(label="neutral" if i % 2 == 0 else "positive", score=0.3, confidence=0.7),
                company_id=company_id,
                reply_count=i * 2,
                like_count=i * 3,
            )
            for i in range(5)
        ]
        
        # Filter by time range
        if start:
            all_posts = [p for p in all_posts if p.posted_at >= start]
        if end:
            all_posts = [p for p in all_posts if p.posted_at < end]
        
        # Filter by dept (블라인드 only)
        if dept and platform == "blind":
            all_posts = [p for p in all_posts if p.dept == dept]
        
        # Simple offset-based pagination
        cursor_dict = decode_cursor(cursor)
        offset = cursor_dict.get("offset", 0) if cursor_dict else 0
        
        page = all_posts[offset : offset + limit]
        
        next_cursor = None
        if offset + limit < len(all_posts):
            next_cursor = encode_cursor({"offset": offset + limit})
        
        return page, next_cursor
    
    async def create_social_post(
        self,
        platform: Literal["blind", "naver_forum"],
        content: str,
        company_id: str,
        posted_at: datetime,
        title: str | None = None,
        author: str | None = None,
        dept: str | None = None,
        reply_count: int = 0,
        like_count: int = 0,
        sentiment: Sentiment | None = None,
    ) -> SocialPost:
        """Create a new social media post.
        
        Args:
            platform: Social platform
            content: Post content
            company_id: Related company ID
            posted_at: Post timestamp
            title: Post title
            author: Author identifier
            dept: Department (Blind only)
            reply_count: Number of replies
            like_count: Number of likes
            sentiment: Pre-analyzed sentiment
            
        Returns:
            Created social post
        """
        post_id = f"post_{uuid.uuid4().hex[:12]}"
        
        # Convert sentiment to dict
        sentiment_dict = sentiment.model_dump() if sentiment else None
        
        # Create model
        model = SocialPostModel(
            id=post_id,
            platform=platform,
            title=title,
            content=content,
            author=author,
            dept=dept,
            posted_at=posted_at,
            sentiment=sentiment_dict,
            company_id=company_id,
            reply_count=reply_count,
            like_count=like_count,
        )
        
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        
        # Convert to schema
        return SocialPost(
            id=model.id,
            platform=model.platform,  # type: ignore
            title=model.title,
            content=model.content,
            author=model.author,
            dept=model.dept,
            posted_at=model.posted_at,
            sentiment=Sentiment(**model.sentiment) if model.sentiment else None,
            company_id=model.company_id,
            reply_count=model.reply_count,
            like_count=model.like_count,
        )


async def get_social_repo(session: AsyncSession) -> SocialRepository:
    """Factory function for SocialRepository.
    
    Args:
        session: SQLAlchemy async session
        
    Returns:
        SocialRepository instance
    """
    return SocialRepository(session)

