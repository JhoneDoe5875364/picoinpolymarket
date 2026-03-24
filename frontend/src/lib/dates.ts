export function fmtShortDate(input?: string | Date | null): string {
  if (!input) return "—";

  const d = typeof input === "string" ? new Date(input) : input;

  if (Number.isNaN(d.getTime())) return "—";

  // Force a specific locale to ensure consistent date formatting between SSR and client
  return d.toLocaleDateString('en-US', {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
