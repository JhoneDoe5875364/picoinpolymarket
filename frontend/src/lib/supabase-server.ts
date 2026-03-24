// src/lib/supabase-server.ts
import { cookies as nextCookies } from "next/headers";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn("[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

async function getCookieStore() {
  const maybePromise = nextCookies() as any;
  if (typeof maybePromise?.then === "function") {
    return (await maybePromise) as Awaited<ReturnType<typeof nextCookies>>;
  }
  return maybePromise as ReturnType<typeof nextCookies>;
}

export async function getServerSupabase() {
  const cookieStore = await getCookieStore();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Parameters<typeof cookieStore.set>[2]) {
        try { cookieStore.set(name, value, options); } catch {}
      },
      remove(name: string, options: Parameters<typeof cookieStore.set>[2]) {
        try { cookieStore.set(name, "", { ...options, maxAge: 0 }); } catch {}
      },
    },
  });
}

/**
 * Header/Bearer-token client.
 * Adds required `apikey` header for PostgREST and only forwards Authorization if token looks like a real JWT.
 */
export function supabaseFromRequest(req: NextRequest) {
  const authz = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const token = authz.toLowerCase().startsWith("bearer ") ? authz.slice(7).trim() : "";
  const looksJwt = token.split(".").length === 3;

  const headers: Record<string, string> = { apikey: SUPABASE_ANON_KEY };
  if (looksJwt) headers.Authorization = `Bearer ${token}`;

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
