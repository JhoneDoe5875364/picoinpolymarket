export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // <— IMPORTANT: allow server to reach 127.0.0.1

import { notFound } from "next/navigation";
import { PredictionPanel } from "@/components/market/PredictionPanel";
import { Market } from "@/lib/types";
import { PriceHistoryChart } from "@/components/market/PriceHistoryChart";
import { apiFetch } from "@/lib/api";
import { MarketSummary } from "@/components/market/MarketSummary";
import { MarketComment } from "@/components/market/MarketComment";
import { MarketRules } from "@/components/market/MarketRules";
import { MarketParticipants } from "@/components/market/MarketParticipants";
import { MarketDetailMobileTrade } from "@/components/market/MarketDetailMobileTrade";


async function loadMarketDetail(id: string): Promise<Market> {
  const res = await apiFetch(`/markets/${id}`, {
    method: "GET",
  });
  return res?.data ?? [];
}

export default async function MarketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const market = await loadMarketDetail(id)

  if (!market?.id)
    return notFound();

  return (
    <div className="container mx-auto px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:px-8 lg:pb-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 xl:grid-cols-4">
        <div className="space-y-8 lg:col-span-2 xl:col-span-3">
          <MarketSummary market={market} />

          <PriceHistoryChart market={market} />

          <MarketRules market={market} />

          <MarketComment market={market} />

          <MarketParticipants market={market} />
        </div>

        <div className="hidden space-y-6 lg:col-span-1 lg:block lg:sticky lg:top-20 lg:self-start xl:col-span-1">
          <PredictionPanel market={market} />
        </div>
      </div>

      <MarketDetailMobileTrade market={market} />
    </div>
  );
}
