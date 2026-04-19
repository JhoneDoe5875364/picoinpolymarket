"use client"

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Market } from "@/lib/types"
import { Badge } from "./ui/badge"
import { Separator } from "./ui/separator"
import { BarChart, Clock, Users } from "lucide-react"
import { format } from "date-fns";

interface MarketSummaryProps {
  market: Market
}

export function MarketSummary({ market }: MarketSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <Badge variant="outline" className="border-accent text-accent">{market?.category}</Badge>
          <Badge variant={market?.status === 'open' ? 'default' : 'secondary'}>{market?.status}</Badge>
        </div>
        <CardTitle className="text-2xl md:text-3xl font-bold font-headline pt-4">{market?.question}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{market?.description}</p>
        <Separator className="my-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary" />
            <div>
              <div className="text-muted-foreground">Volume</div>
              <div className="font-semibold">{market?.volume?.toLocaleString()} π</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <div className="text-muted-foreground">Traders</div>
              <div className="font-semibold">{market?.traders?.toLocaleString()}</div>
            </div>
          </div>
          {market?.end_date && (
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <div className="text-muted-foreground">Resolves</div>
                <div className="font-semibold">{format(new Date(market?.end_date), 'PPp')}</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
