"use client";

import { Ban, EyeOff, Flag, MoreHorizontal, VolumeX } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetchWithToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CommentActionMenuProps {
  commentId: number;
  playerId: number;
  piUsername?: string | null;
  onHidden?: () => void;
}

function isAdminRole(role?: string | null): boolean {
  const normalized = (role ?? "").toLowerCase();
  return normalized === "admin" || normalized === "superadmin";
}

export function CommentActionMenu({
  commentId,
  playerId,
  piUsername,
  onHidden,
}: CommentActionMenuProps) {
  const { ppxToken, ppxUser } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const isAdmin = isAdminRole(ppxUser?.role);

  const runAction = async (label: string, action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      toast({ title: label, description: "Action completed." });
    } catch (e) {
      toast({
        title: "Action failed",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleReport = () =>
    runAction("Comment reported", async () => {
      if (!ppxToken) throw new Error("Log in to report comments.");
      await apiFetchWithToken(`/comments/${commentId}/report`, {
        method: "POST",
        body: JSON.stringify({}),
      });
    });

  const handleHide = () =>
    runAction("Comment hidden", async () => {
      await apiFetchWithToken(`/comments/${commentId}`, { method: "DELETE" });
      onHidden?.();
    });

  const handleUserStatus = (status: "SUSPENDED" | "BANNED", label: string) =>
    runAction(label, async () => {
      await apiFetchWithToken("/users/status", {
        method: "POST",
        body: JSON.stringify({ user_id: playerId, status }),
      });
    });

  if (!ppxToken) return null;

  const displayName = piUsername?.trim() || `User ${playerId}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Comment actions"
          disabled={busy}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => void handleReport()} disabled={busy}>
          <Flag className="mr-2 h-4 w-4" />
          Report
        </DropdownMenuItem>
        {isAdmin ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void handleHide()} disabled={busy}>
              <EyeOff className="mr-2 h-4 w-4" />
              Hide comment
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => void handleUserStatus("SUSPENDED", `${displayName} muted`)}
              disabled={busy}
            >
              <VolumeX className="mr-2 h-4 w-4" />
              Mute user
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => void handleUserStatus("BANNED", `${displayName} banned`)}
              disabled={busy}
              className="text-destructive focus:text-destructive"
            >
              <Ban className="mr-2 h-4 w-4" />
              Ban user
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
