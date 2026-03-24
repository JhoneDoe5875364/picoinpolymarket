import { Market, MarketComment, Position, Transaction } from "./types";

const API_BASE = process.env.API_BASE || "http://127.0.0.1:8001";
const AUTH = process.env.MARKETS_AUTH || "Bearer @AtchesSon";
const ADMIN = process.env.MARKETS_ADMIN_KEY || "Auston34";

function toAbs(u: string) { return /^https?:\/\//i.test(u) ? u : `${API_BASE}${u.startsWith("/") ? "" : "/"}${u}`; }

async function doFetch(u: string, init: RequestInit = {}) {
  const abs = toAbs(u);
  const headers = new Headers(init.headers || {});
  if (!headers.has("Authorization")) headers.set("Authorization", AUTH);
  if (!headers.has("X-API-Key")) headers.set("X-API-Key", ADMIN);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  const res = await fetch(abs, { ...init, headers, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`fetch ${res.status} ${res.statusText} for ${abs}: ${text.slice(0, 200)}`);
  }
  return res;
}

export async function getJSON<T = unknown>(u: string, init?: RequestInit) { const r = await doFetch(u, { ...(init || {}), method: "GET" }); return r.json() as Promise<T>; }
export async function postJSON<T = unknown>(u: string, body: any, init?: RequestInit) { const r = await doFetch(u, { ...(init || {}), method: "POST", body: JSON.stringify(body) }); return r.json() as Promise<T>; }
export async function backend(u: string, init?: RequestInit) { return doFetch(u, init); }

/* compat for admin imports */
export async function currentUser() { return await getJSON('/api/summary'); }
export async function allUsers() { return getJSON('/api/admin/users'); }

export { API_BASE, AUTH };

