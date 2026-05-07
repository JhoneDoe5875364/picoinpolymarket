"use client";

import { format, isValid } from "date-fns";
import type { Market } from "@/lib/types";

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
    <section className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground">Resolution Rules</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Review these terms before placing a prediction. Outcomes settle by these rules.
          </p>
        </div>

        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="font-medium text-muted-foreground">Question</dt>
            <dd className="mt-1 ml-2 whitespace-pre-line text-foreground text-xs">{question || "-"}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">What Counts as Yes</dt>
            <dd className="mt-1 ml-2 whitespace-pre-line text-foreground text-xs">{yesCriteria || "-"}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">What Counts as No</dt>
            <dd className="mt-1 ml-2 whitespace-pre-line text-foreground text-xs">{noCriteria || "-"}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Resolution Source</dt>
            <dd className="mt-1 ml-2 whitespace-pre-line text-foreground text-xs">{resolutionSource || "-"}</dd>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="font-medium text-muted-foreground">Close Time</dt>
              <dd className="mt-1 ml-2 text-foreground text-xs">{closeTime}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Resolution Time</dt>
              <dd className="mt-1 ml-2 text-foreground text-xs">{resolutionTime}</dd>
            </div>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Edge Cases</dt>
            <dd className="mt-1 ml-2 whitespace-pre-line text-foreground text-xs">{edgeCases || "-"}</dd>
          </div>
        </dl>

        {!hasStructuredRules && (
          <div className="rounded-md border border-border/80 bg-background/60 p-3 text-sm text-muted-foreground">
            {legacyRules || "No rules provided."}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
        <h4 className="text-sm font-semibold text-foreground">Market Context</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          This section is informational only and does not recommend a Yes/No position.
        </p>
        <p className="mt-3 ml-2 whitespace-pre-line text-sm text-foreground">
          {marketContext || "No additional context provided."}
        </p>
      </div>
    </section>
  );
}
