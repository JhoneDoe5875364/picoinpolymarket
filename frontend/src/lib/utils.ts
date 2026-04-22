import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CAT_CLS: Record<string, string> = {
  crypto: "text-amber-300 border-amber-400",
  technology: "text-cyan-300 border-cyan-400",
  science: "text-lime-300 border-lime-400",
  environment: "text-amber-200 border-amber-300",
  general: "text-amber-300 border-amber-400",
};
export const STATUS_CLS: Record<string, string> = {
  open: "bg-fuchsia-600 text-white",
  pending_resolution: "bg-indigo-700 text-white",
  resolved: "bg-slate-800 text-slate-100",
};
export function catCls(cat?: string) {
  const k = (cat || "general").toLowerCase();
  return CAT_CLS[k] || CAT_CLS.general;
}
export function statusCls(st?: string) {
  const k = (st || "open").toLowerCase();
  return STATUS_CLS[k] || STATUS_CLS.open;
}

export function toPercentLabel(value: number): string {
  const normalized = value <= 1 && value >= -1 ? value * 100 : value;
  return `${normalized.toFixed(1)}%`;
}

export function toSignedMoney(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(2)}π`;
}

export function toUnsignedMoney(value: number): string {
  return `${value.toFixed(2)}π`;
}

export function toPriceLabel(value: number): string {
  return `${value.toFixed(2)}π`;
}

export function formatRelativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const diffMs = Date.now() - date.getTime();
  const sec = Math.max(Math.floor(diffMs / 1000), 0);
  if (sec < 60) return `${sec}s ago`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;

  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}