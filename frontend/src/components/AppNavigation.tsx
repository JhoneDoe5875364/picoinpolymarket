
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { MARKET_CATEGORIES, categoryToSlug, slugToCategory } from "@/lib/market-categories";

const primaryMenuItems = [
  { href: "/", label: "Home" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/account", label: "Profile" },
  { href: "/admin", label: "Admin", admin: true },
];

interface AppNavigationProps {
  currentUser: User | null;
}

export function AppNavigation({ currentUser: _currentUser }: AppNavigationProps) {
  const pathname = usePathname();

  const { role } = useAuth();
  const pathCategory = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  const selectedCategory = pathname === "/" ? "All" : slugToCategory(pathCategory);
  const categoryMenuItems = ["All" as const, ...MARKET_CATEGORIES];

  return (
    <div className="flex w-full items-center gap-4">
      <nav className="hidden md:flex items-center gap-1">
        {primaryMenuItems.map((item) => {
          const isActive = pathname === item.href;
          if (item.admin && role !== "superadmin" && role !== "admin") return null;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md whitespace-nowrap",
                isActive ? "text-primary bg-secondary" : "text-white"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-none">
        {categoryMenuItems.map((category) => {
          const isAll = category === "All";
          const href = isAll ? "/" : `/${categoryToSlug(category)}`;
          const isActive = isAll ? selectedCategory === "All" : selectedCategory === category;

          return (
            <Link
              key={category}
              href={href}
              className={cn(
                "flex items-center text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md whitespace-nowrap",
                isActive ? "text-primary bg-secondary" : "text-white/80"
              )}
            >
              {category}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
