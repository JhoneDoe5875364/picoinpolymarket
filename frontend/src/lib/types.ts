// src/lib/types.ts
// Unified domain types that match your Supabase schema + API responses.
// These are intentionally tolerant (optional fields) to handle both mocks and live data.

export type OutcomeSide = "yes" | "no";

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
  status?: string;
  is_active?: boolean;
  is_closed?: boolean;
  is_archived?: boolean;
  is_resolved?: boolean;
  rules?: string | null;
  yes_criteria?: string | null;
  no_criteria?: string | null;
  edge_cases?: string | null;
  market_context?: string | null;
  admin_clarification?: string | null;
  admin_clarification_at?: string | null;
  admin_clarification_by_user_id?: string | null;
  admin_clarification_by_username?: string | null;
  resolution_time?: string | null;
  resolved_at?: string | null;
  resolved_outcome?: OutcomeSide | "cancelled" | null;
  resolved_by_user_id?: string | null;
  resolved_by_username?: string | null;
  resolution_source?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  category?: string;
  labels?: string[];
  trades_24h?: number;
  volume_24h?: number;
  volume_1w?: number;
  trades_total?: number;
  holders?: number;
  comments_24h?: number;
  activity_24h?: number;
  price_move_24h?: number;
  trending_score?: number;
  hot_score?: number;
  is_ending_soon?: boolean;
  featured_rank?: number | null;
  sparkline?: number[];
  price_history?: { timestamp?: number | string | null; probability?: number | string | null }[];
  featured_comments?: {
    id: number;
    body?: string | null;
    pi_username?: string | null;
    created_at?: string | null;
  }[];

  // Compatibility fields used by current frontend responses/components.
  traders?: number;
}

/** Response helpers */
export type Paged<T> = {
  items: T[];
  page?: number;
  page_size?: number;
  total?: number;
};
export type User = any;

export interface Suggestion {
  id: number;
  question: string;
  description?: string | null;
  category: string;
  status: string;
  user_id?: string;
  pi_username?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  reject_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};