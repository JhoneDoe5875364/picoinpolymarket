"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Sparkles, Trophy, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const menuItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/new", label: "New", icon: Sparkles },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { ppxUser } = useAuth();

  if (!ppxUser) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 md:hidden">
      <div
        className="grid grid-cols-4 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-1"
      >
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-[11px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={item.label}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
