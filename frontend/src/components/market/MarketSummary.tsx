"use client"

import type { Market } from "@/lib/types"

interface MarketSummaryProps {
  market: Market
}

export function MarketSummary({ market }: MarketSummaryProps) {
  return (
    <div>
      <div className="text-sm text-gray-400">{market.category}</div>
      <div className="text-xl md:text-2xl font-bold font-headline">{market.question}</div>
    </div>
  )
}
