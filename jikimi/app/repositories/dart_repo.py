"""DART filings repository."""

import uuid
from datetime import datetime, timedelta

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DartFilingModel
from app.repositories.base import BaseRepository
from app.schemas.common import Sentiment
from app.schemas.intelligence import Filing
from app.utils.pagination import decode_cursor, encode_cursor
from app.utils.time import now_utc


class DartRepository(BaseRepository):
    """Repository for DART regulatory filings."""
    
    async def fetch_filings(
        self,
        company_id: str,
        start: datetime | None = None,
        end: datetime | None = None,
        limit: int = 50,
        cursor: str | None = None,
        typ: str | None = None,
    ) -> tuple[list[Filing], str | None]:
        """Fetch DART filings for a company.
        
        Args:
            company_id: Company identifier
            start: Start timestamp (inclusive)
            end: End timestamp (exclusive)
            limit: Maximum number of results
            cursor: Pagination cursor
            typ: Filing type filter
            
        Returns:
            Tuple of (filings, next_cursor)
        """
        if self.is_memory_mode():
            return await self._fetch_filings_memory(company_id, start, end, limit, cursor, typ)
        
        # Build query
        query = select(DartFilingModel).where(DartFilingModel.company_id == company_id)
        
        # Apply time range filters
        if start:
            query = query.where(DartFilingModel.filed_at >= start)
        if end:
            query = query.where(DartFilingModel.filed_at < end)
        
        # Apply type filter
        if typ:
            query = query.where(DartFilingModel.filing_type == typ)
        
        # Apply keyset pagination
        cursor_dict = decode_cursor(cursor)
        if cursor_dict:
            cursor_filed_at = cursor_dict.get("filed_at")
            cursor_id = cursor_dict.get("id")
            if cursor_filed_at and cursor_id:
                if isinstance(cursor_filed_at, str):
                    from app.utils.time import parse_ts
                    cursor_filed_at = parse_ts(cursor_filed_at)
                
                query = query.where(
                    or_(
                        DartFilingModel.filed_at < cursor_filed_at,
                        and_(
                            DartFilingModel.filed_at == cursor_filed_at,
                            DartFilingModel.id > cursor_id
                        )
                    )
                )
        
        # Order by (filed_at DESC, id ASC)
        query = query.order_by(DartFilingModel.filed_at.desc(), DartFilingModel.id.asc())
        
        # Fetch limit + 1
        query = query.limit(limit + 1)
        result = await self.session.execute(query)
        rows = list(result.scalars().all())
        
        # Check for more
        has_more = len(rows) > limit
        if has_more:
            rows = rows[:limit]
        
        # Convert to schema
        filings = [
            Filing(
                id=row.id,
                title=row.title,
                filing_type=row.filing_type,
                filed_at=row.filed_at,
                url=row.url,
                summary=row.summary,
                sentiment=Sentiment(**row.sentiment) if row.sentiment else None,
                company_id=row.company_id,
            )
            for row in rows
        ]
        
        # Generate next cursor
        next_cursor = None
        if has_more and filings:
            last = filings[-1]
            from app.utils.time import to_rfc3339
            next_cursor = encode_cursor({
                "filed_at": to_rfc3339(last.filed_at),
                "id": last.id
            })
        
        return filings, next_cursor
    
    async def _fetch_filings_memory(
        self,
        company_id: str,
        start: datetime | None,
        end: datetime | None,
        limit: int,
        cursor: str | None,
        typ: str | None,
    ) -> tuple[list[Filing], str | None]:
        """In-memory implementation of fetch_filings."""
        base_time = now_utc()
        
        # Deterministic fake data
        filing_types = ["분기보고서", "사업보고서", "주요사항보고", "공시정정", "감사보고서"]
        
        all_filings = [
            Filing(
                id=f"filing_{i}",
                title=f"{filing_types[i % len(filing_types)]} ({company_id})",
                filing_type=filing_types[i % len(filing_types)],
                filed_at=base_time - timedelta(days=i * 7),
                url=f"https://dart.fss.or.kr/filing/{i}",
                summary=f"공시 요약 내용 {i}",
                sentiment=Sentiment(label="neutral", score=0.0, confidence=0.85),
                company_id=company_id,
            )
            for i in range(5)
        ]
        
        # Filter by time range
        if start:
            all_filings = [f for f in all_filings if f.filed_at >= start]
        if end:
            all_filings = [f for f in all_filings if f.filed_at < end]
        
        # Filter by type
        if typ:
            all_filings = [f for f in all_filings if f.filing_type == typ]
        
        # Simple offset-based pagination
        cursor_dict = decode_cursor(cursor)
        offset = cursor_dict.get("offset", 0) if cursor_dict else 0
        
        page = all_filings[offset : offset + limit]
        
        next_cursor = None
        if offset + limit < len(all_filings):
            next_cursor = encode_cursor({"offset": offset + limit})
        
        return page, next_cursor
    
    async def create_filing(
        self,
        title: str,
        filing_type: str,
        company_id: str,
        filed_at: datetime,
        url: str | None = None,
        summary: str | None = None,
        sentiment: Sentiment | None = None,
    ) -> Filing:
        """Create a new DART filing.
        
        Args:
            title: Filing title
            filing_type: Filing type code
            company_id: Related company ID
            filed_at: Filing timestamp
            url: DART filing URL
            summary: Filing summary
            sentiment: Pre-analyzed sentiment
            
        Returns:
            Created filing
        """
        filing_id = f"filing_{uuid.uuid4().hex[:12]}"
        
        # Convert sentiment to dict
        sentiment_dict = sentiment.model_dump() if sentiment else None
        
        # Create model
        model = DartFilingModel(
            id=filing_id,
            title=title,
            filing_type=filing_type,
            filed_at=filed_at,
            url=url,
            summary=summary,
            sentiment=sentiment_dict,
            company_id=company_id,
        )
        
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        
        # Convert to schema
        return Filing(
            id=model.id,
            title=model.title,
            filing_type=model.filing_type,
            filed_at=model.filed_at,
            url=model.url,
            summary=model.summary,
            sentiment=Sentiment(**model.sentiment) if model.sentiment else None,
            company_id=model.company_id,
        )


async def get_dart_repo(session: AsyncSession) -> DartRepository:
    """Factory function for DartRepository.
    
    Args:
        session: SQLAlchemy async session
        
    Returns:
        DartRepository instance
    """
    return DartRepository(session)

