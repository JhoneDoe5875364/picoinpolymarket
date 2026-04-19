// src/lib/types.ts
// Unified domain types that match your Supabase schema + API responses.
// These are intentionally tolerant (optional fields) to handle both mocks and live data.

export type OutcomeSide = "yes" | "no";
export type MarketStatus = "open" | "pending_resolution" | "resolved" | "canceled";

/**
 * Market — compatible with both mock data and live backend.
 * Backend commonly returns: id, question, category, status, closes_at, description, ...
 * Some of your mock files used `title`, so we keep both.
 */
export interface Market {
  id: number;
  question: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  category_id?: number | null;
  creator_id?: number | null;
  tier?: string | null;
  token_yes_id?: string | null;
  token_no_id?: string | null;
  outcome_price_yes?: number | null;
  outcome_price_no?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  liquidity?: number | null;
  volume?: number;
  is_active?: boolean;
  is_closed?: boolean;
  is_archived?: boolean;
  is_resolved?: boolean;
  rules?: string | null;
  resolved_at?: string | null;
  resolved_outcome?: OutcomeSide | "cancelled" | null;
  resolved_by_user_id?: string | null;
  resolved_by_username?: string | null;
  resolution_source?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  category?: string;

  // Compatibility fields used by current frontend responses/components.
  title?: string;
  status?: MarketStatus;
  resolved?: boolean;
  outcome?: OutcomeSide | "cancelled" | null;
  comments?: Array<MarketComment>;
  yes_volume?: number;
  no_volume?: number;
  total_volume?: number;
  yes_price?: number;
  no_price?: number;
  yes_pct?: number;
  no_pct?: number;
  traders?: number;
}

/** Compact comment type used by MarketComments component (optional feature) */
export interface MarketComment {
  id: string;
  market_id?: string;
  author_id?: string;
  body: string;
  created_at: string; // ISO string
}

/** Position / recent trade item (used by MarketTradeFeed & buy flow) */
export interface Position {
  id: string;
  market_id: string;
  user_id?: string;
  user_handle?: string;
  side: OutcomeSide;
  amount: number;
  amount_pi: number;
  price: number;
  status?: "open" | "settled" | "canceled";
  created_at: string; // ISO string
}

/** Minimal current user shape returned by your hook */
export interface CurrentUser {
  id?: string;
  handle?: string;
  // add fields as needed
}

/** Basic stats shape returned by GET /markets/{id}/stats */
export interface MarketStats {
  implied?: number; // 0..1 probability of YES

  // Totals: keep flexible to accept different server payloads
  totals?: {
    count?: number;
    sum?: number;         // total volume in π
    yes?: number;
    no?: number;
    [k: string]: number | undefined;
  };

  trades?: number; // optional total trades
}

/** Leaderboard row (for later wiring) */
export interface LeaderboardRow {
  user_id: string;
  user_handle?: string;
  volume_pi: number;
  success_rate?: number; // 0..1
}

/** Response helpers */
export type Paged<T> = {
  items: T[];
  page?: number;
  page_size?: number;
  total?: number;
};
export type User = any;
export type Comment = any;
export type MarketWithStats = any;

export type FraudReport = any;
export interface LeaderboardEntry {
  rank: number,
  user_id: string;
  username: string;
  volume: number;
  accuracy: number
};

export interface Response {
  ok: boolean;
  items: LeaderboardEntry[];
  error?: string
};

export interface Transaction {
  id: string;
  date: string;
  type: 'deposit' | 'withdrawal' | 'prediction-yes' | 'prediction-no' | 'claim-payouts' | 'referral-bonus';
  status: 'completed' | 'pending' | 'failed';
  amount: number;
  pi_amount: number;
  details: string;
}

export interface Summary {
  ok: boolean;
  total_pi: number;
  total_fees: number;
  unclaimed_pi: number;
  referral_code: string | null;
  referred_by: string | null;
};

export interface OpenPosition {
  id: string;
  position_id: string;
  market_id: string;
  market_title: string;
  side: 'yes' | 'no';
  amount: number;
  pi_amount: number;
  created_at: string;
};

export interface Activity {
  id: string;
  position_id: string;
  market_id: string;
  market_title: string;
  side: 'yes' | 'no';
  amount: number;
  price: number | null;
  date: string;
  outcome: 'yes' | 'no' | null;
};

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  user_id: string;
  pi_username: string;
  end_time: string;
  created_at: string;
};

export interface PriceHistory {
  id: string;
  market_id: string;
  date: string;
  ts: string;
  yes: number;
  no: number;
  volume_pi: number;
}

export interface Trade {
  id: string;
  side: string;
  pi_amount: number;
  pi_username: string;
  created_at: string;
}