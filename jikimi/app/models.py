"""SQLAlchemy models for database tables."""

from datetime import datetime

from sqlalchemy import TIMESTAMP, BigInteger, CheckConstraint, Integer, Numeric, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all models."""
    pass


class CompanyModel(Base):
    """Company master data."""
    
    __tablename__ = "companies"
    
    id: Mapped[str] = mapped_column(primary_key=True)
    ticker: Mapped[str | None] = mapped_column()
    name: Mapped[str] = mapped_column()
    sector: Mapped[str | None] = mapped_column()
    market: Mapped[str | None] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class NewsArticleModel(Base):
    """News articles with sentiment."""
    
    __tablename__ = "news_articles"
    
    id: Mapped[str] = mapped_column(primary_key=True)
    company_id: Mapped[str] = mapped_column()
    title: Mapped[str] = mapped_column(Text)
    source: Mapped[str] = mapped_column()
    url: Mapped[str | None] = mapped_column(Text)
    published_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True))
    summary: Mapped[str | None] = mapped_column(Text)
    content: Mapped[str | None] = mapped_column(Text)
    sentiment: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)


class SocialPostModel(Base):
    """Social media posts from 블라인드 and 네이버 종토방."""
    
    __tablename__ = "social_posts"
    
    id: Mapped[str] = mapped_column(primary_key=True)
    company_id: Mapped[str] = mapped_column()
    platform: Mapped[str] = mapped_column()
    title: Mapped[str | None] = mapped_column(Text)
    content: Mapped[str] = mapped_column(Text)
    author: Mapped[str | None] = mapped_column()
    dept: Mapped[str | None] = mapped_column()
    posted_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True))
    sentiment: Mapped[dict | None] = mapped_column(JSONB)
    reply_count: Mapped[int] = mapped_column(Integer, default=0)
    like_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    
    __table_args__ = (
        CheckConstraint("platform IN ('blind', 'naver_forum')", name="check_platform"),
    )


class DartFilingModel(Base):
    """DART regulatory filings."""
    
    __tablename__ = "dart_filings"
    
    id: Mapped[str] = mapped_column(primary_key=True)
    company_id: Mapped[str] = mapped_column()
    title: Mapped[str] = mapped_column(Text)
    filing_type: Mapped[str] = mapped_column()
    filed_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True))
    url: Mapped[str | None] = mapped_column(Text)
    summary: Mapped[str | None] = mapped_column(Text)
    content: Mapped[str | None] = mapped_column(Text)
    sentiment: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)


class PriceCandleModel(Base):
    """OHLCV price data."""
    
    __tablename__ = "price_candles"
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    company_id: Mapped[str] = mapped_column()
    timestamp: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True))
    interval: Mapped[str] = mapped_column()
    open: Mapped[float] = mapped_column(Numeric(20, 4))
    high: Mapped[float] = mapped_column(Numeric(20, 4))
    low: Mapped[float] = mapped_column(Numeric(20, 4))
    close: Mapped[float] = mapped_column(Numeric(20, 4))
    volume: Mapped[int] = mapped_column(BigInteger)
    adjust_type: Mapped[str] = mapped_column(default="none")
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint("company_id", "timestamp", "interval", "adjust_type", name="uq_price_candles"),
        CheckConstraint("interval IN ('1d', '1h', '5m', '1m')", name="check_interval"),
        CheckConstraint("adjust_type IN ('none', 'split', 'total_return')", name="check_adjust_type"),
    )


class EsppHoldingModel(Base):
    """Employee stock purchase plan holdings."""
    
    __tablename__ = "espp_holdings"
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[str] = mapped_column()
    company_id: Mapped[str] = mapped_column()
    lots: Mapped[dict] = mapped_column(JSONB)
    total_quantity: Mapped[int] = mapped_column(Integer, default=0)
    total_cost_basis: Mapped[float] = mapped_column(Numeric(20, 2), default=0.0)
    last_updated: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint("user_id", "company_id", name="uq_espp_holdings"),
    )

