// src/components/market/PlacePrediction.tsx
"use client";

import { Button } from "@/components/ui/button";
import QuickBuyModal from "@/components/trade/QuickBuyModal";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PlacePrediction({ marketId }: { marketId: string }) {
  const [side, setSide] = useState<null | "yes" | "no">(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // If the pathname changes, reset the modal and buy side states
  useEffect(() => {
    setOpen(false);
    setSide(null);
  }, [pathname]);

  // When the component unmounts, reset the modal and buy side states
  useEffect(() => {
    return () => {
      setOpen(false);
      setSide(null);
    };
  }, []);

  return (
    <div className="rounded-xl border border-white/10 p-4">
      <div className="text-sm opacity-80 mb-3">Place Prediction</div>
      <div className="flex gap-4">
        <Button
          className="btn-yes glowing-focus"
          onClick={() => {
            setSide("yes");
            setOpen(true);
          }}
        >
          Choose Yes
        </Button>
        <Button
          className="btn-no glowing-focus"
          onClick={() => {
            setSide("no");
            setOpen(true);
          }}
        >
          Choose No
        </Button>
      </div>

      {side && (
        <QuickBuyModal
          open={open}
          marketId={marketId}
          side={side}
          onClose={() => {
            setOpen(false);
            setSide(null);
          }}
          onDone={() => {
            setOpen(false);
            setSide(null);
            // optional: fire a revalidation or SWR mutate here if you use it
          }}
        />
      )}
    </div>
  );
}
