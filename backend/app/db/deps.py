from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession


async def get_db(request: Request) -> AsyncGenerator[AsyncSession, None]:
    maker = getattr(request.app.state, "async_session_maker", None)
    if maker is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Database unavailable: check DATABASE_URL / PG* in .env and "
                "that the server could connect at startup (see logs)."
            ),
        )
    async with maker() as session:
        yield session


DbSession = Annotated[AsyncSession, Depends(get_db)]
