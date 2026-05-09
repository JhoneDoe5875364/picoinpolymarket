
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";
import {
  MARKET_CATEGORIES,
  MARKET_DISCOVERY_MENUS,
  categoryToSlug,
  discoveryToSlug,
  slugToCategory,
  slugToDiscovery,
} from "@/lib/market-categories";


interface AppNavigationProps {
  currentUser: User | null;
}

export function AppNavigation({ currentUser: _currentUser }: AppNavigationProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const adminSection = pathname.split("/")[2] || "markets";

  const pathSegment = pathname.split("/")[1] ?? "";
  const selectedCategory = pathname === "/" ? "All" : slugToCategory(pathSegment);
  const selectedDiscovery = slugToDiscovery(pathSegment);
  const adminMenuItems = [
    { label: "Metrics", href: "/admin/metrics", section: "metrics" },
    { label: "Markets", href: "/admin/markets", section: "markets" },
    { label: "Users", href: "/admin/users", section: "users" },
    { label: "Payments", href: "/admin/payments", section: "payment" },
    { label: "Suggestions", href: "/admin/suggestions", section: "suggestions" },
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
          : (
            <>
              {MARKET_DISCOVERY_MENUS.map((menu) => {
                const href = `/${discoveryToSlug(menu.key)}`;
                const isActive = selectedDiscovery?.key === menu.key;

                return (
                  <Link
                    key={menu.key}
                    href={href}
                    className={cn(
                      "flex items-center text-sm font-medium transition-colors hover:text-foreground px-3 py-2 rounded-md whitespace-nowrap",
                      isActive ? "text-foreground font-semibold bg-secondary" : "text-foreground/50"
                    )}
                  >
                    {menu.label}
                  </Link>
                );
              })}
              <span className="mx-2 text-muted-foreground/60 select-none" aria-hidden="true">
                |
              </span>
              {MARKET_CATEGORIES.map((category) => {
                const href = categoryToSlug(category);
                const isActive = selectedCategory === category;

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
            </>
          )}
      </nav>
    </div>
  );
}
