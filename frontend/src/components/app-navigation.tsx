
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

const allMenuItems = [
  { href: "/", label: "Markets" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/account", label: "Account" },
  { href: "/admin", label: "Admin", admin: true },
];

interface AppNavigationProps {
  currentUser: User | null;
}

export function AppNavigation({ currentUser }: AppNavigationProps) {
  const pathname = usePathname();

  const { role } = useAuth();
  
  // The filter that was previously here has been removed.
  // The admin link will now show for all users.
  const menuItems = allMenuItems;

  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        if (item.admin && (role != "superadmin" && role != "admin"))
          return null;
        
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center text-sm font-medium transition-colors hover:text-primary px-2 sm:px-3 py-2 rounded-md whitespace-nowrap",
              isActive ? "text-primary bg-secondary" : "text-white",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

    
