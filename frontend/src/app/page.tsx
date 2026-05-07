"use client";

import MarketsFeed from "@/components/market/MarketsFeed";

export const dynamic = "force-dynamic";

export default function Page() {
  return <MarketsFeed selectedCategory="All" selectedDiscovery="trending" />;
}
