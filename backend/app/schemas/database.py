"""
Database Schema Definitions
Based on predictpix_structure_20251229.sql

All table schemas are defined as Pydantic models for type validation and serialization.
"""
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, Field


# ============================================================================
# Core Tables
# ============================================================================

class User(BaseModel):
    """Users table schema"""
    id: UUID
    pi_username: Optional[str] = None
    created_at: Optional[datetime] = None
    referral_code: Optional[str] = None
    referred_by: Optional[str] = None
    tutorial_completed: bool = False
    handle_norm: Optional[str] = None
    status: Optional[str] = None
    balance: Decimal = Decimal('0')
    role_id: int = 3

    class Config:
        from_attributes = True


class Market(BaseModel):
    """Markets table schema"""
    id: UUID
    question: str
    category: Optional[str] = None
    creator_id: Optional[UUID] = None
    tier: Optional[str] = None
    status: str = 'open'
    created_at: Optional[datetime] = None
    end_date: Optional[datetime] = None
    liquidity: Optional[Decimal] = None
    resolution_criteria: Optional[str] = None
    resolution_source: Optional[str] = None
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    resolved_outcome: Optional[str] = None
    is_archived: bool = False
    closes_at: Optional[datetime] = None
    outcome_reason: Optional[str] = None
    title: Optional[str] = None  # Generated column
    seed_total: Decimal = Decimal('0')
    description: Optional[str] = None
    close_at: Optional[datetime] = None
    rules: Optional[str] = None
    sources: List[Dict[str, Any]] = Field(default_factory=list)  # JSONB default []
    tags: List[str] = Field(default_factory=list)  # text[] default {}
    checklist_resolution_clarity: bool = True
    checklist_restricted_topics: bool = True
    checklist_verifiable_outcome: bool = True

    class Config:
        from_attributes = True


class Position(BaseModel):
    """Positions table schema"""
    id: UUID
    user_id: Optional[UUID] = None
    market_id: Optional[UUID] = None
    side: Optional[str] = None  # 'yes' or 'no'
    amount: Optional[Decimal] = None
    created_at: Optional[datetime] = None
    status: Optional[str] = None
    user_handle: Optional[str] = None
    pi_amount: Optional[Decimal] = None

    class Config:
        from_attributes = True


class Trade(BaseModel):
    """Trades table schema"""
    id: UUID
    user_id: Optional[UUID] = None
    market_id: Optional[UUID] = None
    type: Optional[str] = None  # 'buy', 'sell', 'payout'
    side: Optional[str] = None  # 'yes' or 'no'
    pi_amount: Optional[Decimal] = None
    created_at: Optional[datetime] = None
    fee_pi: Decimal = Decimal('0')
    net_pi: Optional[Decimal] = None  # Generated column
    invalid: bool = False
    kind: str = 'buy'  # 'buy', 'sell', 'refund'
    amount: Optional[Decimal] = None

    class Config:
        from_attributes = True


# ============================================================================
# Admin Tables
# ============================================================================

class Admin(BaseModel):
    """Admins table schema"""
    user_id: UUID

    class Config:
        from_attributes = True


class AdminAudit(BaseModel):
    """Admin audit log table schema"""
    id: UUID
    at: datetime
    action: str
    target_id: Optional[UUID] = None
    details: Dict[str, Any] = Field(default_factory=dict)  # JSONB default {}

    class Config:
        from_attributes = True


# ============================================================================
# Compliance Tables
# ============================================================================

class Attestation(BaseModel):
    """Attestations table schema"""
    id: int
    user_id: str
    ip: str
    region_code: str
    state_code: Optional[str] = None
    attestation_version: str
    timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True


class ComplianceLog(BaseModel):
    """Compliance logs table schema"""
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

    class Config:
        from_attributes = True


# ============================================================================
# Supporting Tables
# ============================================================================

class Category(BaseModel):
    """Categories table schema"""
    name: str

    class Config:
        from_attributes = True


class Comment(BaseModel):
    """Comments table schema"""
    id: UUID
    market_id: UUID
    user_id: Optional[UUID] = None
    username: Optional[str] = None
    body: str
    created_at: datetime

    class Config:
        from_attributes = True


class MarketComment(BaseModel):
    """Market comments table schema"""
    id: int
    market_id: UUID
    created_at: datetime
    author_id: Optional[str] = None
    body: str

    class Config:
        from_attributes = True


class MarketHistory(BaseModel):
    """Market history table schema"""
    id: int
    market_id: UUID
    ts: datetime
    implied_yes: Decimal
    implied_no: Decimal
    source: str = 'snapshot'

    class Config:
        from_attributes = True


class MarketPriceHistory(BaseModel):
    """Market price history table schema"""
    id: UUID
    market_id: UUID
    ts_date: date
    yes_pct: float
    no_pct: float
    volume_pi: Decimal = Decimal('0')

    class Config:
        from_attributes = True


class Referral(BaseModel):
    """Referrals table schema"""
    id: UUID
    referrer_id: Optional[UUID] = None
    referred_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    reward_earned: bool = False

    class Config:
        from_attributes = True


class Role(BaseModel):
    """Roles table schema"""
    id: int
    role: Optional[str] = None

    class Config:
        from_attributes = True


class Suggestion(BaseModel):
    """Suggestions table schema"""
    id: UUID
    user_id: Optional[UUID] = None
    title: str
    category: str
    resolution_criteria: str
    description: Optional[str] = None
    end_time: datetime
    status: str = 'pending'  # 'pending', 'approved', 'rejected'
    reject_reason: Optional[str] = None
    created_at: datetime
    approved_at: Optional[datetime] = None
    approved_by: Optional[UUID] = None
    submitted_by: Optional[str] = None

    class Config:
        from_attributes = True


class Transaction(BaseModel):
    """Transactions table schema"""
    id: UUID
    user_id: UUID
    market_id: Optional[UUID] = None
    amount: Optional[Decimal] = None
    type: Optional[str] = None
    status: Optional[str] = None
    details: Optional[str] = None
    date: Optional[date] = None
    pi_amount: Optional[Decimal] = None

    class Config:
        from_attributes = True


# ============================================================================
# Request/Response Models (for API endpoints)
# ============================================================================

class MarketCreate(BaseModel):
    """Schema for creating a new market"""
    question: str
    category: Optional[str] = None
    tier: Optional[str] = None
    end_date: Optional[datetime] = None
    closes_at: Optional[datetime] = None
    liquidity: Optional[Decimal] = None
    resolution_criteria: Optional[str] = None
    resolution_source: Optional[str] = None
    description: Optional[str] = None
    rules: Optional[str] = None
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)


class MarketUpdate(BaseModel):
    """Schema for updating a market"""
    question: Optional[str] = None
    category: Optional[str] = None
    tier: Optional[str] = None
    status: Optional[str] = None
    end_date: Optional[datetime] = None
    closes_at: Optional[datetime] = None
    liquidity: Optional[Decimal] = None
    resolution_criteria: Optional[str] = None
    resolution_source: Optional[str] = None
    resolved: Optional[bool] = None
    resolved_outcome: Optional[str] = None
    is_archived: Optional[bool] = None
    outcome_reason: Optional[str] = None
    description: Optional[str] = None
    rules: Optional[str] = None
    sources: Optional[List[Dict[str, Any]]] = None
    tags: Optional[List[str]] = None


class PositionCreate(BaseModel):
    """Schema for creating a new position"""
    user_id: UUID
    market_id: UUID
    side: str  # 'yes' or 'no'
    amount: Decimal
    pi_amount: Decimal


class TradeCreate(BaseModel):
    """Schema for creating a new trade"""
    user_id: UUID
    market_id: UUID
    type: str  # 'buy', 'sell', 'payout'
    side: str  # 'yes' or 'no'
    pi_amount: Decimal
    kind: str = 'buy'  # 'buy', 'sell', 'refund'


class CommentCreate(BaseModel):
    """Schema for creating a new comment"""
    market_id: UUID
    user_id: Optional[UUID] = None
    username: Optional[str] = None
    body: str


class SuggestionCreate(BaseModel):
    """Schema for creating a new suggestion"""
    user_id: Optional[UUID] = None
    title: str
    category: str
    resolution_criteria: str
    description: Optional[str] = None
    end_time: datetime
    submitted_by: Optional[str] = None


class SuggestionUpdate(BaseModel):
    """Schema for updating a suggestion"""
    status: Optional[str] = None  # 'pending', 'approved', 'rejected'
    reject_reason: Optional[str] = None
    approved_by: Optional[UUID] = None
    approved_at: Optional[datetime] = None

