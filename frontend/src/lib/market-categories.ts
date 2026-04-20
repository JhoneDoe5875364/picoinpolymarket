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

export function categoryToSlug(category: MarketCategory): string {
  return category.toLowerCase();
}

export function slugToCategory(slug: string): MarketCategory | null {
  const matched = MARKET_CATEGORIES.find((category) => category.toLowerCase() === slug.toLowerCase());
  return matched ?? null;
}
