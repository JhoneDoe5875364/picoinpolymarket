"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

export default function SeedButton() {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    try {
      setBusy(true);
      setMsg("Seeding…");
      // const res = await callCreateTestMarket();
      // @ts-ignore – httpsCallable returns { data: ... }
      // setMsg(`Done: ${res?.data?.id ?? "ok"}`);
    } catch (e: any) {
      setMsg(`Failed: ${e?.message ?? "unknown error"}`);
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={run}
        disabled={busy}
        variant="destructive"
      >
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
        {busy ? "Working…" : "Seed Database"}
      </Button>
      {msg && <span className="opacity-80 text-sm">{msg}</span>}
    </div>
  );
}
