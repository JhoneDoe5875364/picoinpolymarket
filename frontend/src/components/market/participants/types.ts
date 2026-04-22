export type PositionStatus = "ALL" | "OPEN" | "CLOSED";
export type SortDirection = "DESC" | "ASC";
export type MinAmountFilter = "NONE" | "10" | "100" | "1000" | "10000" | "100000";

export interface MarketHolder {
  user_id: string | number;
  pi_username?: string;
  shares: number | string;
  avg_price?: number | string | null;
}

export interface MarketHolderGroup {
  token: string;
  outcome?: "YES" | "NO";
  holders: MarketHolder[];
}

export interface MarketPosition {
  id: number | string;
  user_id: number | string;
  pi_username?: string;
  token: string;
  shares: number | string;
  pi_amount: number | string;
}

export interface MarketPositionGroup {
  YES: MarketPosition[];
  NO: MarketPosition[];
}

export interface MarketTradeActivity {
  id: number | string;
  taker_user_id?: number | string;
  taker_pi_username?: string;
  side?: string;
  outcome?: string;
  price?: number | string;
  shares?: number | string;
  pi_amount?: number | string;
  created_at: string;
}
