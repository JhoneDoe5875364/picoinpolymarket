
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";
import { MARKET_CATEGORIES, categoryToSlug, slugToCategory } from "@/lib/market-categories";


interface AppNavigationProps {
  currentUser: User | null;
}

export function AppNavigation({ currentUser: _currentUser }: AppNavigationProps) {
  const pathname = usePathname();

  const pathCategory = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  const selectedCategory = pathname === "/" ? "All" : slugToCategory(pathCategory);
  const categoryMenuItems = ["All" as const, ...MARKET_CATEGORIES];

  return (
    <div className="flex w-full items-center gap-4">
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
                "flex items-center text-sm font-medium transition-colors hover:text-foreground px-3 py-2 rounded-md whitespace-nowrap",
                isActive ? "text-foreground font-semibold bg-secondary" : "text-foreground/50"
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
