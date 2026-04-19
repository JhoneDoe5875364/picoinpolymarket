export type PositionStatus = "ALL" | "OPEN" | "CLOSED";
export type SortDirection = "DESC" | "ASC";
export type MinAmountFilter = "NONE" | "10" | "100" | "1000" | "10000" | "100000";

export interface MarketHolder {
  user_id: string | number;
  shares: number | string;
  avg_price?: number | string | null;
}

export interface MarketHolderGroup {
  token_id: string;
  holders: MarketHolder[];
}

export interface MarketPosition {
  id: number | string;
  user_id: number | string;
  token_id: string;
  shares: number | string;
  pi_amount: number | string;
}

export interface MarketPositionGroup {
  token_id: string;
  positions: MarketPosition[];
}

export interface MarketTradeActivity {
  id: number | string;
  taker_user_id?: number | string;
  pi_username?: string;
  side?: string;
  outcome?: string;
  price?: number | string;
  shares?: number | string;
  pi_amount?: number | string;
  created_at: string;
}
