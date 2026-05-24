"use client"

import * as React from "react"
import type { Market } from "@/lib/types"
import { MarketActions } from "@/components/market/MarketActions"

const DEFAULT_MARKET_ICON = "/images/markets/market-default.png"

interface MarketSummaryProps {
  market: Market
}

export function MarketSummary({ market }: MarketSummaryProps) {
  const icon = typeof market.icon === "string" && market.icon.trim().length > 0 ? market.icon : null
  const [iconSrc, setIconSrc] = React.useState(icon ?? DEFAULT_MARKET_ICON)

  React.useEffect(() => {
    setIconSrc(icon ?? DEFAULT_MARKET_ICON)
  }, [icon])

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 md:gap-4">
        <div className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 shrink-0 overflow-hidden rounded-md border bg-muted/20">
          <img
            src={iconSrc}
            alt={market.question}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => {
              if (iconSrc !== DEFAULT_MARKET_ICON) setIconSrc(DEFAULT_MARKET_ICON)
            }}
          />
        </div>
        <div className="flex justify-between w-full">
          <div className="">
            <div className="text-sm text-gray-400">{market.category}</div>
            <div className="text-md md:text-2xl font-bold font-headline">{market.question}</div>
          </div>
          <MarketActions
            marketId={market.id}
            title={market.question}
            watched={Boolean(market.viewer_is_watchlisted)}
          />
        </div>
      </div>

    </div>
  )
}
