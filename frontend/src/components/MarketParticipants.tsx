"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Market } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ActivityTabContent } from "./market/participants/ActivityTabContent";
import { PositionsTabContent } from "./market/participants/PositionsTabContent";
import { TopHoldersTabContent } from "./market/participants/TopHoldersTabContent";
import { normalizeNumber } from "./market/participants/shared";
import type {
  MarketHolder,
  MarketHolderGroup,
  MarketPosition,
  MarketPositionGroup,
  MarketTradeActivity,
  MinAmountFilter,
  PositionStatus,
  SortDirection,
} from "./market/participants/types";

export function MarketParticipants({ market }: { market: Market }) {
  const [holdersLoading, setHoldersLoading] = useState(true);
  const [positionsLoading, setPositionsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [yesHolders, setYesHolders] = useState<MarketHolder[]>([]);
  const [noHolders, setNoHolders] = useState<MarketHolder[]>([]);
  const [yesPositions, setYesPositions] = useState<MarketPosition[]>([]);
  const [noPositions, setNoPositions] = useState<MarketPosition[]>([]);
  const [activityRows, setActivityRows] = useState<MarketTradeActivity[]>([]);
  const [positionStatus, setPositionStatus] = useState<PositionStatus>("ALL");
  const [sortDirection, setSortDirection] = useState<SortDirection>("DESC");
  const [minAmount, setMinAmount] = useState<MinAmountFilter>("NONE");

  useEffect(() => {
    if (!market?.id) {
      setYesHolders([]);
      setNoHolders([]);
      setHoldersLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      setHoldersLoading(true);
      try {
        const params = new URLSearchParams({
          market_id: String(market.id),
          limit: "20",
          min_balance: "1",
        });
        const response = await apiFetch<{ data?: MarketHolderGroup[] }>(`/markets/holders?${params.toString()}`);
        if (!mounted) return;

        const groups = response?.data ?? [];
        const yes = groups.find((item) => item.token_id === market.token_yes_id)?.holders ?? [];
        const no = groups.find((item) => item.token_id === market.token_no_id)?.holders ?? [];
        setYesHolders(yes);
        setNoHolders(no);
      } catch (error) {
        if (mounted) {
          setYesHolders([]);
          setNoHolders([]);
        }
      } finally {
        if (mounted) setHoldersLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [market?.id, market?.token_yes_id, market?.token_no_id]);

  useEffect(() => {
    if (!market?.id) {
      setYesPositions([]);
      setNoPositions([]);
      setPositionsLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      setPositionsLoading(true);
      try {
        const params = new URLSearchParams({
          market_id: String(market.id),
          status: positionStatus,
          limit: "20",
          offset: "0",
          order: "shares",
          ascending: String(sortDirection === "ASC"),
        });
        const response = await apiFetch<{ data?: MarketPositionGroup[] }>(`/markets/positions?${params.toString()}`);
        if (!mounted) return;

        const groups = response?.data ?? [];
        const yes = groups.find((item) => item.token_id === market.token_yes_id)?.positions ?? [];
        const no = groups.find((item) => item.token_id === market.token_no_id)?.positions ?? [];
        setYesPositions(yes);
        setNoPositions(no);
      } catch (error) {
        if (mounted) {
          setYesPositions([]);
          setNoPositions([]);
        }
      } finally {
        if (mounted) setPositionsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [market?.id, market?.token_yes_id, market?.token_no_id, sortDirection, positionStatus]);

  useEffect(() => {
    if (!market?.id) {
      setActivityRows([]);
      setActivityLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      setActivityLoading(true);
      try {
        const params = new URLSearchParams({
          market_id: String(market.id),
          offset: "0",
          limit: "30",
          order: "created_at",
          ascending: "false",
        });
        const response = await apiFetch<{ data?: MarketTradeActivity[] }>(`/markets/trades?${params.toString()}`);
        if (!mounted) return;
        setActivityRows(response?.data ?? []);
      } catch (error) {
        if (mounted) setActivityRows([]);
      } finally {
        if (mounted) setActivityLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [market?.id]);

  const filteredActivityRows = useMemo(() => {
    const minAmountThreshold = minAmount === "NONE" ? 0 : Number(minAmount);
    return activityRows.filter((row) => normalizeNumber(row.pi_amount) >= minAmountThreshold);
  }, [activityRows, minAmount]);

  return (
    <section>
      <Tabs defaultValue="top-holders">
        <TabsList className="h-auto p-0 bg-transparent rounded-none justify-start gap-6">
          <TabsTrigger
            value="top-holders"
            className="px-0 py-0 rounded-none bg-transparent text-sm font-semibold text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Top Holders
          </TabsTrigger>
          <TabsTrigger
            value="positions"
            className="px-0 py-0 rounded-none bg-transparent text-sm font-semibold text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Positions
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="px-0 py-0 rounded-none bg-transparent text-sm font-semibold text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="top-holders" className="mt-5">
          <TopHoldersTabContent holdersLoading={holdersLoading} yesHolders={yesHolders} noHolders={noHolders} />
        </TabsContent>

        <TabsContent value="positions" className="mt-5">
          <PositionsTabContent
            positionsLoading={positionsLoading}
            yesPositions={yesPositions}
            noPositions={noPositions}
            positionStatus={positionStatus}
            sortDirection={sortDirection}
            onPositionStatusChange={setPositionStatus}
            onSortDirectionChange={setSortDirection}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-5">
          <ActivityTabContent
            activityLoading={activityLoading}
            minAmount={minAmount}
            filteredActivityRows={filteredActivityRows}
            onMinAmountChange={setMinAmount}
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}
