"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchPayoutWallet } from "@/lib/wallet";

/**
 * App-wide reminder shown to logged-in users who have not saved a payout wallet
 * address. Payouts cannot reach them until they do, so nudge everywhere — not
 * just on the profile page. Hidden on the profile page itself (they can fix it
 * right there) and while the check is in flight.
 */
export function WalletReminderBanner() {
  const { ppxUser } = useAuth();
  const pathname = usePathname();
  const [needsWallet, setNeedsWallet] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!ppxUser?.id) {
      setNeedsWallet(false);
      return;
    }
    (async () => {
      const addr = await fetchPayoutWallet();
      if (!cancelled) setNeedsWallet(!addr);
    })();
    return () => {
      cancelled = true;
    };
  }, [ppxUser?.id]);

  if (!needsWallet || pathname === "/profile") {
    return null;
  }

  return (
    <div className="border-b border-amber-500/40 bg-amber-500/10">
      <div className="container flex flex-wrap items-center justify-center gap-x-2 gap-y-1 py-2 text-center text-sm">
        <span className="font-medium text-amber-700 dark:text-amber-300">
          Add your payout wallet address so winnings can reach you.
        </span>
        <Link href="/profile" className="font-semibold text-primary underline">
          Set it up in your profile →
        </Link>
      </div>
    </div>
  );
}
