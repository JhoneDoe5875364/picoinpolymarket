"use client";

import { format, isValid } from "date-fns";
import { useState } from "react";
import type { Market } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface MarketRulesProps {
  market: Market;
}

function normalizeText(value?: string | null): string {
  if (!value) return "";
  return value.trim();
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (!isValid(date)) return "-";
  return format(date, "PPp");
}

export function MarketRules({ market }: MarketRulesProps) {
  const [activeTab, setActiveTab] = useState("resolution");

  const question = normalizeText(market.question);
  const yesCriteria = normalizeText(market.yes_criteria);
  const noCriteria = normalizeText(market.no_criteria);
  const resolutionSource = normalizeText(market.resolution_source);
  const edgeCases = normalizeText(market.edge_cases);
  const marketContext = normalizeText(market.market_context);
  const legacyRules = normalizeText(market.rules);
  const closeTime = formatDateTime(market.end_date);
  const resolutionTime = formatDateTime(market.resolution_time);
  const hasStructuredRules = Boolean(
    question || yesCriteria || noCriteria || resolutionSource || edgeCases || market.end_date || market.resolution_time
  );

  return (
    <section>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="pb-8">
        <TabsList className="h-auto p-0 bg-transparent rounded-none justify-start gap-6">
          <TabsTrigger
            value="resolution"
            className="px-0 py-0 rounded-none bg-transparent text-sm font-semibold text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Resolution Rules
          </TabsTrigger>
          <TabsTrigger
            value="context"
            className="px-0 py-0 rounded-none bg-transparent text-sm font-semibold text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Market Context
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resolution" className="mt-5">
          <div className="">
            <div className="mb-4">
              <p className="mt-1 text-xs text-muted-foreground">
                Review these terms before placing a prediction. Outcomes settle by these rules.
              </p>
            </div>

            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="font-medium text-foreground">Question</dt>
                <dd className="mt-1 ml-4 whitespace-pre-line text-muted-foreground text-xs">{question || "-"}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">What Counts as Yes</dt>
                <dd className="mt-1 ml-4 whitespace-pre-line text-muted-foreground text-xs">{yesCriteria || "-"}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">What Counts as No</dt>
                <dd className="mt-1 ml-4 whitespace-pre-line text-muted-foreground text-xs">{noCriteria || "-"}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Resolution Source</dt>
                <dd className="mt-1 ml-4 whitespace-pre-line text-muted-foreground text-xs">{resolutionSource || "-"}</dd>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-foreground">Close Time</dt>
                  <dd className="mt-1 ml-4 text-muted-foreground text-xs">{closeTime}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Resolution Time</dt>
                  <dd className="mt-1 ml-4 text-muted-foreground text-xs">{resolutionTime}</dd>
                </div>
              </div>
              <div>
                <dt className="font-medium text-foreground">Edge Cases</dt>
                <dd className="mt-1 ml-4 whitespace-pre-line text-muted-foreground text-xs">{edgeCases || "-"}</dd>
              </div>
            </dl>

            {!hasStructuredRules && (
              <div className="rounded-md border border-border/80 bg-background/60 p-3 text-sm text-muted-foreground">
                {legacyRules || "No rules provided."}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="context" className="mt-5">
          <div className="">
            <p className="mt-1 text-xs text-muted-foreground">
              This section is informational only and does not recommend a Yes/No position.
            </p>
            <div>
              <dt className="font-medium text-foreground">Context</dt>
              <dd className="mt-1 ml-4 whitespace-pre-line text-muted-foreground text-xs">{marketContext || "No additional context provided."}</dd>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
