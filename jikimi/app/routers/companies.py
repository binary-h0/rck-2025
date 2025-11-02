"""Company endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.config import settings
from app.deps import DbSession
from app.errors import NotFound
from app.repositories.companies_repo import CompaniesRepository, get_companies_repo
from app.schemas.company import Company, PaginatedCompanies

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("", response_model=PaginatedCompanies)
async def search_companies(
    session: DbSession,
    q: Annotated[str | None, Query(description="Search query")] = None,
    limit: Annotated[int, Query(ge=1, le=settings.max_page_size)] = 50,
    cursor: Annotated[str | None, Query(description="Pagination cursor")] = None,
) -> PaginatedCompanies:
    """Search for companies.
    
    Args:
        session: Database session
        q: Optional search query
        limit: Maximum results per page
        cursor: Pagination cursor
        
    Returns:
        Paginated list of companies
    """
    repo = await get_companies_repo(session)
    companies, next_cursor = await repo.search_companies(q=q, limit=limit, cursor=cursor)
    
    return PaginatedCompanies(data=companies, next_cursor=next_cursor)


@router.get("/{company_id}", response_model=Company)
async def get_company(
    company_id: str,
    session: DbSession,
) -> Company:
    """Get a specific company by ID.
    
    Args:
        company_id: Company identifier
        session: Database session
        
    Returns:
        Company information
        
    Raises:
        NotFound: If company not found
    """
    repo = await get_companies_repo(session)
    company = await repo.get_company(company_id)
    
    if company is None:
        raise NotFound(f"Company {company_id} not found")
    
    return company

