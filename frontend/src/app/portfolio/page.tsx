"use client";
import React from "react";
import { AccountAPI } from "@/lib/api";
import { setAccessToken, getAccessToken } from "@/lib/auth-token";

function ensureToken() {
  if (typeof window !== "undefined" && (window as any).__PPX_TOKEN__) {
    setAccessToken((window as any).__PPX_TOKEN__);
  }
}

export default function PortfolioPage() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    ensureToken();
    const token = getAccessToken();
    if (!token) {
      setErr("No access token set. Paste once, then it will persist.");
      return;
    }
    AccountAPI.positionsOpen()
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((e) => setErr(e.message || String(e)));
  }, []);

  if (err) return <div className="p-4 text-red-500">Error: {err}</div>;
  if (!rows.length) return <div className="p-4">No open positions found.</div>;

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-2xl font-bold">Open Positions</h1>
      {rows.map((p) => (
        <div key={p.position_id} className="p-3 border rounded-xl">
          <div className="font-medium">{p.market_title || p.market_id}</div>
          <div className="text-sm opacity-75">
            {p.side?.toUpperCase()} · {p.pi_amount} Pi · {new Date(p.created_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
