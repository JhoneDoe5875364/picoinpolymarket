from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, List, Literal, Optional, Tuple

from sqlalchemy import func, insert, inspect as sa_inspect, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables.order import Order
from app.repositories.markets import get_market_token

_ORDER_COLUMNS: dict[str, Any] = {
    "created_at": Order.created_at,
    "updated_at": Order.updated_at,
    "status": Order.status,
}


def order_to_dict(o: Order) -> dict[str, Any]:
    """Return mapped ``Order`` columns."""
    d = {col.key: getattr(o, col.key) for col in sa_inspect(Order).mapper.columns}
    return d


async def get_user_orders(
    session: AsyncSession,
    *,
    user_id: int,
) -> Tuple[List[dict[str, Any]], int]:
    base_conditions = [Order.user_id == user_id]
    stmt = select(Order).where(*base_conditions)
    result = await session.execute(stmt)
    rows = result.scalars().all()
    return [order_to_dict(row) for row in rows]


async def get_order_by_id(
    session: AsyncSession,
    *,
    order_id: int,
) -> Optional[dict[str, Any]]:
    stmt = select(Order).where(Order.id == order_id)
    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    return order_to_dict(row) if row else None


async def create_order(
    session: AsyncSession,
    *,
    user_id: int,
    market_id: int,
    side: Literal["BUY", "SELL"],
    outcome: Literal["YES", "NO"],
    price: float,
    size: float,
) -> dict[str, Any]:
    token = await get_market_token(session, market_id, outcome)
    pi_amount = price * size
    stmt = insert(Order).values(
        user_id=user_id, 
        market_id=market_id, 
        token=token,
        side=side, 
        outcome=outcome, 
        price=Decimal(str(price)), 
        size=Decimal(str(size)), 
        pi_amount=Decimal(str(pi_amount)),
        status="PENDING",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    ).returning(Order)
    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    if not row:
        raise ValueError("Failed to create order")
    await session.commit()
    return order_to_dict(row)


async def cancel_order(
    session: AsyncSession,
    *,
    order_id: int,
) -> dict[str, Any]:
    current_order = await get_order_by_id(session, order_id=order_id)
    if not current_order:
        raise LookupError("Order not found")

    if current_order["status"] != "PENDING":
        raise ValueError("Only PENDING orders can be cancelled")

    stmt = (
        update(Order)
        .where(Order.id == order_id)
        .values(status="CANCELLED", updated_at=datetime.now(timezone.utc))
        .returning(Order)
    )
    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    if not row:
        raise LookupError("Order not found")
    await session.commit()
    return order_to_dict(row)


async def cancel_orders(
    session: AsyncSession,
    *,
    order_ids: List[int],
) -> dict[str, Any]:
    unique_ids = list(dict.fromkeys(order_ids))
    if not unique_ids:
        return {
            "requested_count": 0,
            "unique_count": 0,
            "ignored_duplicate_count": 0,
            "cancelled_count": 0,
            "cancelled_ids": [],
            "not_found_ids": [],
            "not_pending_ids": [],
        }

    stmt = select(Order).where(Order.id.in_(unique_ids))
    result = await session.execute(stmt)
    rows = result.scalars().all()
    rows_by_id = {row.id: row for row in rows}

    not_found_ids = [oid for oid in unique_ids if oid not in rows_by_id]
    not_pending_ids = [oid for oid, row in rows_by_id.items() if row.status != "PENDING"]
    cancellable_ids = [oid for oid, row in rows_by_id.items() if row.status == "PENDING"]

    cancelled_ids: List[int] = []
    if cancellable_ids:
        update_stmt = (
            update(Order)
            .where(Order.id.in_(cancellable_ids))
            .values(status="CANCELLED", updated_at=datetime.now(timezone.utc))
            .returning(Order.id)
        )
        update_result = await session.execute(update_stmt)
        cancelled_ids = list(update_result.scalars().all())
        await session.commit()

    return {
        "requested_count": len(order_ids),
        "unique_count": len(unique_ids),
        "ignored_duplicate_count": len(order_ids) - len(unique_ids),
        "cancelled_count": len(cancelled_ids),
        "cancelled_ids": cancelled_ids,
        "not_found_ids": not_found_ids,
        "not_pending_ids": not_pending_ids,
    }


async def cancel_all_open_orders_by_user(
    session: AsyncSession,
    *,
    user_id: int,
) -> dict[str, Any]:
    target_stmt = select(Order.id).where(
        Order.user_id == user_id,
        Order.status == "PENDING",
    )
    target_result = await session.execute(target_stmt)
    cancellable_ids = list(target_result.scalars().all())

    if not cancellable_ids:
        return {
            "user_id": user_id,
            "cancelled_count": 0,
            "cancelled_ids": [],
        }

    stmt = (
        update(Order)
        .where(Order.id.in_(cancellable_ids))
        .values(status="CANCELLED", updated_at=datetime.now(timezone.utc))
        .returning(Order.id)
    )
    result = await session.execute(stmt)
    cancelled_ids = list(result.scalars().all())
    await session.commit()

    return {
        "user_id": user_id,
        "cancelled_count": len(cancelled_ids),
        "cancelled_ids": cancelled_ids,
    }


async def cancel_open_orders_by_user_and_market(
    session: AsyncSession,
    *,
    user_id: int,
    market_id: int,
) -> dict[str, Any]:
    target_stmt = select(Order.id).where(
        Order.user_id == user_id,
        Order.market_id == market_id,
        Order.status == "PENDING",
    )
    target_result = await session.execute(target_stmt)
    cancellable_ids = list(target_result.scalars().all())

    if not cancellable_ids:
        return {
            "user_id": user_id,
            "market_id": market_id,
            "cancelled_count": 0,
            "cancelled_ids": [],
        }

    stmt = (
        update(Order)
        .where(Order.id.in_(cancellable_ids))
        .values(status="CANCELLED", updated_at=datetime.now(timezone.utc))
        .returning(Order.id)
    )
    result = await session.execute(stmt)
    cancelled_ids = list(result.scalars().all())
    await session.commit()

    return {
        "user_id": user_id,
        "market_id": market_id,
        "cancelled_count": len(cancelled_ids),
        "cancelled_ids": cancelled_ids,
    }