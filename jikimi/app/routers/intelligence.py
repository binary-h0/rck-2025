"""Intelligence data endpoints (news, social, filings)."""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Body, status

from app.auth import parse_bearer_token
from app.config import Settings, settings
from app.deps import DbSession
from app.errors import NotFoundError
from app.repositories.companies_repo import CompaniesRepository, get_companies_repo
from app.repositories.dart_repo import DartRepository, get_dart_repo
from app.repositories.news_repo import NewsRepository, get_news_repo
from app.repositories.social_repo import SocialRepository, get_social_repo
from app.schemas.intelligence import (
    Article,
    CreateArticleRequest,
    CreateFilingRequest,
    CreateSocialPostRequest,
    Filing,
    PaginatedArticles,
    PaginatedFilings,
    PaginatedSocialPosts,
    SocialPost,
)
from app.services.sentiment import analyze_sentiment
from app.utils.time import parse_ts

router = APIRouter(prefix="/companies/{company_id}", tags=["intelligence"])


@router.get("/news", response_model=PaginatedArticles)
async def get_news(
    company_id: Annotated[str, Path(description="Company identifier")],
    session: DbSession,
    start: Annotated[str | None, Query(description="Start time (RFC3339)")] = None,
    end: Annotated[str | None, Query(description="End time (RFC3339)")] = None,
    limit: Annotated[int, Query(ge=1, le=settings.max_page_size)] = 50,
    cursor: Annotated[str | None, Query(description="Pagination cursor")] = None,
    sources: Annotated[list[str] | None, Query(description="Filter by sources")] = None,
) -> PaginatedArticles:
    """Get news articles for a company.
    
    Args:
        company_id: Company identifier
        session: Database session
        start: Start timestamp (inclusive)
        end: End timestamp (exclusive)
        limit: Maximum results per page
        cursor: Pagination cursor
        sources: Filter by news sources
        
    Returns:
        Paginated news articles
    """
    start_dt: datetime | None = parse_ts(start) if start else None
    end_dt: datetime | None = parse_ts(end) if end else None
    
    repo = await get_news_repo(session)
    articles, next_cursor = await repo.fetch_news(
        company_id=company_id,
        start=start_dt,
        end=end_dt,
        limit=limit,
        cursor=cursor,
        sources=sources,
    )
    
    return PaginatedArticles(data=articles, next_cursor=next_cursor)


@router.get("/blind-posts", response_model=PaginatedSocialPosts)
async def get_blind_posts(
    company_id: Annotated[str, Path(description="Company identifier")],
    session: DbSession,
    start: Annotated[str | None, Query(description="Start time (RFC3339)")] = None,
    end: Annotated[str | None, Query(description="End time (RFC3339)")] = None,
    limit: Annotated[int, Query(ge=1, le=settings.max_page_size)] = 50,
    cursor: Annotated[str | None, Query(description="Pagination cursor")] = None,
    dept: Annotated[str | None, Query(description="Filter by department")] = None,
) -> PaginatedSocialPosts:
    """Get 블라인드 posts for a company.
    
    Args:
        company_id: Company identifier
        session: Database session
        start: Start timestamp (inclusive)
        end: End timestamp (exclusive)
        limit: Maximum results per page
        cursor: Pagination cursor
        dept: Filter by department
        
    Returns:
        Paginated social posts
    """
    start_dt: datetime | None = parse_ts(start) if start else None
    end_dt: datetime | None = parse_ts(end) if end else None
    
    repo = await get_social_repo(session)
    posts, next_cursor = await repo.fetch_social(
        company_id=company_id,
        platform="blind",
        start=start_dt,
        end=end_dt,
        limit=limit,
        cursor=cursor,
        dept=dept,
    )
    
    return PaginatedSocialPosts(data=posts, next_cursor=next_cursor)


@router.get("/naver-forum", response_model=PaginatedSocialPosts)
async def get_naver_forum(
    company_id: Annotated[str, Path(description="Company identifier")],
    session: DbSession,
    start: Annotated[str | None, Query(description="Start time (RFC3339)")] = None,
    end: Annotated[str | None, Query(description="End time (RFC3339)")] = None,
    limit: Annotated[int, Query(ge=1, le=settings.max_page_size)] = 50,
    cursor: Annotated[str | None, Query(description="Pagination cursor")] = None,
) -> PaginatedSocialPosts:
    """Get 네이버 종토방 posts for a company.
    
    Args:
        company_id: Company identifier
        session: Database session
        start: Start timestamp (inclusive)
        end: End timestamp (exclusive)
        limit: Maximum results per page
        cursor: Pagination cursor
        
    Returns:
        Paginated social posts
    """
    start_dt: datetime | None = parse_ts(start) if start else None
    end_dt: datetime | None = parse_ts(end) if end else None
    
    repo = await get_social_repo(session)
    posts, next_cursor = await repo.fetch_social(
        company_id=company_id,
        platform="naver_forum",
        start=start_dt,
        end=end_dt,
        limit=limit,
        cursor=cursor,
    )
    
    return PaginatedSocialPosts(data=posts, next_cursor=next_cursor)


@router.get("/dart-filings", response_model=PaginatedFilings)
async def get_dart_filings(
    company_id: Annotated[str, Path(description="Company identifier")],
    session: DbSession,
    start: Annotated[str | None, Query(description="Start time (RFC3339)")] = None,
    end: Annotated[str | None, Query(description="End time (RFC3339)")] = None,
    limit: Annotated[int, Query(ge=1, le=settings.max_page_size)] = 50,
    cursor: Annotated[str | None, Query(description="Pagination cursor")] = None,
    type: Annotated[str | None, Query(description="Filter by filing type")] = None,
) -> PaginatedFilings:
    """Get DART filings for a company.
    
    Args:
        company_id: Company identifier
        session: Database session
        start: Start timestamp (inclusive)
        end: End timestamp (exclusive)
        limit: Maximum results per page
        cursor: Pagination cursor
        type: Filter by filing type
        
    Returns:
        Paginated DART filings
    """
    start_dt: datetime | None = parse_ts(start) if start else None
    end_dt: datetime | None = parse_ts(end) if end else None
    
    repo = await get_dart_repo(session)
    filings, next_cursor = await repo.fetch_filings(
        company_id=company_id,
        start=start_dt,
        end=end_dt,
        limit=limit,
        cursor=cursor,
        typ=type,
    )
    
    return PaginatedFilings(data=filings, next_cursor=next_cursor)


# ========== POST endpoints for creating intelligence data ==========

@router.post("/news", response_model=Article, status_code=status.HTTP_201_CREATED)
async def create_news_article(
    company_id: Annotated[str, Path(description="Company identifier")],
    request: Annotated[CreateArticleRequest, Body()],
    session: DbSession,
    token: Annotated[str | None, Depends(parse_bearer_token)] = None,
) -> Article:
    """Create a new news article with automatic sentiment analysis.
    
    This endpoint will:
    1. Validate that the company exists
    2. Analyze sentiment of the article using ChatGPT
    3. Store the article with the sentiment in the database
    
    Authorization is optional. If provided, token will be validated.
    
    Args:
        company_id: Company identifier (must match request.company_id)
        request: Article creation request
        session: Database session
        token: Optional bearer token for authentication
        
    Returns:
        Created article with sentiment
        
    Raises:
        NotFoundError: If company doesn't exist
        ValidationError: If company_id doesn't match
    """
    # Validate company_id matches
    if company_id != request.company_id:
        from app.errors import ValidationError
        raise ValidationError("company_id in path must match company_id in body")
    
    # Validate company exists
    companies_repo = await get_companies_repo(session)
    company = await companies_repo.get_company(company_id)
    if company is None:
        raise NotFoundError(f"Company {company_id} not found")
    
    # Analyze sentiment
    text = f"{request.title}\n\n{request.summary or ''}"
    sentiment = await analyze_sentiment(
        text=text,
        content_type="news",
        company_name=company.name,
        settings=Settings(),
    )
    
    # Create article
    news_repo = await get_news_repo(session)
    article = await news_repo.create_article(
        title=request.title,
        source=request.source,
        company_id=company_id,
        published_at=request.published_at,
        url=request.url,
        summary=request.summary,
        sentiment=sentiment,
    )
    
    return article


@router.post("/social", response_model=SocialPost, status_code=status.HTTP_201_CREATED)
async def create_social_post(
    company_id: Annotated[str, Path(description="Company identifier")],
    request: Annotated[CreateSocialPostRequest, Body()],
    session: DbSession,
    token: Annotated[str | None, Depends(parse_bearer_token)] = None,
) -> SocialPost:
    """Create a new social media post with automatic sentiment analysis.
    
    This endpoint will:
    1. Validate that the company exists
    2. Analyze sentiment of the post using ChatGPT
    3. Store the post with the sentiment in the database
    
    Authorization is optional. If provided, token will be validated.
    
    Args:
        company_id: Company identifier (must match request.company_id)
        request: Social post creation request
        session: Database session
        token: Optional bearer token for authentication
        
    Returns:
        Created social post with sentiment
        
    Raises:
        NotFoundError: If company doesn't exist
        ValidationError: If company_id doesn't match
    """
    # Validate company_id matches
    if company_id != request.company_id:
        from app.errors import ValidationError
        raise ValidationError("company_id in path must match company_id in body")
    
    # Validate company exists
    companies_repo = await get_companies_repo(session)
    company = await companies_repo.get_company(company_id)
    if company is None:
        raise NotFoundError(f"Company {company_id} not found")
    
    # Analyze sentiment
    text = f"{request.title or ''}\n\n{request.content}"
    sentiment = await analyze_sentiment(
        text=text,
        content_type="social",
        company_name=company.name,
        settings=Settings(),
    )
    
    # Create social post
    social_repo = await get_social_repo(session)
    post = await social_repo.create_social_post(
        platform=request.platform,
        content=request.content,
        company_id=company_id,
        posted_at=request.posted_at,
        title=request.title,
        author=request.author,
        dept=request.dept,
        reply_count=request.reply_count,
        like_count=request.like_count,
        sentiment=sentiment,
    )
    
    return post


@router.post("/dart-filings", response_model=Filing, status_code=status.HTTP_201_CREATED)
async def create_dart_filing(
    company_id: Annotated[str, Path(description="Company identifier")],
    request: Annotated[CreateFilingRequest, Body()],
    session: DbSession,
    token: Annotated[str | None, Depends(parse_bearer_token)] = None,
) -> Filing:
    """Create a new DART filing with automatic sentiment analysis.
    
    This endpoint will:
    1. Validate that the company exists
    2. Analyze sentiment of the filing using ChatGPT
    3. Store the filing with the sentiment in the database
    
    Authorization is optional. If provided, token will be validated.
    
    Args:
        company_id: Company identifier (must match request.company_id)
        request: Filing creation request
        session: Database session
        token: Optional bearer token for authentication
        
    Returns:
        Created filing with sentiment
        
    Raises:
        NotFoundError: If company doesn't exist
        ValidationError: If company_id doesn't match
    """
    # Validate company_id matches
    if company_id != request.company_id:
        from app.errors import ValidationError
        raise ValidationError("company_id in path must match company_id in body")
    
    # Validate company exists
    companies_repo = await get_companies_repo(session)
    company = await companies_repo.get_company(company_id)
    if company is None:
        raise NotFoundError(f"Company {company_id} not found")
    
    # Analyze sentiment
    text = f"{request.title}\n\n{request.summary or ''}"
    sentiment = await analyze_sentiment(
        text=text,
        content_type="filing",
        company_name=company.name,
        settings=Settings(),
    )
    
    # Create filing
    dart_repo = await get_dart_repo(session)
    filing = await dart_repo.create_filing(
        title=request.title,
        filing_type=request.filing_type,
        company_id=company_id,
        filed_at=request.filed_at,
        url=request.url,
        summary=request.summary,
        sentiment=sentiment,
    )
    
    return filing

