"""Intelligence data schemas (news, social, filings)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import Sentiment


class Article(BaseModel):
    """News article with sentiment."""
    
    id: str = Field(description="Unique article identifier")
    title: str = Field(description="Article title")
    source: str = Field(description="News source")
    url: str | None = Field(default=None, description="Article URL")
    published_at: datetime = Field(description="Publication timestamp (UTC)")
    summary: str | None = Field(default=None, description="Article summary")
    sentiment: Sentiment | None = Field(default=None, description="Stock-impact sentiment")
    company_id: str = Field(description="Related company ID")

    model_config = {"json_schema_extra": {"example": {
        "id": "article_123",
        "title": "삼성전자, 신규 반도체 공장 건설 발표",
        "source": "한국경제",
        "url": "https://example.com/article/123",
        "published_at": "2025-11-02T10:00:00Z",
        "summary": "삼성전자가 새로운 반도체 생산시설 건설을 발표했습니다.",
        "sentiment": {"label": "positive", "score": 0.8, "confidence": 0.9},
        "company_id": "005930"
    }}}


class SocialPost(BaseModel):
    """Social media post from 블라인드 or 네이버 종토방."""
    
    id: str = Field(description="Unique post identifier")
    platform: Literal["blind", "naver_forum"] = Field(description="Social platform")
    title: str | None = Field(default=None, description="Post title")
    content: str = Field(description="Post content")
    author: str | None = Field(default=None, description="Anonymous author identifier")
    dept: str | None = Field(default=None, description="Department (블라인드 only)")
    posted_at: datetime = Field(description="Post timestamp (UTC)")
    sentiment: Sentiment | None = Field(default=None, description="Stock-impact sentiment")
    company_id: str = Field(description="Related company ID")
    reply_count: int = Field(default=0, description="Number of replies")
    like_count: int = Field(default=0, description="Number of likes")

    model_config = {"json_schema_extra": {"example": {
        "id": "post_456",
        "platform": "blind",
        "title": "올해 실적 전망",
        "content": "올해 실적이 작년보다 좋을 것 같습니다.",
        "author": "익명_사원",
        "dept": "경영지원",
        "posted_at": "2025-11-01T15:30:00Z",
        "sentiment": {"label": "positive", "score": 0.6, "confidence": 0.7},
        "company_id": "005930",
        "reply_count": 5,
        "like_count": 12
    }}}


class Filing(BaseModel):
    """DART regulatory filing."""
    
    id: str = Field(description="Unique filing identifier")
    title: str = Field(description="Filing title")
    filing_type: str = Field(description="Filing type code")
    filed_at: datetime = Field(description="Filing timestamp (UTC)")
    url: str | None = Field(default=None, description="DART filing URL")
    summary: str | None = Field(default=None, description="Filing summary")
    sentiment: Sentiment | None = Field(default=None, description="Stock-impact sentiment")
    company_id: str = Field(description="Related company ID")

    model_config = {"json_schema_extra": {"example": {
        "id": "filing_789",
        "title": "분기보고서 (2025.09)",
        "filing_type": "분기보고서",
        "filed_at": "2025-11-01T09:00:00Z",
        "url": "https://dart.fss.or.kr/filing/789",
        "summary": "2025년 3분기 실적 보고",
        "sentiment": {"label": "neutral", "score": 0.0, "confidence": 0.8},
        "company_id": "005930"
    }}}


class PaginatedArticles(BaseModel):
    """Paginated list of news articles."""
    
    data: list[Article] = Field(description="List of articles")
    next_cursor: str | None = Field(default=None, description="Cursor for next page")


class PaginatedSocialPosts(BaseModel):
    """Paginated list of social posts."""
    
    data: list[SocialPost] = Field(description="List of social posts")
    next_cursor: str | None = Field(default=None, description="Cursor for next page")


class PaginatedFilings(BaseModel):
    """Paginated list of DART filings."""
    
    data: list[Filing] = Field(description="List of filings")
    next_cursor: str | None = Field(default=None, description="Cursor for next page")


# ========== Request schemas for creating intelligence data ==========

class CreateArticleRequest(BaseModel):
    """Request to create a news article."""
    
    title: str = Field(min_length=1, max_length=500, description="Article title")
    source: str = Field(min_length=1, max_length=100, description="News source")
    url: str | None = Field(default=None, max_length=1000, description="Article URL")
    published_at: datetime = Field(description="Publication timestamp (UTC)")
    summary: str | None = Field(default=None, max_length=5000, description="Article summary")
    company_id: str = Field(min_length=1, max_length=20, description="Related company ID (stock code)")
    
    model_config = {"json_schema_extra": {"example": {
        "title": "삼성전자, 신규 반도체 공장 건설 발표",
        "source": "한국경제",
        "url": "https://example.com/article/123",
        "published_at": "2025-11-02T10:00:00Z",
        "summary": "삼성전자가 새로운 반도체 생산시설 건설을 발표했습니다.",
        "company_id": "005930"
    }}}


class CreateSocialPostRequest(BaseModel):
    """Request to create a social media post."""
    
    platform: Literal["blind", "naver_forum"] = Field(description="Social platform")
    title: str | None = Field(default=None, max_length=200, description="Post title")
    content: str = Field(min_length=1, max_length=10000, description="Post content")
    author: str | None = Field(default=None, max_length=100, description="Anonymous author identifier")
    dept: str | None = Field(default=None, max_length=100, description="Department (블라인드 only)")
    posted_at: datetime = Field(description="Post timestamp (UTC)")
    company_id: str = Field(min_length=1, max_length=20, description="Related company ID (stock code)")
    reply_count: int = Field(default=0, ge=0, description="Number of replies")
    like_count: int = Field(default=0, ge=0, description="Number of likes")
    
    @field_validator('dept')
    @classmethod
    def validate_dept(cls, v: str | None, info) -> str | None:
        """Validate that dept is only provided for blind platform."""
        platform = info.data.get('platform')
        if platform == 'naver_forum' and v is not None:
            raise ValueError("dept field is only valid for blind platform")
        return v
    
    model_config = {"json_schema_extra": {"example": {
        "platform": "blind",
        "title": "올해 실적 전망",
        "content": "올해 실적이 작년보다 좋을 것 같습니다.",
        "author": "익명_사원",
        "dept": "경영지원",
        "posted_at": "2025-11-01T15:30:00Z",
        "company_id": "005930",
        "reply_count": 5,
        "like_count": 12
    }}}


class CreateFilingRequest(BaseModel):
    """Request to create a DART filing."""
    
    title: str = Field(min_length=1, max_length=500, description="Filing title")
    filing_type: str = Field(min_length=1, max_length=100, description="Filing type code")
    filed_at: datetime = Field(description="Filing timestamp (UTC)")
    url: str | None = Field(default=None, max_length=1000, description="DART filing URL")
    summary: str | None = Field(default=None, max_length=5000, description="Filing summary")
    company_id: str = Field(min_length=1, max_length=20, description="Related company ID (stock code)")
    
    model_config = {"json_schema_extra": {"example": {
        "title": "분기보고서 (2025.09)",
        "filing_type": "분기보고서",
        "filed_at": "2025-11-01T09:00:00Z",
        "url": "https://dart.fss.or.kr/filing/789",
        "summary": "2025년 3분기 실적 보고",
        "company_id": "005930"
    }}}

