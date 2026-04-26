from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import and_, func, inspect as sa_inspect, or_, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tables.comment import Comment
from app.models.tables.comment_stat import CommentStat
from app.models.tables.market import Market
from app.models.tables.user import User


def _comment_to_dict(comment: Comment, *, username: Optional[str] = None) -> dict[str, Any]:
    payload = {col.key: getattr(comment, col.key) for col in sa_inspect(Comment).mapper.columns}
    payload["pi_username"] = username
    return payload


async def _ensure_market_exists(session: AsyncSession, market_id: int) -> None:
    market_row = await session.execute(
        select(Market.id).where(Market.id == market_id).limit(1)
    )
    if market_row.scalar_one_or_none() is None:
        raise LookupError("Market not found")


async def _ensure_user_exists(session: AsyncSession, user_id: int) -> None:
    user_row = await session.execute(select(User.id).where(User.id == user_id).limit(1))
    if user_row.scalar_one_or_none() is None:
        raise LookupError("User not found")


async def _increment_market_stats(
    session: AsyncSession,
    *,
    market_id: int,
    root_delta: int,
    reply_delta: int,
    event_at: datetime,
) -> None:
    upsert_stmt = pg_insert(CommentStat).values(
        market_id=market_id,
        root_comment_count=max(root_delta, 0),
        reply_count=max(reply_delta, 0),
        last_commented_at=event_at,
    )
    upsert_stmt = upsert_stmt.on_conflict_do_update(
        index_elements=[CommentStat.market_id],
        set_={
            "root_comment_count": func.greatest(
                CommentStat.root_comment_count + root_delta, 0
            ),
            "reply_count": func.greatest(CommentStat.reply_count + reply_delta, 0),
            "last_commented_at": func.greatest(
                func.coalesce(CommentStat.last_commented_at, event_at),
                event_at,
            ),
        },
    )
    await session.execute(upsert_stmt)


async def list_market_comments(
    session: AsyncSession,
    *,
    market_id: int,
    offset: int,
    limit: int,
    include_deleted: bool = False,
) -> dict[str, Any]:
    conditions = [Comment.market_id == market_id, Comment.depth == 0]
    if not include_deleted:
        conditions.append(Comment.status == "active")

    stmt = (
        select(Comment, User.pi_username)
        .outerjoin(User, User.id == Comment.player_id)
        .where(*conditions)
        .order_by(Comment.created_at.desc(), Comment.id.desc())
        .offset(offset)
        .limit(limit)
    )
    rows = await session.execute(stmt)
    items = [
        _comment_to_dict(comment_row, username=username)
        for comment_row, username in rows.all()
    ]

    total_stmt = select(func.count(Comment.id)).where(*conditions)
    total_row = await session.execute(total_stmt)
    total = int(total_row.scalar_one() or 0)
    return {"items": items, "total": total}


async def list_replies(
    session: AsyncSession,
    *,
    comment_id: int,
    offset: int,
    limit: int,
    include_deleted: bool = False,
) -> dict[str, Any]:
    root_stmt = select(Comment).where(Comment.id == comment_id, Comment.depth == 0)
    root_row = await session.execute(root_stmt)
    root = root_row.scalar_one_or_none()
    if root is None:
        raise LookupError("Comment not found")

    conditions = [
        Comment.market_id == root.market_id,
        Comment.depth == 1,
        Comment.root_comment_id == comment_id,
    ]
    if not include_deleted:
        conditions.append(Comment.status == "active")

    stmt = (
        select(Comment, User.pi_username)
        .outerjoin(User, User.id == Comment.player_id)
        .where(*conditions)
        .order_by(Comment.created_at.asc(), Comment.id.asc())
        .offset(offset)
        .limit(limit)
    )
    rows = await session.execute(stmt)
    items = [
        _comment_to_dict(comment_row, username=username)
        for comment_row, username in rows.all()
    ]

    total_stmt = select(func.count(Comment.id)).where(*conditions)
    total_row = await session.execute(total_stmt)
    total = int(total_row.scalar_one() or 0)
    return {"root_comment_id": comment_id, "items": items, "total": total}


async def create_comment(
    session: AsyncSession,
    *,
    market_id: int,
    player_id: int,
    body: str,
) -> dict[str, Any]:
    await _ensure_market_exists(session, market_id)
    await _ensure_user_exists(session, player_id)

    now_utc = datetime.now(timezone.utc)
    row = Comment(
        market_id=market_id,
        player_id=player_id,
        parent_comment_id=None,
        root_comment_id=None,
        depth=0,
        body=body.strip(),
        status="active",
        reply_count=0,
        created_at=now_utc,
        updated_at=now_utc,
    )
    session.add(row)
    await session.flush()
    row.root_comment_id = row.id
    await session.flush()

    await _increment_market_stats(
        session,
        market_id=market_id,
        root_delta=1,
        reply_delta=0,
        event_at=now_utc,
    )
    await session.flush()
    await session.refresh(row)
    return _comment_to_dict(row)


async def create_reply(
    session: AsyncSession,
    *,
    parent_comment_id: int,
    player_id: int,
    body: str,
) -> dict[str, Any]:
    await _ensure_user_exists(session, player_id)

    parent_stmt = select(Comment).where(
        Comment.id == parent_comment_id,
        Comment.depth == 0,
        Comment.status != "deleted",
    )
    parent_result = await session.execute(parent_stmt)
    parent = parent_result.scalar_one_or_none()
    if parent is None:
        raise LookupError("Parent comment not found")

    now_utc = datetime.now(timezone.utc)
    row = Comment(
        market_id=parent.market_id,
        player_id=player_id,
        parent_comment_id=parent.id,
        root_comment_id=parent.id,
        depth=1,
        body=body.strip(),
        status="active",
        reply_count=0,
        created_at=now_utc,
        updated_at=now_utc,
    )
    session.add(row)
    await session.flush()

    await session.execute(
        update(Comment)
        .where(Comment.id == parent.id)
        .values(reply_count=Comment.reply_count + 1, updated_at=now_utc)
    )
    await _increment_market_stats(
        session,
        market_id=parent.market_id,
        root_delta=0,
        reply_delta=1,
        event_at=now_utc,
    )
    await session.flush()
    await session.refresh(row)
    return _comment_to_dict(row)


async def get_comment_by_id(session: AsyncSession, comment_id: int) -> Optional[dict[str, Any]]:
    stmt = (
        select(Comment, User.pi_username)
        .outerjoin(User, User.id == Comment.player_id)
        .where(Comment.id == comment_id)
        .limit(1)
    )
    result = await session.execute(stmt)
    row = result.one_or_none()
    if row is None:
        return None
    comment_row, username = row
    return _comment_to_dict(comment_row, username=username)


async def soft_delete_comment(
    session: AsyncSession,
    *,
    comment_id: int,
    requester_id: int,
    is_admin: bool,
) -> dict[str, Any]:
    row_stmt = select(Comment).where(Comment.id == comment_id).limit(1)
    row_result = await session.execute(row_stmt)
    comment_row = row_result.scalar_one_or_none()
    if comment_row is None:
        raise LookupError("Comment not found")
    if comment_row.status == "deleted":
        return _comment_to_dict(comment_row)
    if not is_admin and comment_row.player_id != requester_id:
        raise PermissionError("No permission to delete this comment")

    now_utc = datetime.now(timezone.utc)
    comment_row.status = "deleted"
    comment_row.body = ""
    comment_row.updated_at = now_utc
    await session.flush()

    if comment_row.depth == 0:
        active_reply_count_stmt = select(func.count(Comment.id)).where(
            Comment.root_comment_id == comment_row.id,
            Comment.depth == 1,
            Comment.status != "deleted",
        )
        active_reply_count_result = await session.execute(active_reply_count_stmt)
        active_reply_count = int(active_reply_count_result.scalar_one() or 0)
        await _increment_market_stats(
            session,
            market_id=comment_row.market_id,
            root_delta=-1,
            reply_delta=-active_reply_count,
            event_at=now_utc,
        )
        await session.execute(
            update(Comment)
            .where(
                Comment.root_comment_id == comment_row.id,
                Comment.depth == 1,
                Comment.status != "deleted",
            )
            .values(status="deleted", body="", updated_at=now_utc)
        )
        await session.flush()
        comment_row.reply_count = 0
    else:
        await _increment_market_stats(
            session,
            market_id=comment_row.market_id,
            root_delta=0,
            reply_delta=-1,
            event_at=now_utc,
        )
        await session.execute(
            update(Comment)
            .where(Comment.id == comment_row.root_comment_id)
            .values(reply_count=func.greatest(Comment.reply_count - 1, 0), updated_at=now_utc)
        )
        await session.flush()

    return _comment_to_dict(comment_row)


async def get_market_comment_summary(session: AsyncSession, market_id: int) -> dict[str, Any]:
    stats_stmt = select(CommentStat).where(CommentStat.market_id == market_id).limit(1)
    stats_result = await session.execute(stats_stmt)
    stats = stats_result.scalar_one_or_none()
    if stats is None:
        return {
            "market_id": market_id,
            "root_comment_count": 0,
            "reply_count": 0,
            "total_comment_count": 0,
            "last_commented_at": None,
        }
    return {
        "market_id": market_id,
        "root_comment_count": stats.root_comment_count,
        "reply_count": stats.reply_count,
        "total_comment_count": stats.root_comment_count + stats.reply_count,
        "last_commented_at": stats.last_commented_at,
    }


async def list_player_comments(
    session: AsyncSession,
    *,
    player_id: int,
    page: int,
    limit: int,
) -> dict[str, Any]:
    offset = (page - 1) * limit
    conditions = [
        Comment.player_id == player_id,
        or_(Comment.status == "active", Comment.status == "blocked"),
    ]
    stmt = (
        select(Comment, User.pi_username)
        .outerjoin(User, User.id == Comment.player_id)
        .where(and_(*conditions))
        .order_by(Comment.created_at.desc(), Comment.id.desc())
        .offset(offset)
        .limit(limit)
    )
    rows = await session.execute(stmt)
    items = [
        _comment_to_dict(comment_row, username=username)
        for comment_row, username in rows.all()
    ]

    count_stmt = select(func.count(Comment.id)).where(and_(*conditions))
    count_result = await session.execute(count_stmt)
    total = int(count_result.scalar_one() or 0)
    return {"items": items, "total": total}
