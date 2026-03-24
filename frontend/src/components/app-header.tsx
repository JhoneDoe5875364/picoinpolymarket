"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LoginWithPi from "./LoginWithPi";
import { Button } from "./ui/button";
import { CheckCircle } from "lucide-react";
import { User } from "@/lib/types";
import { AppNavigation } from "./app-navigation";

interface AppHeaderProps {
  currentUser: User | null;
}

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

          <div className="flex">
            {renderAuthButton()}
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
