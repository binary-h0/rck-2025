"""Company repository."""

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CompanyModel
from app.repositories.base import BaseRepository
from app.schemas.company import Company
from app.utils.pagination import decode_cursor, encode_cursor


class CompaniesRepository(BaseRepository):
    """Repository for company data."""
    
    async def search_companies(
        self,
        q: str | None = None,
        limit: int = 50,
        cursor: str | None = None,
    ) -> tuple[list[Company], str | None]:
        """Search for companies.
        
        Args:
            q: Search query string
            limit: Maximum number of results
            cursor: Pagination cursor
            
        Returns:
            Tuple of (companies, next_cursor)
        """
        if self.is_memory_mode():
            return await self._search_companies_memory(q, limit, cursor)
        
        # Build query
        query = select(CompanyModel)
        
        # Apply search filter
        if q:
            search_term = f"%{q}%"
            query = query.where(
                or_(
                    CompanyModel.name.ilike(search_term),
                    CompanyModel.ticker.ilike(search_term),
                    CompanyModel.id.ilike(search_term),
                )
            )
        
        # Apply cursor for pagination (simple offset for companies since they don't have timestamps)
        cursor_dict = decode_cursor(cursor)
        offset = cursor_dict.get("offset", 0) if cursor_dict else 0
        
        # Order by ID for consistency
        query = query.order_by(CompanyModel.id)
        
        # Fetch limit + 1 to check for more results
        query = query.offset(offset).limit(limit + 1)
        result = await self.session.execute(query)
        rows = list(result.scalars().all())
        
        # Check if there are more results
        has_more = len(rows) > limit
        if has_more:
            rows = rows[:limit]
        
        # Convert to schema
        companies = [
            Company(
                id=row.id,
                ticker=row.ticker,
                name=row.name,
                sector=row.sector,
                market=row.market,
            )
            for row in rows
        ]
        
        # Generate next cursor
        next_cursor = None
        if has_more:
            next_cursor = encode_cursor({"offset": offset + limit})
        
        return companies, next_cursor
    
    async def get_company(self, company_id: str) -> Company | None:
        """Get a company by ID.
        
        Args:
            company_id: Company identifier
            
        Returns:
            Company or None if not found
        """
        if self.is_memory_mode():
            return await self._get_company_memory(company_id)
        
        # Query by ID
        query = select(CompanyModel).where(CompanyModel.id == company_id)
        result = await self.session.execute(query)
        row = result.scalar_one_or_none()
        
        if row is None:
            return None
        
        return Company(
            id=row.id,
            ticker=row.ticker,
            name=row.name,
            sector=row.sector,
            market=row.market,
        )
    
    async def _search_companies_memory(
        self,
        q: str | None,
        limit: int,
        cursor: str | None,
    ) -> tuple[list[Company], str | None]:
        """In-memory implementation of search_companies."""
        # Deterministic fake data
        all_companies = [
            Company(id="005930", ticker="005930.KS", name="삼성전자", sector="Technology", market="KOSPI"),
            Company(id="000660", ticker="000660.KS", name="SK하이닉스", sector="Technology", market="KOSPI"),
            Company(id="035420", ticker="035420.KS", name="NAVER", sector="Technology", market="KOSPI"),
            Company(id="051910", ticker="051910.KS", name="LG화학", sector="Chemical", market="KOSPI"),
            Company(id="006400", ticker="006400.KS", name="삼성SDI", sector="Technology", market="KOSPI"),
        ]
        
        # Filter by query
        if q:
            q_lower = q.lower()
            all_companies = [
                c for c in all_companies
                if q_lower in c.name.lower() or q_lower in c.id or (c.ticker and q_lower in c.ticker.lower())
            ]
        
        # Simple offset-based pagination for in-memory mode
        cursor_dict = decode_cursor(cursor)
        offset = cursor_dict.get("offset", 0) if cursor_dict else 0
        
        # Get page
        page = all_companies[offset : offset + limit]
        
        # Generate next cursor
        next_cursor = None
        if offset + limit < len(all_companies):
            next_cursor = encode_cursor({"offset": offset + limit})
        
        return page, next_cursor
    
    async def _get_company_memory(self, company_id: str) -> Company | None:
        """In-memory implementation of get_company."""
        companies_map = {
            "005930": Company(id="005930", ticker="005930.KS", name="삼성전자", sector="Technology", market="KOSPI"),
            "000660": Company(id="000660", ticker="000660.KS", name="SK하이닉스", sector="Technology", market="KOSPI"),
            "035420": Company(id="035420", ticker="035420.KS", name="NAVER", sector="Technology", market="KOSPI"),
            "051910": Company(id="051910", ticker="051910.KS", name="LG화학", sector="Chemical", market="KOSPI"),
            "006400": Company(id="006400", ticker="006400.KS", name="삼성SDI", sector="Technology", market="KOSPI"),
        }
        return companies_map.get(company_id)


async def get_companies_repo(session: AsyncSession) -> CompaniesRepository:
    """Factory function for CompaniesRepository.
    
    Args:
        session: SQLAlchemy async session
        
    Returns:
        CompaniesRepository instance
    """
    return CompaniesRepository(session)

