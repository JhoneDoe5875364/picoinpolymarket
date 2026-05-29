"use client";

import { ChevronDown, MessageCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Market } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { MarketCommentsList } from "./participants/MarketCommentsList";

function formatCount(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

interface MarketCommentProps {
  market: Market;
}

export function MarketComment({ market }: MarketCommentProps) {
  const [open, setOpen] = useState(true);
  const [commentTotal, setCommentTotal] = useState(0);

  const refreshCommentTotal = useCallback(async () => {
    try {
      const res = await apiFetch<{ data?: { total_comment_count?: number } }>(
        `/comments/markets/${market.id}/summary`
      );
      setCommentTotal(Number(res?.data?.total_comment_count ?? 0));
    } catch {
      setCommentTotal(0);
    }
  }, [market.id]);

  useEffect(() => {
    void refreshCommentTotal();
  }, [refreshCommentTotal]);

  return (
    <section className="">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/30">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
                <MessageCircle className="h-4 w-4" />
              </div>
              <span className="text-base font-semibold text-foreground">
                Comments ({formatCount(commentTotal)})
              </span>
            </div>
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="max-h-[28rem] overflow-y-auto border-t border-border">
              <div className="p-4">
                <MarketCommentsList
                  market={market}
                  isOpen={open}
                  onCommentCountChange={setCommentTotal}
                />
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </section>
  );
}
