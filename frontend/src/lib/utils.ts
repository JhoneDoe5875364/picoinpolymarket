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