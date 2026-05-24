"""
Pydantic shapes for persisted / serialized domain data (API & docs).
Maps from SQLAlchemy models via model_config.from_attributes.
"""
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class User(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pi_username: Optional[str] = None
    created_at: Optional[datetime] = None
    referral_code: Optional[str] = None
    referred_by: Optional[str] = None
    status: Optional[str] = None
    balance: Decimal = Decimal("0")
    role_id: int = 3


class Market(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    question: str
    category_id: Optional[int] = None
    creator_id: Optional[int] = None
    tier: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    liquidity: Optional[Decimal] = None
    is_closed: bool = False
    is_resolved: bool = False
    is_archived: bool = False
    is_active: bool = True
    resolution_source: Optional[str] = None
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    resolved_outcome: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    rules: Optional[str] = None
    yes_criteria: Optional[str] = None
    no_criteria: Optional[str] = None
    edge_cases: Optional[str] = None
    market_context: Optional[str] = None
    admin_clarification: Optional[str] = None
    admin_clarification_at: Optional[datetime] = None
    admin_clarification_by_user_id: Optional[str] = None
    admin_clarification_by_username: Optional[str] = None
    resolution_time: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Position(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: Optional[int] = None
    market_id: Optional[int] = None
    side: Optional[str] = None
    amount: Optional[Decimal] = None
    created_at: Optional[datetime] = None
    status: Optional[str] = None
    user_handle: Optional[str] = None
    pi_amount: Optional[Decimal] = None


class Trade(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: Optional[int] = None
    market_id: Optional[int] = None
    type: Optional[str] = None
    side: Optional[str] = None
    pi_amount: Optional[Decimal] = None
    created_at: Optional[datetime] = None
    fee_pi: Decimal = Decimal("0")
    net_pi: Optional[Decimal] = None
    invalid: bool = False
    kind: str = "buy"
    amount: Optional[Decimal] = None


class AdminAudit(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    at: datetime
    action: str
    target_id: Optional[UUID] = None
    details: Dict[str, Any] = Field(default_factory=dict)


class Attestation(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    ip: str
    region_code: str
    state_code: Optional[str] = None
    attestation_version: str
    timestamp: Optional[datetime] = None


class ComplianceLog(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[str] = None
    ip: str
    region_code: str
    state_code: Optional[str] = None
    tier: str
    category_key: Optional[str] = None
    action_type: str
    result: str
    reason: Optional[str] = None
    timestamp: Optional[datetime] = None


class Category(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str


class Comment(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    market_id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    body: str
    created_at: datetime


class MarketComment(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    market_id: int
    created_at: datetime
    author_id: Optional[str] = None
    body: str


class MarketHistory(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    market_id: int
    ts: datetime
    implied_yes: Decimal
    implied_no: Decimal
    source: str = "snapshot"


class MarketPriceHistory(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    market_id: int
    ts_date: date
    yes_pct: float
    no_pct: float
    volume_pi: Decimal = Decimal("0")


class Referral(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    referrer_id: Optional[UUID] = None
    referred_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    reward_earned: bool = False


class Role(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: Optional[str] = None


class Suggestion(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[int] = None
    question: str
    category: str
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    status: str = "pending"
    reject_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[int] = None


class Transaction(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: int
    market_id: Optional[int] = None
    amount: Optional[Decimal] = None
    type: Optional[str] = None
    status: Optional[str] = None
    details: Optional[str] = None
    date: Optional[date] = None
    pi_amount: Optional[Decimal] = None
