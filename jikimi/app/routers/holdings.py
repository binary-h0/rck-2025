"""Holdings endpoints (ESPP/우리사주)."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth import require_scope
from app.deps import DbSession
from app.errors import NotFound
from app.repositories.holdings_repo import HoldingsRepository, get_holdings_repo
from app.schemas.holdings import EsppHoldings

router = APIRouter(prefix="/me", tags=["holdings"])


@router.get("/holdings/espp", response_model=EsppHoldings)
async def get_espp_holdings(
    user_id: Annotated[str, require_scope("holdings.read")],
    session: DbSession,
) -> EsppHoldings:
    """Get authenticated user's ESPP holdings.
    
    Requires: holdings.read scope
    
    Args:
        user_id: Authenticated user ID from token
        session: Database session
        
    Returns:
        User's ESPP holdings with purchase lots
        
    Raises:
        NotFound: If user has no ESPP holdings
    """
    repo = await get_holdings_repo(session)
    holdings = await repo.load_espp_holdings(user_id)
    
    if holdings is None:
        raise NotFound(f"No ESPP holdings found for user {user_id}")
    
    return holdings

