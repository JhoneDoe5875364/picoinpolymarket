"use client";
import React from "react";
import { AccountAPI } from "@/lib/api";
import { setAccessToken, getAccessToken } from "@/lib/auth-token";

function ensureToken() {
  if (typeof window !== "undefined" && (window as any).__PPX_TOKEN__) {
    setAccessToken((window as any).__PPX_TOKEN__);
  }
}

export default function OverviewPage() {
  const [data, setData] = React.useState<any>(null);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    ensureToken();                     // ✅ always try to set it first
    const token = getAccessToken();
    if (!token) {
      setErr("No access token set. Paste your token once per session.");
      return;
    }
    AccountAPI.overview()
      .then(setData)
      .catch((e) => setErr(e.message || String(e)));
  }, []);

  if (err) return <div className="p-4 text-red-500">Error: {err}</div>;
  if (!data) return <div className="p-4">Loading overview...</div>;

  const t = data.totals || {};
  const recent = data.recent || [];

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Account Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total" value={t.total_amount ?? 0} />
        <Stat label="Yes" value={t.total_yes ?? 0} />
        <Stat label="No" value={t.total_no ?? 0} />
        <Stat label="Positions" value={t.count ?? 0} />
      </div>
      <section>
        <h2 className="text-xl font-semibold mb-2">Recent</h2>
        <ul className="space-y-2">
          {recent.map((r: any) => (
            <li key={r.position_id} className="p-3 border rounded-xl">
              <div className="font-medium">{r.market_title}</div>
              <div className="text-sm opacity-75">
                {r.side?.toUpperCase()} · {r.pi_amount} Pi ·{" "}
                {new Date(r.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-3 border rounded-xl text-center">
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
