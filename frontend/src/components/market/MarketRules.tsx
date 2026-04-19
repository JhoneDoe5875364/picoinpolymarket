"use client"

import { useMemo, useState } from "react"
import type { Market } from "@/lib/types"
import { format, isValid } from "date-fns"
import { BarChart, Clock, Users, type LucideIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"

interface MarketRulesProps {
  market: Market
}

function normalizeText(value?: string | null): string {
  if (!value) return ""
  return value.trim()
}

function RulesBody({ text }: { text: string }) {
  if (!text) {
    return <p className="text-sm text-muted-foreground">No rules provided.</p>
  }

  return <p className="text-sm leading-5 whitespace-pre-line">{text}</p>
}

interface SummaryItemProps {
  icon: LucideIcon
  label: string
  value: string
}

function SummaryItem({ icon: Icon, label, value }: SummaryItemProps) {
  return (
    <div className="flex justify-between gap-1">
      <div className="flex items-center gap-1">
        <Icon className="h-5 w-5 text-primary" />
        <div className="text-semibold">{label}</div>
      </div>
      <div className="flex items-center gap-1">
        <div>{value}</div>
      </div>
    </div>
  )
}

function formatDate(value?: string | null, pattern: string = "PP"): string {
  if (!value) return "-"
  const date = new Date(value)
  if (!isValid(date)) return "-"
  return format(date, pattern)
}

export function MarketRules({ market }: MarketRulesProps) {
  const [expanded, setExpanded] = useState(false)

  const rulesText = useMemo(
    () => normalizeText(market.rules),
    [market.rules]
  )

  const canExpand = rulesText.length > 180

  const summaryItems: SummaryItemProps[] = [
    {
      icon: BarChart,
      label: "Volume",
      value: `π ${(market.volume ?? 0).toLocaleString()}`,
    },
    {
      icon: Users,
      label: "Traders",
      value: (market.traders ?? 0).toLocaleString(),
    },
    {
      icon: Clock,
      label: "End Date",
      value: formatDate(market.end_date, "PP"),
    },
    {
      icon: Clock,
      label: "Market Opened",
      value: formatDate(market.start_date, "PPp"),
    },
  ]

  return (
    <>
      <section className="md:hidden space-y-2">
        <h3 className="text-base font-semibold">Rules</h3>
        <div>
          {canExpand ? (
            expanded ? (
              <div className="space-y-1">
                <div className="text-sm leading-5 whitespace-pre-line">
                  {rulesText || "No rules provided."}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm pt-2 pb-2">
                  {summaryItems.map((item) => (
                    <SummaryItem key={item.label} {...item} />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => !prev)}
                  className="text-sm text-muted-foreground"
                >
                  Show less
                </button>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <div className="min-w-0 flex-1 text-sm leading-5 line-clamp-1 whitespace-pre-line">
                  {rulesText || "No rules provided."}
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => !prev)}
                  className="shrink-0 text-sm text-muted-foreground"
                >
                  Show more
                </button>
              </div>
            )
          ) : (
            <div className="text-sm leading-5 whitespace-pre-line">
              {rulesText || "No rules provided."}
            </div>
          )}
        </div>
      </section>

      <section className="md:block hidden">
        <Tabs defaultValue="rules">
          <TabsList className="h-auto p-0 bg-transparent rounded-none justify-start gap-6">
            <TabsTrigger
              value="rules"
              className="px-0 py-0 rounded-none bg-transparent text-base font-semibold text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Rules
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="mt-4">
            <RulesBody text={rulesText} />
          </TabsContent>
        </Tabs>
      </section>
    </>
  )
}
