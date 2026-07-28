"use client";

import { useState, useEffect } from "react";
import { initPiSDK } from "@/lib/pi";
import type { User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { AppFooter } from "./AppFooter";
import Link from "next/link";
import { PredictPixLogo } from "@/components/PredictPixLogo";

import AppHeader from "./AppHeader";
import { WalletReminderBanner } from "@/components/WalletReminderBanner";
import { usePathname } from "next/navigation";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

function AppSkeleton() {
  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-sm">
        <div className="border-b">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <Link href="/" className="flex items-center space-x-2">
                <PredictPixLogo className="h-6 w-6 text-primary" />
                <span className="font-bold font-headline">
                  <span className="text-chart-2">Predict</span>
                  <span className="text-accent">Pix</span>
                </span>
              </Link>
            </div>
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
        <div className="border-b">
          <div className="container flex h-12 items-center">
            <Skeleton className="h-8 w-full max-w-sm" />
          </div>
        </div>
      </header>
      <main className="flex-grow">{/* Children will be rendered by layout */}</main>
      <AppFooter />
    </>
  )
}

const MARKET_DETAIL_PATH = /^\/markets\/[^/]+$/;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { ppxUser } = useAuth();
  const hideHeaderFooter = pathname === '/region-unavailable';
  const isMarketDetailPage = MARKET_DETAIL_PATH.test(pathname);
  const showMobileBottomNav = Boolean(ppxUser) && !hideHeaderFooter && !isMarketDetailPage;

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    async function initPiSDKAsync() {
      await initPiSDK();
      setIsMounted(true);
    }
    initPiSDKAsync();
  }, []);

  if (!isMounted) {
    // While we wait for auth state, show a skeleton screen
    return <AppSkeleton />;
  }

  return (
    <>
      {!hideHeaderFooter && <AppHeader currentUser={currentUser} />}
      {!hideHeaderFooter && <WalletReminderBanner />}
      <main
        id="content"
        className={cn("min-h-[60vh] md:pb-0", showMobileBottomNav ? "pb-20" : "pb-0")}
      >
        {children}
      </main>
      {!hideHeaderFooter && <AppFooter />}
      {showMobileBottomNav && (
        <div className="h-[calc(env(safe-area-inset-bottom)+4.25rem)] md:hidden" aria-hidden />
      )}
      {showMobileBottomNav && <MobileBottomNav />}
    </>
  );
}
