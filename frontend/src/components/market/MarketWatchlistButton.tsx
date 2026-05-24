"use client";

import { Star } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type MarketWatchlistButtonProps = {
  marketId: number;
  watched?: boolean;
  variant?: "icon" | "labeled";
  className?: string;
  onClick?: (event: React.MouseEvent) => void;
};

export function MarketWatchlistButton({
  marketId,
  watched = false,
  variant = "icon",
  className,
  onClick,
}: MarketWatchlistButtonProps) {
  const { ppxToken } = useAuth();
  const { isWatchlisted, toggle, isPending } = useWatchlist();
  const { toast } = useToast();
  const active = isWatchlisted(marketId, watched);
  const pending = isPending(marketId);

  const handleToggle = useCallback(
    async (event: React.MouseEvent) => {
      onClick?.(event);
      if (event.defaultPrevented) return;

      if (!ppxToken) {
        toast({
          title: "Log in required",
          description: "Log in to save markets to your watchlist.",
        });
        return;
      }

      try {
        const next = await toggle(marketId, watched);
        toast({
          title: next ? "Added to watchlist" : "Removed from watchlist",
          description: next
            ? "You can find this market under Watchlist."
            : "Market removed from your watchlist.",
        });
      } catch {
        toast({
          title: "Could not update watchlist",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    },
    [marketId, onClick, ppxToken, toast, toggle, watched]
  );

  const button =
    variant === "labeled" ? (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        className={cn("gap-2", className)}
        onClick={(event) => void handleToggle(event)}
        aria-label={active ? "Remove from watchlist" : "Add to watchlist"}
        aria-pressed={active}
      >
        <Star className={cn("h-4 w-4", active && "fill-amber-400 text-amber-500")} />
        {active ? "Watching" : "Watch"}
      </Button>
    ) : (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={pending}
        className={cn("h-8 w-8 shrink-0", className)}
        onClick={(event) => void handleToggle(event)}
        aria-label={active ? "Remove from watchlist" : "Add to watchlist"}
        aria-pressed={active}
      >
        <Star
          className={cn(
            "h-4 w-4",
            active ? "fill-amber-400 text-amber-500" : "text-muted-foreground"
          )}
        />
      </Button>
    );

  if (variant === "labeled") {
    return button;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="top">{active ? "Remove from watchlist" : "Add to watchlist"}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
