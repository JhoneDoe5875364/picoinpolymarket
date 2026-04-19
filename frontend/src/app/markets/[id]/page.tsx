export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // <— IMPORTANT: allow server to reach 127.0.0.1

import { notFound } from "next/navigation";
import { PredictionPanel } from "@/components/PredictionPanel";
import { Market } from "@/lib/types";
import { PriceHistoryChart } from "@/components/PriceHistorychart";
import { apiFetch } from "@/lib/api";
import { MarketSummary } from "@/components/MarketSummary";
import { MarketRules } from "@/components/MarketRules";
import { MarketParticipants } from "@/components/MarketParticipants";


async function loadMarketDetail(id: string): Promise<Market> {
  const res = await apiFetch(`/markets/${id}`, {
    method: "GET",
  });
  return res?.data ?? [];
}

export default async function MarketDetailsPage({ params }: { params: { id: string } }) {
  const { id } = await params

  const market = await loadMarketDetail(id)

  if (!market?.id)
    return notFound();

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <div className="lg:col-span-2 xl:col-span-3 space-y-8">
          <MarketSummary market={market} />

          <PriceHistoryChart market={market} />

          <MarketRules market={market} />

          <MarketParticipants market={market} />
        </div>

        <div className="lg:col-span-1 xl:col-span-1 space-y-6">
          <PredictionPanel market={market} />
        </div>
      </div>
    </div>
  );
}
