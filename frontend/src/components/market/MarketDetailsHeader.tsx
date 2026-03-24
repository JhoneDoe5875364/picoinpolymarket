// src/components/market/MarketDetailsHeader.tsx
"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type MarketLike = {
  id: string;
  question?: string | null;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  status?: "open" | "resolved" | "pending_resolution" | string | null;
  // your schema field; use whatever you store for the resolve/end time
  resolves_at?: string | null;
  resolution_date?: string | null;
};

type Stats = {
  volume?: number | null;
  trades?: number | null;
};

function fmtNum(n: unknown, fallback = "0") {
  if (typeof n === "number" && Number.isFinite(n)) return n.toLocaleString();
  const num = typeof n === "string" ? Number(n) : NaN;
  return Number.isFinite(num) ? num.toLocaleString() : fallback;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  // Example: Dec 31, 2025, 4:59 PM
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MarketDetailsHeader({
  market,
  stats,
}: {
  market: MarketLike;
  stats?: Stats;
}) {
  const title = market?.question ?? market?.title ?? "Untitled market";
  const desc = market?.description ?? "";
  const category = market?.category ?? "General";
  const status = (market?.status ?? "open") as string;

  const resolves =
    market?.resolves_at ?? market?.resolution_date ?? null;

  return (
    <Card className="mb-6">
      <CardContent className="p-6 md:p-8">
        {/* Top line: category left, status right */}
        <div className="flex items-center justify-between gap-4">
          <Badge variant="outline" className="border-accent text-accent">
            {category}
          </Badge>
          <Badge variant={status === "open" ? "default" : "secondary"}>
            {status}
          </Badge>
        </div>

        {/* Title */}
        <h1 className="mt-3 text-2xl md:text-3xl font-semibold leading-tight">
          {title}
        </h1>

        {/* Description */}
        {!!desc && (
          <p className="mt-3 text-sm md:text-[15px] text-muted-foreground">
            {desc}
          </p>
        )}

        {/* KPI Row */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 bg-card/60 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Volume
            </div>
            <div className="mt-1 text-lg font-semibold">
              {fmtNum(stats?.volume)} <span className="text-xs opacity-70">π</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-card/60 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Trades
            </div>
            <div className="mt-1 text-lg font-semibold">
              {fmtNum(stats?.trades)}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-card/60 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Resolves
            </div>
            <div className="mt-1 text-lg font-semibold">
              {fmtDate(resolves)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
