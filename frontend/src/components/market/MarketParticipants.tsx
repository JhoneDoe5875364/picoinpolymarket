"use client";

import { useState } from "react";
import type { Market } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ActivityTabContent } from "./participants/ActivityTabContent";
import { PositionsTabContent } from "./participants/PositionsTabContent";
import { TopHoldersTabContent } from "./participants/TopHoldersTabContent";

const tabTriggerClassName =
  "shrink-0 px-0 py-0 rounded-none bg-transparent text-md font-semibold text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none";

export function MarketParticipants({ market }: { market: Market }) {
  const [activeTab, setActiveTab] = useState("top-holders");

  return (
    <section>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="pb-8">
        <div className="max-w-full overflow-x-auto overscroll-x-contain">
          <TabsList className="h-auto w-max max-w-none flex-nowrap p-0 bg-transparent rounded-none justify-start gap-4">
            <TabsTrigger value="top-holders" className={tabTriggerClassName}>
              Top Holders
            </TabsTrigger>
            <TabsTrigger value="positions" className={tabTriggerClassName}>
              Positions
            </TabsTrigger>
            <TabsTrigger value="activity" className={tabTriggerClassName}>
              Activity
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="top-holders" className="mt-5">
          <TopHoldersTabContent market={market} isActive={activeTab === "top-holders"} />
        </TabsContent>

        <TabsContent value="positions" className="mt-5">
          <PositionsTabContent market={market} isActive={activeTab === "positions"} />
        </TabsContent>

        <TabsContent value="activity" className="mt-5">
          <ActivityTabContent market={market} isActive={activeTab === "activity"} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
