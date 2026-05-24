"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, Megaphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiFetchWithToken } from "@/lib/api";

export type AdminClarificationState = {
  text: string | null;
  at: string | null;
  byUsername: string | null;
};

type MarketAdminClarificationProps = {
  marketId: string;
  initial: AdminClarificationState;
  disabled?: boolean;
  onUpdated?: (next: AdminClarificationState) => void;
};

function toClarificationState(data: {
  admin_clarification?: string | null;
  admin_clarification_at?: string | null;
  admin_clarification_by_username?: string | null;
}): AdminClarificationState {
  return {
    text: data.admin_clarification?.trim() || null,
    at: data.admin_clarification_at ?? null,
    byUsername: data.admin_clarification_by_username?.trim() || null,
  };
}

export function MarketAdminClarification({
  marketId,
  initial,
  disabled = false,
  onUpdated,
}: MarketAdminClarificationProps) {
  const { toast } = useToast();
  const [text, setText] = useState(initial.text ?? "");
  const [meta, setMeta] = useState({
    at: initial.at,
    byUsername: initial.byUsername,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    setText(initial.text ?? "");
    setMeta({ at: initial.at, byUsername: initial.byUsername });
  }, [initial.at, initial.byUsername, initial.text]);

  const isBusy = isSaving || isClearing || disabled;
  const trimmedText = text.trim();
  const hasPublishedNote = Boolean(initial.text);
  const hasChanges = trimmedText !== (initial.text ?? "");
  const canSubmit = trimmedText.length >= 10 && (!hasPublishedNote || hasChanges);

  async function saveClarification(clear: boolean) {
    if (clear) {
      setIsClearing(true);
    } else {
      if (trimmedText.length < 10) {
        toast({
          title: "Clarification too short",
          description: "Admin note must be at least 10 characters.",
          variant: "destructive",
        });
        return;
      }
      setIsSaving(true);
    }

    try {
      const res = await apiFetchWithToken(`/admin/markets/${marketId}/clarification`, {
        method: "PUT",
        body: JSON.stringify({
          admin_clarification: clear ? null : trimmedText,
        }),
      });

      if (!res.ok) {
        throw new Error(res?.error || "Failed to update admin clarification");
      }

      const next = toClarificationState(res.data ?? {});
      setText(next.text ?? "");
      setMeta({ at: next.at, byUsername: next.byUsername });
      onUpdated?.(next);

      toast({
        title: clear ? "Admin note removed" : "Admin note published",
        description: clear
          ? "The market clarification is no longer visible to users."
          : "Users will see this official clarification on the market page.",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast({
        title: clear ? "Failed to remove admin note" : "Failed to publish admin note",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setIsClearing(false);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
          <Megaphone className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Admin Note / Market Clarification</h3>
          <p className="text-xs text-muted-foreground">
            Official clarification shown separately from user comments. Use neutral language and avoid
            pushing participants toward YES or NO.
          </p>
          {meta.at ? (
            <p className="text-xs text-muted-foreground">
              Last published
              {meta.byUsername ? ` by ${meta.byUsername}` : ""}
              {meta.at ? ` · ${format(new Date(meta.at), "yyyy-MM-dd HH:mm")}` : ""}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">No admin note published for this market yet.</p>
          )}
        </div>
      </div>

      <Textarea
        className="min-h-[120px] text-xs focus-visible:outline-none focus-visible:ring-0"
        placeholder="e.g., Resolution timing may shift if the primary data source publishes late. This note does not change YES/NO criteria."
        value={text}
        onChange={(event) => setText(event.target.value)}
        disabled={isBusy}
      />

      <div className="flex flex-wrap justify-end gap-2">
        {hasPublishedNote ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => void saveClarification(true)}
          >
            {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Remove Note
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          disabled={isBusy || !canSubmit}
          onClick={() => void saveClarification(false)}
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {hasPublishedNote ? "Update Note" : "Publish Note"}
        </Button>
      </div>
    </section>
  );
}
