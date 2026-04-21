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
  token_yes?: string | null;
  token_no?: string | null;
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
  traders?: number;
}

/** Minimal current user shape returned by your hook */
export interface CurrentUser {
  id?: string;
  handle?: string;
  // add fields as needed
}

/** Response helpers */
export type Paged<T> = {
  items: T[];
  page?: number;
  page_size?: number;
  total?: number;
};
export type User = any;

export type FraudReport = any;

export interface Transaction {
  id: string;
  date: string;
  type: 'deposit' | 'withdrawal' | 'prediction-yes' | 'prediction-no' | 'claim-payouts' | 'referral-bonus';
  status: 'completed' | 'pending' | 'failed';
  amount: number;
  pi_amount: number;
  details: string;
}

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