"use client";

import type { ReactNode } from "react";
import { CheckCircle2, Pin, Shield } from "lucide-react";
import type { Market } from "@/lib/types";
import { cn } from "@/lib/utils";

function normalizeText(value?: string | null): string {
  if (!value) return "";
  return value.trim();
}

function formatDateTimeUtc(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const formatted = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(date);
  return `${formatted} UTC`;
}

function formatOutcome(outcome?: string | null): string {
  if (!outcome) return "Unknown";
  const normalized = outcome.trim().toUpperCase();
  if (normalized === "YES") return "Yes";
  if (normalized === "NO") return "No";
  if (normalized === "CANCELLED") return "Void / Cancelled";
  return outcome;
}

function PinnedNoteCard({
  className,
  title,
  icon,
  variant,
  meta,
  children,
}: {
  className?: string;
  title: string;
  icon: ReactNode;
  variant: "amber" | "emerald";
  meta?: string;
  children: ReactNode;
}) {
  const colors =
    variant === "amber"
      ? {
          border: "border-amber-200/90 dark:border-amber-800/60",
          bg: "bg-amber-50 dark:bg-amber-950/35",
          icon: "text-amber-600 dark:text-amber-400",
          title: "text-amber-900 dark:text-amber-100",
          body: "text-amber-900/90 dark:text-amber-100/90",
          meta: "text-amber-700/90 dark:text-amber-300/90",
        }
      : {
          border: "border-emerald-200/90 dark:border-emerald-800/60",
          bg: "bg-emerald-50 dark:bg-emerald-950/35",
          icon: "text-emerald-600 dark:text-emerald-400",
          title: "text-emerald-900 dark:text-emerald-100",
          body: "text-emerald-900/90 dark:text-emerald-100/90",
          meta: "text-emerald-700/90 dark:text-emerald-300/90",
        };

  return (
    <aside
      role="note"
      aria-label={title}
      className={cn("rounded-lg border p-4", colors.border, colors.bg, className)}
    >
      <div className="flex gap-3">
        <div className={cn("mt-0.5 shrink-0", colors.icon)} aria-hidden>
          {icon}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Pin className={cn("h-3.5 w-3.5 shrink-0", colors.icon)} aria-hidden />
            <p className={cn("text-sm font-semibold", colors.title)}>{title}</p>
          </div>
          {meta ? <p className={cn("text-xs", colors.meta)}>{meta}</p> : null}
          <div className={cn("text-sm leading-relaxed whitespace-pre-line", colors.body)}>{children}</div>
        </div>
      </div>
    </aside>
  );
}

interface DiscussionPinnedNotesProps {
  market: Market;
}

export function DiscussionPinnedNotes({ market }: DiscussionPinnedNotesProps) {
  const adminClarification = normalizeText(market.admin_clarification);
  const isResolved = Boolean(market.is_resolved && market.resolved_outcome);

  if (!adminClarification && !isResolved) return null;

  const clarificationMetaParts: string[] = [];
  if (market.admin_clarification_by_username) {
    clarificationMetaParts.push(`by ${market.admin_clarification_by_username}`);
  }
  if (market.admin_clarification_at) {
    clarificationMetaParts.push(formatDateTimeUtc(market.admin_clarification_at));
  }

  const resolutionMetaParts: string[] = [];
  if (market.resolved_by_username) {
    resolutionMetaParts.push(`Confirmed by ${market.resolved_by_username}`);
  }
  if (market.resolved_at) {
    resolutionMetaParts.push(formatDateTimeUtc(market.resolved_at));
  }

  const resolutionSource = normalizeText(market.resolution_source);

  return (
    <div className="space-y-3 pb-4 border-b border-border mb-4">
      {adminClarification ? (
        <PinnedNoteCard
          title="Official Clarification"
          variant="amber"
          icon={<Shield className="h-5 w-5" />}
          meta={clarificationMetaParts.length ? clarificationMetaParts.join(" · ") : "Admin note"}
        >
          {adminClarification}
        </PinnedNoteCard>
      ) : null}

      {isResolved ? (
        <PinnedNoteCard
          title="Official Resolution Note"
          variant="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
          meta={resolutionMetaParts.length ? resolutionMetaParts.join(" · ") : undefined}
        >
          <p>
            <span className="font-medium">Outcome:</span> {formatOutcome(market.resolved_outcome)}
          </p>
          {resolutionSource ? (
            <p className="mt-2">
              <span className="font-medium">Resolution source:</span> {resolutionSource}
            </p>
          ) : null}
        </PinnedNoteCard>
      ) : null}
    </div>
  );
}
