"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LoginWithPi from "./LoginWithPi";
import { Button } from "./ui/button";
import { CheckCircle, Menu, Moon, Sun } from "lucide-react";
import { User } from "@/lib/types";
import { AppNavigation } from "./AppNavigation";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface AppHeaderProps {
  currentUser: User | null;
}

const moreMenuItems = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/profile", label: "Profile", requiresAuth: true },
  { href: "/admin", label: "Admin", requiresAdmin: true },
  { href: "/help", label: "Help Center" },
  { href: "/terms", label: "Terms of Use" },
];

export default function AppHeader({ currentUser }: AppHeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const pathname = usePathname();
  const { ppxUser } = useAuth();
  const hideCategoryMenu = ["/profile", "/leaderboard"].some(
    (basePath) => pathname === basePath || pathname.startsWith(`${basePath}/`)
  );
  const isLoggedIn = Boolean(ppxUser);
  const isAdminUser = ppxUser?.role === "admin" || ppxUser?.role === "superadmin";

  useEffect(() => {
    const root = document.documentElement;
    const savedTheme = window.localStorage.getItem("theme");
    const shouldUseDark = savedTheme ? savedTheme === "dark" : root.classList.contains("dark");
    root.classList.toggle("dark", shouldUseDark);
    setIsDarkMode(shouldUseDark);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextIsDark = !root.classList.contains("dark");
    root.classList.toggle("dark", nextIsDark);
    window.localStorage.setItem("theme", nextIsDark ? "dark" : "light");
    setIsDarkMode(nextIsDark);
  };

  const renderAuthButton = () => {
    if (currentUser) {
      return (
        <Button variant="outline" disabled>
          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
          {currentUser.pi_username}
        </Button>
      );
    }
    return <LoginWithPi />;
  }

  const renderMoreMenu = () => {
    const visibleMenuItems = moreMenuItems.filter((item) => {
      if (item.requiresAdmin) {
        return isAdminUser;
      }
      if (item.requiresAuth) {
        return isLoggedIn;
      }
      return true;
    });

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 border border-border bg-background text-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Open more menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {visibleMenuItems.map((item) => (
            <DropdownMenuItem key={item.label} asChild>
              <Link href={item.href}>{item.label}</Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={toggleTheme}>
            {isDarkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {isDarkMode ? "Light mode" : "Dark mode"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="border-b">
        <div className="container h-14 flex items-center justify-between relative">
          <Link href="/" className="flex items-center gap-0 font-bold text-lg">
            <span className="text-xl font-headline font-bold tracking-tight">
              <span className="text-foreground">Predict</span>
              <span className="text-primary">Pix</span>
            </span>
          </Link>

          <div className="flex">
            <div className="flex items-center gap-2">
              {renderAuthButton()}
              <div>{renderMoreMenu()}</div>
            </div>
          </div>
        </div>
      </div>

      {!hideCategoryMenu && (
        <div className="border-b">
          <div className="container flex h-12 items-center overflow-x-auto">
            <AppNavigation currentUser={currentUser} />
          </div>
        </div>
      )}
    </header>
  );
}
