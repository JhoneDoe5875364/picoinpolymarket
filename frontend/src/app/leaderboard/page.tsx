"use client";

import { LeaderboardCard } from "@/components/LeaderboardCard";
import { apiFetch } from "@/lib/api";
import { Response } from "@/lib/types";
import { useEffect, useState } from "react";

export default function LeaderboardPage() {
  const [data, setData] = useState<Response | null>(null);

  useEffect(() => {
    (async () => {
      const res = await apiFetch("/markets/leaderboard?limit=50", { method: "GET" });
      console.log(res)
      setData(res);
    })()
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold font-headline tracking-tighter text-primary">Leaderboard</h1>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
            See how you stack up against the top traders on the platform.
          </p>
        </div>

        <div className="space-y-4">
          {data?.items.map(entry => (
            <LeaderboardCard key={entry.rank} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  );
}
