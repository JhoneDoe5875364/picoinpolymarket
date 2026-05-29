"use client";

import {
  Calendar,
  Check,
  ChevronDown,
  Clock,
  FileText,
  HelpCircle,
  Info,
  Shield,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Market } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface MarketRulesProps {
  market: Market;
}

function normalizeText(value?: string | null): string {
  if (!value) return "";
  return value.trim();
}

function formatDateTimeUtc(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
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

const URL_SPLIT_PATTERN = /(https?:\/\/[^\s]+)/;

function linkifyText(text: string): ReactNode {
  if (!text) return "-";
  const parts = text.split(URL_SPLIT_PATTERN);
  if (parts.length === 1) return text;

  return parts.map((part, index) => {
    if (part.startsWith("http://") || part.startsWith("https://")) {
      return (
        <a
          key={`${part}-${index}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

const RULE_ICON_VARIANT = {
  /** Question, section header */
  violet:
    "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300",
  /** What counts as Yes */
  emerald:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300",
  /** What counts as No */
  red: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
  /** Resolution source / references */
  sky: "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300",
  /** Close / deadline */
  amber:
    "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
  /** Resolution timing */
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300",
  /** Edge cases / exceptions */
  orange:
    "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300",
} as const;

type RuleIconVariant = keyof typeof RULE_ICON_VARIANT;

const WHY_IT_MATTERS_MESSAGE =
  "Clear resolution rules help ensure a fair and transparent market for all participants. Please review the rules carefully before making your prediction.";

const RULES_CALLOUT_VARIANT = {
  sky: {
    border: "border-sky-200/90 dark:border-sky-800/60",
    bg: "bg-sky-50 dark:bg-sky-950/35",
    icon: "text-sky-600 dark:text-sky-400",
    title: "text-sky-900 dark:text-sky-100",
    body: "text-sky-800/95 dark:text-sky-200/90",
  },
  teal: {
    border: "border-teal-200/90 dark:border-teal-800/60",
    bg: "bg-teal-50 dark:bg-teal-950/35",
    icon: "text-teal-600 dark:text-teal-400",
    title: "text-teal-900 dark:text-teal-100",
    body: "text-teal-800/95 dark:text-teal-200/90",
  },
  indigo: {
    border: "border-indigo-200/90 dark:border-indigo-800/60",
    bg: "bg-indigo-50 dark:bg-indigo-950/35",
    icon: "text-indigo-600 dark:text-indigo-400",
    title: "text-indigo-900 dark:text-indigo-100",
    body: "text-indigo-800/95 dark:text-indigo-200/90",
    meta: "text-indigo-700/90 dark:text-indigo-300/90",
  },
} as const;

type RulesCalloutVariant = keyof typeof RULES_CALLOUT_VARIANT;

function RulesCollapsibleCallout({
  className,
  title,
  variant,
  icon,
  bodyId,
  meta,
  children,
}: {
  className?: string;
  title: string;
  variant: RulesCalloutVariant;
  icon: ReactNode;
  bodyId: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(true);
  const colors = RULES_CALLOUT_VARIANT[variant];

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
          <div className="flex items-center justify-between gap-3">
            <p className={cn("text-sm font-semibold", colors.title)}>{title}</p>
            <button
              type="button"
              onClick={() => setVisible((current) => !current)}
              aria-expanded={visible}
              aria-controls={bodyId}
              className={cn(
                "shrink-0 text-xs font-medium underline-offset-2 transition-colors hover:underline",
                colors.icon
              )}
            >
              {visible ? "Hide" : "Show"}
            </button>
          </div>
          {visible ? (
            <>
              {meta ? (
                <p className={cn("text-xs", "meta" in colors ? colors.meta : colors.body)}>{meta}</p>
              ) : null}
              <p
                id={bodyId}
                className={cn("text-sm leading-relaxed whitespace-pre-line", colors.body)}
              >
                {children}
              </p>
            </>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function RulesWhyItMatters({
  className,
  title = "Why this matters",
  children = WHY_IT_MATTERS_MESSAGE,
}: {
  className?: string;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <RulesCollapsibleCallout
      className={className}
      title={title}
      variant="sky"
      icon={<Info className="h-5 w-5" />}
      bodyId="rules-why-it-matters-body"
    >
      {children}
    </RulesCollapsibleCallout>
  );
}

function RulesMarketContext({
  className,
  context,
}: {
  className?: string;
  context: string;
}) {
  return (
    <RulesCollapsibleCallout
      className={className}
      title="Market Context"
      variant="teal"
      icon={<FileText className="h-5 w-5" />}
      bodyId="market-context-body"
    >
      {context}
    </RulesCollapsibleCallout>
  );
}

function RulesAdminClarification({
  className,
  text,
  publishedAt,
  byUsername,
}: {
  className?: string;
  text: string;
  publishedAt?: string | null;
  byUsername?: string | null;
}) {
  const metaParts: string[] = ["Official admin note"];
  if (byUsername) metaParts.push(`by ${byUsername}`);
  if (publishedAt) metaParts.push(formatDateTimeUtc(publishedAt));

  return (
    <RulesCollapsibleCallout
      className={className}
      title="Admin Clarification"
      variant="indigo"
      icon={<Shield className="h-5 w-5" />}
      bodyId="admin-clarification-body"
      meta={metaParts.join(" · ")}
    >
      {text}
    </RulesCollapsibleCallout>
  );
}

interface RuleRowProps {
  icon: ReactNode;
  iconVariant: RuleIconVariant;
  label: string;
  /** Full content shown when expanded (mobile) or inline (desktop). */
  detail: ReactNode;
  /** Optional desktop-only summary; defaults to `detail`. */
  desktopDetail?: ReactNode;
  /** Desktop-only click handler (e.g. edge cases dialog). */
  onDesktopClick?: () => void;
}

function RuleRow({
  icon,
  iconVariant,
  label,
  detail,
  desktopDetail,
  onDesktopClick,
}: RuleRowProps) {
  const [open, setOpen] = useState(false);
  const desktopContent = desktopDetail ?? detail;
  const isDesktopInteractive = Boolean(onDesktopClick);

  const iconBadge = (
    <div
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
        RULE_ICON_VARIANT[iconVariant]
      )}
    >
      {icon}
    </div>
  );

  const labelEl = (
    <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">{label}</span>
  );

  return (
    <>
      {/* Mobile: label + chevron only; tap to expand detail */}
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className="border-t border-border md:hidden"
      >
        <CollapsibleTrigger className="flex w-full items-center gap-3 pl-8 px-4 py-3.5 text-left transition-colors hover:bg-muted/40 [&[data-state=open]]:bg-muted/20">
          {iconBadge}
          {labelEl}
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border/60 px-4 pb-3.5 pt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {detail}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Desktop: inline detail */}
      {isDesktopInteractive ? (
        <button
          type="button"
          onClick={onDesktopClick}
          className="hidden w-full items-center gap-3 border-t border-border px-4 ml-4 py-3.5 text-left transition-colors hover:bg-muted/40 md:flex"
        >
          {iconBadge}
          <span className="w-[12.5rem] shrink-0 text-sm font-semibold text-foreground">{label}</span>
          <span className="min-w-0 flex-1 text-sm text-muted-foreground">{desktopContent}</span>
          <ChevronDown className="h-4 w-4 shrink-0 -rotate-90 text-muted-foreground" />
        </button>
      ) : (
        <div className="hidden items-center gap-3 border-t border-border px-4 pl-8 py-3.5 md:flex">
          {iconBadge}
          <span className="w-[12.5rem] shrink-0 text-sm font-semibold text-foreground">{label}</span>
          <span className="min-w-0 flex-1 text-sm text-muted-foreground">{desktopContent}</span>
        </div>
      )}
    </>
  );
}

function RulesCard({
  title,
  headerIcon,
  defaultOpen = true,
  children,
}: {
  title: string;
  headerIcon: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/30">
          <div className="flex items-center gap-2.5">
            {headerIcon}
            <span className="text-base font-semibold text-foreground">{title}</span>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>{children}</CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function MarketRules({ market }: MarketRulesProps) {
  const [edgeCasesOpen, setEdgeCasesOpen] = useState(false);

  const question = normalizeText(market.question);
  const yesCriteria = normalizeText(market.yes_criteria);
  const noCriteria = normalizeText(market.no_criteria);
  const resolutionSource = normalizeText(market.resolution_source);
  const edgeCases = normalizeText(market.edge_cases);
  const legacyRules = normalizeText(market.rules);
  const marketContext = normalizeText(market.market_context);
  const adminClarification = normalizeText(market.admin_clarification);
  const closeTime = formatDateTimeUtc(market.end_date);
  const resolutionTime = formatDateTimeUtc(market.resolution_time);
  const hasStructuredRules = Boolean(
    question ||
      yesCriteria ||
      noCriteria ||
      resolutionSource ||
      edgeCases ||
      market.end_date ||
      market.resolution_time
  );

  const iconSize = "h-4 w-4";

  return (
    <section className="space-y-4">
      <RulesCard
        title="Resolution Rules"
        headerIcon={
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", RULE_ICON_VARIANT.violet)}>
            <Shield className={iconSize} />
          </div>
        }
      >
        <div className="border-t border-border">
          {!hasStructuredRules ? (
            <div className="px-4 py-4 text-sm text-muted-foreground">
              {legacyRules || "No rules provided."}
            </div>
          ) : (
            <>
              <RuleRow
                icon={<HelpCircle className={iconSize} />}
                iconVariant="violet"
                label="Question"
                detail={question || "-"}
              />
              <RuleRow
                icon={<Check className={iconSize} strokeWidth={3} />}
                iconVariant="emerald"
                label="What Counts as Yes"
                detail={yesCriteria || "-"}
              />
              <RuleRow
                icon={<X className={iconSize} strokeWidth={3} />}
                iconVariant="red"
                label="What Counts as No"
                detail={noCriteria || "-"}
              />
              <RuleRow
                icon={<FileText className={iconSize} />}
                iconVariant="sky"
                label="Resolution Source"
                detail={resolutionSource ? linkifyText(resolutionSource) : "-"}
              />
              <RuleRow
                icon={<Calendar className={iconSize} />}
                iconVariant="amber"
                label="Close Time"
                detail={closeTime}
              />
              <RuleRow
                icon={<Clock className={iconSize} />}
                iconVariant="blue"
                label="Resolution Time"
                detail={resolutionTime}
              />
              <RuleRow
                icon={<Info className={iconSize} />}
                iconVariant="orange"
                label="Edge Cases"
                detail={edgeCases || "-"}
                desktopDetail={edgeCases ? "View edge cases" : "-"}
                onDesktopClick={edgeCases ? () => setEdgeCasesOpen(true) : undefined}
              />
            </>
          )}
        </div>
      </RulesCard>

      {adminClarification ? (
        <RulesAdminClarification
          text={adminClarification}
          publishedAt={market.admin_clarification_at}
          byUsername={market.admin_clarification_by_username}
        />
      ) : null}

      <RulesWhyItMatters />

      {marketContext ? <RulesMarketContext context={marketContext} /> : null}

      <Dialog open={edgeCasesOpen} onOpenChange={setEdgeCasesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edge Cases</DialogTitle>
            <DialogDescription>
              Special scenarios and how this market resolves in each case.
            </DialogDescription>
          </DialogHeader>
          <p className="whitespace-pre-line text-sm text-foreground">{edgeCases}</p>
        </DialogContent>
      </Dialog>
    </section>
  );
}
