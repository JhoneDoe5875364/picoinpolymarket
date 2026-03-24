import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";
  const supabase = await getServerSupabase();
  if (code) await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(next, req.url));
}
