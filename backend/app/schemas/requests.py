"""HTTP request body / command DTOs (API layer only)."""
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class MarketCreate(BaseModel):
    question: str
    category: Optional[str] = None
    category_id: Optional[UUID] = None
    tier: Optional[str] = None
    end_date: Optional[datetime] = None
    closes_at: Optional[datetime] = None
    liquidity: Optional[Decimal] = None
    resolution_source: Optional[str] = None
    description: Optional[str] = None
    rules: Optional[str] = None
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)


class MarketUpdate(BaseModel):
    question: Optional[str] = None
    category: Optional[str] = None
    category_id: Optional[UUID] = None
    tier: Optional[str] = None
    status: Optional[str] = None
    end_date: Optional[datetime] = None
    closes_at: Optional[datetime] = None
    liquidity: Optional[Decimal] = None
    resolution_source: Optional[str] = None
    resolved: Optional[bool] = None
    resolved_outcome: Optional[str] = None
    is_archived: Optional[bool] = None
    description: Optional[str] = None
    rules: Optional[str] = None
    sources: Optional[List[Dict[str, Any]]] = None
    tags: Optional[List[str]] = None


class PositionCreate(BaseModel):
    user_id: int
    market_id: int
    side: str
    amount: Decimal
    pi_amount: Decimal


class TradeCreate(BaseModel):
    user_id: int
    market_id: int
    type: str
    side: str
    pi_amount: Decimal
    kind: str = "buy"


class CommentCreate(BaseModel):
    market_id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    body: str


class SuggestionCreate(BaseModel):
    user_id: Optional[int] = None
    question: str
    category: str
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime


class SuggestionUpdate(BaseModel):
    status: Optional[str] = None
    reject_reason: Optional[str] = None
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
