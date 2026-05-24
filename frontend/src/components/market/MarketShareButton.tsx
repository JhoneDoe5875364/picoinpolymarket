"use client";

import { Share2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { shareMarket } from "@/lib/share/shareMarket";
import { cn } from "@/lib/utils";

type MarketShareButtonProps = {
  marketId: number;
  title: string;
  variant?: "icon" | "labeled";
  className?: string;
  onClick?: (event: React.MouseEvent) => void;
};

export function MarketShareButton({
  marketId,
  title,
  variant = "icon",
  className,
  onClick,
}: MarketShareButtonProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const lastShareRef = useRef(0);

  const handleShare = useCallback(
    async (event: React.MouseEvent) => {
      onClick?.(event);
      if (event.defaultPrevented) return;

      const now = Date.now();
      if (now - lastShareRef.current < 1000) return;
      lastShareRef.current = now;

      setBusy(true);
      try {
        const result = await shareMarket({ marketId, title });
        if (result === "shared") {
          toast({ title: "Shared", description: "Market link shared." });
        } else if (result === "copied") {
          toast({ title: "Link copied", description: "Market link copied to clipboard." });
        } else {
          toast({
            title: "Could not share",
            description: "Try copying the link from your browser.",
            variant: "destructive",
          });
        }
      } finally {
        setBusy(false);
      }
    },
    [marketId, onClick, title, toast]
  );

  const button =
    variant === "labeled" ? (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        className={cn("gap-2", className)}
        onClick={(event) => void handleShare(event)}
        aria-label="Share this market"
      >
        <Share2 className="h-4 w-4" />
        Share this market
      </Button>
    ) : (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={busy}
        className={cn("h-8 w-8 shrink-0", className)}
        onClick={(event) => void handleShare(event)}
        aria-label="Share market"
      >
        <Share2 className="h-4 w-4" />
      </Button>
    );

  if (variant === "labeled") {
    return button;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="top">Share market</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
