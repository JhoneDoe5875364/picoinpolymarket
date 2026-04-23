
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
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const adminSection = pathname.split("/")[2] || "markets";

  const pathCategory = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  const selectedCategory = pathname === "/" ? "All" : slugToCategory(pathCategory);
  const categoryMenuItems = ["All" as const, ...MARKET_CATEGORIES];
  const adminMenuItems = [
    { label: "Markets", href: "/admin/markets", section: "markets" },
    { label: "Suggestions", href: "/admin/suggestions", section: "suggestions" },
    { label: "Users", href: "/admin/users", section: "users" },
    { label: "Metrics", href: "/admin/metrics", section: "metrics" },
  ] as const;

  return (
    <div className="flex w-full items-center gap-4">
      <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-none">
        {isAdminRoute
          ? adminMenuItems.map((item) => {
              const isActive = adminSection === item.section;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center text-sm font-medium transition-colors hover:text-foreground px-3 py-2 rounded-md whitespace-nowrap",
                    isActive ? "text-foreground font-semibold bg-secondary" : "text-foreground/50"
                  )}
                >
                  {item.label}
                </Link>
              );
            })
          : categoryMenuItems.map((category) => {
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
