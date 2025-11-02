"""Main FastAPI application."""

import logging
import time
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.config import settings
from app.deps import close_engine, init_engine
from app.errors import AppError
from app.routers import companies, holdings, intelligence, market, prediction

# Configure logging
logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager.
    
    Handles startup and shutdown:
    - Initialize database engine on startup
    - Close database engine on shutdown
    """
    # Startup
    logger.info("Starting application...")
    
    # Initialize database engine (unless in memory mode)
    if not settings.db_dsn.startswith("memory://"):
        try:
            init_engine()
            logger.info(f"Database engine initialized: {settings.db_dsn}")
        except Exception as e:
            logger.error(f"Failed to initialize database engine: {e}")
            raise
    else:
        # For memory mode, still initialize engine but with fake DSN
        init_engine()
        logger.info("Running in memory mode with fake data")
    
    logger.info("Application started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    await close_engine()
    logger.info("Application shutdown complete")


def create_app() -> FastAPI:
    """Create and configure FastAPI application.
    
    Returns:
        Configured FastAPI app instance
    """
    app = FastAPI(
        title="Equity Intelligence API",
        description="Stock intelligence and price prediction service",
        version="0.1.0",
        lifespan=lifespan,
    )
    
    # Include routers
    app.include_router(companies.router, prefix=settings.api_prefix)
    app.include_router(intelligence.router, prefix=settings.api_prefix)
    app.include_router(market.router, prefix=settings.api_prefix)
    app.include_router(prediction.router, prefix=settings.api_prefix)
    app.include_router(holdings.router, prefix=settings.api_prefix)
    
    # Exception handlers
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        """Handle application errors."""
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Handle unexpected errors."""
        logger.exception("Unexpected error occurred")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"},
        )
    
    # Middleware for request logging
    @app.middleware("http")
    async def log_requests(request: Request, call_next):  # type: ignore
        """Log all requests with timing and redact tokens."""
        start_time = time.time()
        
        # Redact authorization header in logs
        headers = dict(request.headers)
        if "authorization" in headers:
            headers["authorization"] = "[REDACTED]"
        
        # Process request
        response = await call_next(request)
        
        # Calculate latency
        latency = time.time() - start_time
        
        # Log request
        logger.info(
            f"{request.method} {request.url.path} "
            f"- {response.status_code} "
            f"- {latency:.3f}s"
        )
        
        return response
    
    # Health check endpoint
    @app.get("/healthz", tags=["health"])
    async def health_check() -> dict[str, str]:
        """Health check endpoint.
        
        Returns:
            Status message
        """
        return {"status": "ok"}
    
    return app


# Application instance
app = create_app()

