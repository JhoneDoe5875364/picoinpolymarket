import { NextResponse } from "next/server";
import crypto from "crypto";

function b64url(buf: Uint8Array) {
  return Buffer.from(buf).toString("base64url");
}
function signHS256(secret: string, data: string) {
  return b64url(crypto.createHmac("sha256", secret).update(data).digest());
}
function mintJwt(sub: string) {
  const secret = process.env.JWT_SECRET!;
  const iss = process.env.JWT_ISSUER || "predictpix";
  const aud = process.env.JWT_AUDIENCE || "predictpix-clients";
  if (!secret) throw new Error("Missing JWT_SECRET");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = b64url(
    Buffer.from(JSON.stringify({ sub, iat: now, exp: now + 3600, iss, aud }))
  );
  const sig = signHS256(secret, `${header}.${payload}`);
  return `${header}.${payload}.${sig}`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const market_id = body?.market_id as string | undefined;
    const side_in = body?.side as string | undefined;
    const amount_in = body?.amount;
    const user_id_in = body?.user_id as string | undefined;

    if (!market_id || !side_in || amount_in == null) {
      return NextResponse.json({ ok: false, error: "missing fields" }, { status: 400 });
    }
    const side = String(side_in).toLowerCase();
    const amount = Number(amount_in);

    // Prefer client-provided UUID; else fall back to env TEST_USER_ID (for early testers)
    const fallback = process.env.TEST_USER_ID || "";
    const sub = (user_id_in || fallback).trim();
    if (!UUID_RE.test(sub)) {
      return NextResponse.json(
        { ok: false, error: "user_id must be a UUID (or set TEST_USER_ID)" },
        { status: 400 }
      );
    }

    const token = mintJwt(sub);
    const apiBase = process.env.API_BASE || "http://127.0.0.1:8001";

    const upstream = await fetch(`${apiBase}/api/positions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ market_id, side, amount }),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return NextResponse.json({ ok: false, status: upstream.status, data }, { status: upstream.status });
    }
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
