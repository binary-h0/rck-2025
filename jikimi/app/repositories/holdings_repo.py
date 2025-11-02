"""Holdings repository (ESPP/우리사주)."""

from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CompanyModel, EsppHoldingModel
from app.repositories.base import BaseRepository
from app.schemas.holdings import EsppHoldings, EsppLot
from app.schemas.market import CompanyRef
from app.utils.time import now_utc, parse_ts


class HoldingsRepository(BaseRepository):
    """Repository for employee stock holdings."""
    
    async def load_espp_holdings(self, user_id: str) -> EsppHoldings | None:
        """Load ESPP holdings for a user.
        
        Args:
            user_id: User identifier
            
        Returns:
            EsppHoldings or None if user has no holdings
        """
        if self.is_memory_mode():
            return await self._load_espp_holdings_memory(user_id)
        
        # Query holdings
        query = select(EsppHoldingModel).where(EsppHoldingModel.user_id == user_id)
        result = await self.session.execute(query)
        row = result.scalar_one_or_none()
        
        if row is None:
            return None
        
        # Get company ticker
        company_query = select(CompanyModel.ticker).where(CompanyModel.id == row.company_id)
        ticker_result = await self.session.execute(company_query)
        ticker = ticker_result.scalar_one_or_none()
        
        # Parse lots from JSONB
        lots = []
        for lot_data in row.lots:
            purchase_date_str = lot_data["purchase_date"]
            # Parse datetime string
            purchase_date = parse_ts(purchase_date_str) if isinstance(purchase_date_str, str) else purchase_date_str
            
            lots.append(
                EsppLot(
                    lot_id=lot_data["lot_id"],
                    purchase_date=purchase_date,
                    quantity=int(lot_data["quantity"]),
                    purchase_price=float(lot_data["purchase_price"]),
                    cost_basis=float(lot_data["cost_basis"]),
                )
            )
        
        return EsppHoldings(
            user_id=row.user_id,
            company=CompanyRef(id=row.company_id, ticker=ticker),
            total_quantity=row.total_quantity,
            total_cost_basis=float(row.total_cost_basis),
            lots=lots,
            last_updated=row.last_updated,
        )
    
    async def _load_espp_holdings_memory(self, user_id: str) -> EsppHoldings | None:
        """In-memory implementation of load_espp_holdings."""
        base_time = now_utc()
        
        # Deterministic fake data for specific user
        if user_id == "user_123":
            lots = [
                EsppLot(
                    lot_id="lot_2024_q1",
                    purchase_date=base_time - timedelta(days=240),
                    quantity=100,
                    purchase_price=70000.0,
                    cost_basis=7000000.0,
                ),
                EsppLot(
                    lot_id="lot_2024_q2",
                    purchase_date=base_time - timedelta(days=150),
                    quantity=150,
                    purchase_price=70000.0,
                    cost_basis=10500000.0,
                ),
                EsppLot(
                    lot_id="lot_2024_q3",
                    purchase_date=base_time - timedelta(days=60),
                    quantity=80,
                    purchase_price=73000.0,
                    cost_basis=5840000.0,
                ),
            ]
            
            total_quantity = sum(lot.quantity for lot in lots)
            total_cost_basis = sum(lot.cost_basis for lot in lots)
            
            return EsppHoldings(
                user_id=user_id,
                company=CompanyRef(id="005930", ticker="005930.KS"),
                total_quantity=total_quantity,
                total_cost_basis=total_cost_basis,
                lots=lots,
                last_updated=base_time,
            )
        
        return None


async def get_holdings_repo(session: AsyncSession) -> HoldingsRepository:
    """Factory function for HoldingsRepository.
    
    Args:
        session: SQLAlchemy async session
        
    Returns:
        HoldingsRepository instance
    """
    return HoldingsRepository(session)

