'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileOverview } from '@/components/profile/ProfileOverview';
import { ProfilePositionsTab } from '@/components/profile/ProfilePositionsTab';
import { ProfileActivityTab } from '@/components/profile/ProfileActivityTab';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'positions' | 'activity'>('positions');

  return (
    <div className="container mx-auto space-y-6 px-2.5 py-4 sm:space-y-7 sm:px-6 sm:py-6 lg:px-8">
      <ProfileOverview />

      <section className="space-y-3">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'positions' | 'activity')} className="w-full">
          <TabsList className="h-auto gap-4 bg-transparent p-0">
            <TabsTrigger
              value="positions"
              className="px-0 text-lg sm:text-xl font-bold data-[state=active]:shadow-none"
            >
              Positions
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="px-0 text-lg sm:text-xl font-bold data-[state=active]:shadow-none"
            >
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="positions">
            <ProfilePositionsTab isActive={activeTab === 'positions'} />
          </TabsContent>

          <TabsContent value="activity">
            <ProfileActivityTab isActive={activeTab === 'activity'} />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
