// src/app/logout/route.ts
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

export async function POST() {
  const supabase = await getServerSupabase(); // <-- await
  await supabase.auth.signOut();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:9002";
  return NextResponse.redirect(new URL("/", siteUrl));
}
