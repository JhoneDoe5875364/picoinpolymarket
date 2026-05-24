export const MARKET_CATEGORIES = [
  "Politics",
  "Sports",
  "Crypto",
  "Esports",
  "Finance",
  "Geopolitics",
  "Tech",
  "Culture",
  "Economy",
  "Weather",
] as const;

export type MarketCategory = (typeof MARKET_CATEGORIES)[number];

export const MARKET_DISCOVERY_MENUS = [
  { key: "trending", label: "Trending", slug: "" },
  { key: "new", label: "New", slug: "new" },
  { key: "hot", label: "Hot", slug: "hot" },
  { key: "ending_soon", label: "Ending Soon", slug: "ending-soon" },
  { key: "most_discussed", label: "Most Discussed", slug: "most-discussed" },
] as const;

export const WATCHLIST_DISCOVERY = {
  key: "watchlist",
  label: "Watchlist",
  slug: "watchlist",
} as const;

export type MarketDiscoveryKey =
  | (typeof MARKET_DISCOVERY_MENUS)[number]["key"]
  | typeof WATCHLIST_DISCOVERY.key;

export type MarketDiscoveryMenu =
  | (typeof MARKET_DISCOVERY_MENUS)[number]
  | typeof WATCHLIST_DISCOVERY;

export function categoryToSlug(category: MarketCategory): string {
  return category.toLowerCase();
}

export function slugToCategory(slug: string): MarketCategory | null {
  const matched = MARKET_CATEGORIES.find((category) => category.toLowerCase() === slug.toLowerCase());
  return matched ?? null;
}

export function discoveryToSlug(discovery: MarketDiscoveryKey): string {
  if (discovery === WATCHLIST_DISCOVERY.key) {
    return WATCHLIST_DISCOVERY.slug;
  }
  const matched = MARKET_DISCOVERY_MENUS.find((item) => item.key === discovery);
  return matched?.slug ?? discovery;
}

export function slugToDiscovery(slug: string): MarketDiscoveryMenu | null {
  const normalized = slug.toLowerCase();
  if (WATCHLIST_DISCOVERY.slug === normalized) {
    return WATCHLIST_DISCOVERY;
  }
  const matched = MARKET_DISCOVERY_MENUS.find((item) => item.slug === normalized);
  return matched ?? null;
}
