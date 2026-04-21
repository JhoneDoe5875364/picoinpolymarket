"use client";

import Link from "next/link";
import LoginWithPi from "./LoginWithPi";
import { Button } from "./ui/button";
import { CheckCircle, Menu } from "lucide-react";
import { User } from "@/lib/types";
import { AppNavigation } from "./AppNavigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface AppHeaderProps {
  currentUser: User | null;
}

const moreMenuItems = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/account", label: "Profile" },
  { href: "/admin", label: "Admin", admin: true },
  { href: "mailto:support@predictpix.com", label: "Help Center" },
  { href: "/terms", label: "Terms of Use" },
];

export default function AppHeader({ currentUser }: AppHeaderProps) {
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

  return (
    <header className="sticky top-0 z-40 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="border-b">
        <div className="container h-14 flex items-center justify-between relative">
          <Link href="/" className="flex items-center gap-0 font-bold text-lg">
            <span className="text-xl font-headline font-bold tracking-tight">
              <span className="text-chart-2">Predict</span>
              <span className="text-accent">Pix</span>
            </span>
          </Link>

          <div className="hidden md:flex">
            <div className="flex items-center gap-2">
              {renderAuthButton()}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl border border-white/20 bg-[#0f1724] text-cyan-400 hover:bg-[#172334] hover:text-cyan-300"
                    aria-label="Open more menu"
                  >
                    <Menu className="h-5 w-5 text-white" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {moreMenuItems.map((item) => (
                    <DropdownMenuItem key={item.label} asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b">
        <div className="container flex h-12 items-center overflow-x-auto">
          <AppNavigation currentUser={currentUser} />
        </div>
      </div>
    </header>
  );
}
