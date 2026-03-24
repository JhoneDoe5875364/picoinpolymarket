// src/components/market-comments.tsx
"use client";

import * as React from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarketComment } from "@/lib/types";

type CommentRow = {
  id: string;
  user_id: string | null;
  username?: string | null;
  body: string;
  created_at: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function MarketComments({
  marketId,
  comments = [],
  currentUser = null,
}: {
  marketId: string;
  comments?: Array<MarketComment>;
  currentUser?: any;
}) {
  // SWR with initial/fallback data from the server
  const { data, mutate, isLoading } = useSWR<{ ok: boolean; data: CommentRow[] }>(
    `/api/markets/${marketId}/comments`,
    fetcher,
    {
      revalidateOnFocus: false,
      fallbackData: { ok: true, data: comments as CommentRow[] },
    }
  );

  const list: CommentRow[] = React.useMemo(
    () => (data?.data ?? []).slice().sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [data]
  );

  // compose a name for display
  const displayName = (c: CommentRow) =>
    (c.username ?? "").trim() ||
    (c.user_id ? c.user_id.slice(0, 8) + "…" : "Anon");

  // form state
  const [body, setBody] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const text = body.trim();
    if (!text) return;
    if (!currentUser) {
      setError("Please sign in to post a comment.");
      return;
    }

    // Optimistic add
    const optimistic: CommentRow = {
      id: `tmp-${Date.now()}`,
      user_id: currentUser.id ?? null,
      username:
        currentUser.user_metadata?.username ||
        currentUser.email ||
        currentUser.phone ||
        null,
      body: text,
      created_at: new Date().toISOString(),
    };

    setPosting(true);
    setBody("");

    try {
      await mutate(
        async (prev) => {
          // call API
          const res = await fetch(`/api/markets/${marketId}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body: text }),
          });
          const json = await res.json();

          if (!res.ok || !json?.ok) {
            throw new Error(json?.error || "Failed to post comment");
          }

          const posted: CommentRow = json.data;
          // replace optimistic with real
          const prevData = prev?.data ?? [];
          const withoutTmp = prevData.filter((c) => c.id !== optimistic.id);
          return { ok: true, data: [...withoutTmp, posted] };
        },
        {
          optimisticData: (prev) => {
            const prevData = prev?.data ?? [];
            return { ok: true, data: [...prevData, optimistic] };
          },
          rollbackOnError: true,
          revalidate: false,
        }
      );
    } catch (err: any) {
      setError(err?.message ?? "Failed to post comment");
      setBody(text); // restore text on failure
    } finally {
      setPosting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discussion</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Composer */}
        <form onSubmit={onSubmit} className="space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              currentUser ? "Share your thoughts…" : "Sign in to join the discussion…"
            }
            className="w-full min-h-[96px] rounded-xl bg-black/40 border border-white/15 px-3 py-2 outline-none"
            disabled={!currentUser || posting}
          />
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              className="btn-yes glowing-focus px-4"
              disabled={!currentUser || posting || body.trim().length === 0}
            >
              {posting ? "Posting…" : "Post comment"}
            </Button>
            {!currentUser && (
              <a
                href="/login"
                className="text-sm text-muted-foreground hover:underline"
              >
                Sign in
              </a>
            )}
            {error && (
              <span className="text-sm text-red-400">{typeof error === "string" ? error : (error ?? JSON.stringify(error))}</span>
            )}
          </div>
        </form>

        {/* List */}
        <div className="divide-y divide-white/10 rounded-xl border border-white/10">
          {list.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              Be the first to comment.
            </div>
          ) : (
            list.map((c) => (
              <div key={c.id} className="p-4 flex gap-3">
                <Badge variant="outline" className="shrink-0">
                  {displayName(c)}
                </Badge>
                <div className="flex-1">
                  <div className="text-sm whitespace-pre-wrap">{c.body}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Loading hint (optional) */}
        {isLoading && (
          <div className="text-xs text-muted-foreground">Loading comments…</div>
        )}
      </CardContent>
    </Card>
  );
}
