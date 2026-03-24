import { apiFetch } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const r = await apiFetch(`/markets/stats-list`, {
      method: "GET",
    });
    if (!r.ok) return Response.json({ items: [] });
    const data = await r.json();
    const items = Array.isArray(data) ? data : (data.items ?? []);
    return Response.json({ items });
  } catch {
    return Response.json({ items: [] });
  }
}
