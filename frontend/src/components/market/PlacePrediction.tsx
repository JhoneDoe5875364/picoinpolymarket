// src/components/market/PlacePrediction.tsx
"use client";

import { Button } from "@/components/ui/button";
import QuickBuyModal from "@/components/market/QuickBuyModal";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PlacePrediction({ marketId }: { marketId: string }) {
  const [outcome, setOutcome] = useState<"YES" | "NO" | null>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // If the pathname changes, reset the modal and buy side states
  useEffect(() => {
    setOpen(false);
    setOutcome(null);
  }, [pathname]);

  // When the component unmounts, reset the modal and buy side states
  useEffect(() => {
    return () => {
      setOpen(false);
      setOutcome(null);
    };
  }, []);

  return (
    <div className="rounded-xl border border-white/10 p-4">
      <div className="text-sm opacity-80 mb-3">Place Prediction</div>
      <div className="flex gap-4">
        <Button
          className="btn-yes glowing-focus"
          onClick={() => {
            setOutcome("YES");
            setOpen(true);
          }}
        >
          Choose Yes
        </Button>
        <Button
          className="btn-no glowing-focus"
          onClick={() => {
            setOutcome("NO");
            setOpen(true);
          }}
        >
          Choose No
        </Button>
      </div>

      {outcome && (
        <QuickBuyModal
          open={open}
          marketId={marketId}
          outcome={outcome}
          onClose={() => {
            setOpen(false);
            setOutcome(null);
          }}
          onDone={() => {
            setOpen(false);
            setOutcome(null);
            // optional: fire a revalidation or SWR mutate here if you use it
          }}
        />
      )}
    </div>
  );
}
