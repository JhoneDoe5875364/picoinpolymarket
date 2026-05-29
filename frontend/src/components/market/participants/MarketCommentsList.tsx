"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Heart, Image as ImageIcon, MessageCircle, MoreHorizontal, Smile } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, apiFetchWithToken } from "@/lib/api";
import type { Market } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InitialAvatar, ListSkeleton } from "./shared";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const LIKE_HEART = "text-[#E85A4F]";

export interface MarketComment {
  id: number;
  player_id: number;
  pi_username?: string | null;
  body: string;
  created_at: string;
  reply_count: number;
  like_count?: number;
  viewer_has_liked?: boolean;
}

function formatCount(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatRelativeTimeEn(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const now = Date.now();
  const sec = Math.max(0, Math.floor((now - then) / 1000));
  if (sec < 45) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 14) return `${day}d ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(then);
}

interface MarketCommentsListProps {
  market: Market;
  isOpen: boolean;
  onCommentCountChange?: (total: number) => void;
}

export function MarketCommentsList({ market, isOpen, onCommentCountChange }: MarketCommentsListProps) {
  const { ppxToken } = useAuth();
  const onCountRef = useRef(onCommentCountChange);
  onCountRef.current = onCommentCountChange;
  const [rawItems, setRawItems] = useState<MarketComment[]>([]);
  const [remoteTotal, setRemoteTotal] = useState(0);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<"newest" | "most_liked">("newest");
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [expandedThreads, setExpandedThreads] = useState<Record<number, boolean>>({});
  const [replyOpen, setReplyOpen] = useState<Record<number, boolean>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [replyPosting, setReplyPosting] = useState<Record<number, boolean>>({});
  const [replyRowsByRoot, setReplyRowsByRoot] = useState<Record<number, MarketComment[] | undefined>>({});
  const [replyFetchLoading, setReplyFetchLoading] = useState<Record<number, boolean>>({});
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<() => void>(() => {});
  const listGenRef = useRef(0);

  const authHeaders = useMemo((): Record<string, string> => {
    const h: Record<string, string> = {};
    if (ppxToken) h.Authorization = `Bearer ${ppxToken}`;
    return h;
  }, [ppxToken]);

  const refreshSummary = useCallback(async () => {
    const res = await apiFetch<{ ok?: boolean; data?: { total_comment_count?: number } }>(
      `/comments/markets/${market.id}/summary`
    );
    const total = Number(res?.data?.total_comment_count ?? 0);
    const n = Number.isFinite(total) ? total : 0;
    onCountRef.current?.(n);
  }, [market.id]);

  const normalizeItems = useCallback((rows: MarketComment[]) => {
    return rows.map((row) => ({
      ...row,
      like_count: Number(row.like_count ?? 0),
      viewer_has_liked: Boolean(row.viewer_has_liked),
    }));
  }, []);

  const reloadCommentsFromStart = useCallback(async () => {
    listGenRef.current += 1;
    const gen = listGenRef.current;
    setInitialLoading(true);
    setError(null);
    setHasMore(true);
    setRawItems([]);
    try {
      const qs = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: "0",
        sort: sortKey,
      });
      const res = await apiFetch<{ ok?: boolean; items?: MarketComment[]; total?: number }>(
        `/comments/markets/${market.id}?${qs.toString()}`,
        { headers: { accept: "application/json", ...authHeaders } }
      );
      if (listGenRef.current !== gen) return;
      const items = normalizeItems(res?.items ?? []);
      const total = Number(res?.total ?? 0);
      setRemoteTotal(Number.isFinite(total) ? total : 0);
      setRawItems(items);
      const loaded = items.length;
      const t = Number.isFinite(total) ? total : 0;
      if (loaded === 0) setHasMore(false);
      else setHasMore(t > 0 ? loaded < t : loaded === PAGE_SIZE);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load comments");
      setRawItems([]);
      setHasMore(false);
    } finally {
      if (listGenRef.current === gen) {
        setInitialLoading(false);
      }
    }
  }, [market.id, sortKey, authHeaders, normalizeItems]);

  const loadMoreComments = useCallback(async () => {
    if (!isOpen || !hasMore || loadingMore || initialLoading) return;
    const gen = listGenRef.current;
    const offset = rawItems.length;
    setLoadingMore(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
        sort: sortKey,
      });
      const res = await apiFetch<{ ok?: boolean; items?: MarketComment[]; total?: number }>(
        `/comments/markets/${market.id}?${qs.toString()}`,
        { headers: { accept: "application/json", ...authHeaders } }
      );
      if (listGenRef.current !== gen) return;
      const batch = normalizeItems(res?.items ?? []);
      if (batch.length === 0) {
        if (listGenRef.current === gen) setHasMore(false);
        return;
      }
      if (listGenRef.current !== gen) return;
      let t = remoteTotal;
      if (res?.total != null) {
        const n = Number(res.total);
        if (Number.isFinite(n) && n >= 0) {
          t = n;
          setRemoteTotal(n);
        }
      }
      if (listGenRef.current !== gen) return;
      setRawItems((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        const merged = [...prev];
        for (const c of batch) {
          if (!seen.has(c.id)) merged.push(c);
        }
        return merged;
      });
      const loadedAfter = offset + batch.length;
      if (listGenRef.current === gen) {
        setHasMore(t > 0 ? loadedAfter < t : batch.length === PAGE_SIZE);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more comments");
    } finally {
      setLoadingMore(false);
    }
  }, [
    isOpen,
    hasMore,
    loadingMore,
    initialLoading,
    rawItems.length,
    market.id,
    sortKey,
    authHeaders,
    normalizeItems,
    remoteTotal,
  ]);

  loadMoreRef.current = loadMoreComments;

  useEffect(() => {
    if (!isOpen) return;
    void refreshSummary();
  }, [isOpen, refreshSummary]);

  useEffect(() => {
    if (!isOpen) return;
    void reloadCommentsFromStart();
  }, [isOpen, reloadCommentsFromStart]);

  useEffect(() => {
    if (!isOpen) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        void loadMoreRef.current();
      },
      { root: null, rootMargin: "120px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isOpen, rawItems.length, sortKey, hasMore]);

  const toggleThread = useCallback(async (rootId: number) => {
    const willOpen = !expandedThreads[rootId];
    setExpandedThreads((prev) => ({ ...prev, [rootId]: willOpen }));
    if (!willOpen) return;
    if (replyRowsByRoot[rootId] !== undefined) return;
    setReplyFetchLoading((m) => ({ ...m, [rootId]: true }));
    try {
      const res = await apiFetch<{ ok?: boolean; items?: MarketComment[] }>(
        `/comments/${rootId}/replies?limit=100&offset=0`
      );
      setReplyRowsByRoot((m) => ({ ...m, [rootId]: res?.items ?? [] }));
    } catch {
      setReplyRowsByRoot((m) => ({ ...m, [rootId]: [] }));
    } finally {
      setReplyFetchLoading((m) => ({ ...m, [rootId]: false }));
    }
  }, [expandedThreads, replyRowsByRoot]);

  const setLikeLocal = useCallback((commentId: number, liked: boolean, likeCount: number) => {
    setRawItems((rows) =>
      rows.map((c) =>
        c.id === commentId ? { ...c, viewer_has_liked: liked, like_count: likeCount } : c
      )
    );
  }, []);

  const onToggleLike = useCallback(
    async (comment: MarketComment) => {
      if (!ppxToken) {
        setError("Log in to like comments.");
        return;
      }
      const prevLiked = Boolean(comment.viewer_has_liked);
      const prevCount = Number(comment.like_count ?? 0);
      setLikeLocal(comment.id, !prevLiked, prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
      try {
        const res = await apiFetchWithToken<{ ok?: boolean; data?: { liked?: boolean; like_count?: number } }>(
          `/comments/${comment.id}/like`,
          { method: "POST", body: "{}" }
        );
        const liked = Boolean(res?.data?.liked);
        const likeCount = Number(res?.data?.like_count ?? 0);
        setLikeLocal(comment.id, liked, likeCount);
      } catch {
        setLikeLocal(comment.id, prevLiked, prevCount);
        setError("Could not update like.");
      }
    },
    [ppxToken, setLikeLocal]
  );

  const submitRootComment = useCallback(async () => {
    const body = draft.trim();
    if (!body || !ppxToken) return;
    setPosting(true);
    setError(null);
    try {
      await apiFetchWithToken(`/comments/markets/${market.id}`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setDraft("");
      await refreshSummary();
      await reloadCommentsFromStart();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post comment");
    } finally {
      setPosting(false);
    }
  }, [draft, market.id, ppxToken, reloadCommentsFromStart, refreshSummary]);

  const submitReply = useCallback(
    async (rootId: number) => {
      const body = (replyDrafts[rootId] ?? "").trim();
      if (!body || !ppxToken) return;
      setReplyPosting((m) => ({ ...m, [rootId]: true }));
      setError(null);
      try {
        await apiFetchWithToken(`/comments/${rootId}/replies`, {
          method: "POST",
          body: JSON.stringify({ body }),
        });
        setReplyDrafts((m) => ({ ...m, [rootId]: "" }));
        await refreshSummary();
        await reloadCommentsFromStart();
        setReplyRowsByRoot((m) => ({ ...m, [rootId]: undefined }));
        setReplyFetchLoading((m) => ({ ...m, [rootId]: true }));
        try {
          const res = await apiFetch<{ ok?: boolean; items?: MarketComment[] }>(
            `/comments/${rootId}/replies?limit=100&offset=0`
          );
          setReplyRowsByRoot((m) => ({ ...m, [rootId]: res?.items ?? [] }));
        } finally {
          setReplyFetchLoading((m) => ({ ...m, [rootId]: false }));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to post reply");
      } finally {
        setReplyPosting((m) => ({ ...m, [rootId]: false }));
      }
    },
    [ppxToken, reloadCommentsFromStart, refreshSummary, replyDrafts]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Select
          value={sortKey}
          onValueChange={(value) => setSortKey(value as "newest" | "most_liked")}
        >
          <SelectTrigger className="h-9 w-[120px] rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="most_liked">Most liked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-0 px-0 h-9"
          disabled={posting}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submitRootComment();
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          className="shrink-0 rounded-md bg-sky-500 text-white hover:bg-sky-600"
          disabled={!draft.trim() || posting || !ppxToken}
          onClick={() => void submitRootComment()}
        >
          Post
        </Button>
      </div>
      {!ppxToken ? <p className="text-xs text-muted-foreground">Log in to post comments.</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {initialLoading && rawItems.length === 0 ? (
        <ListSkeleton />
      ) : rawItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <>
          <ul className="space-y-2">
            {rawItems.map((comment) => {
            const name = comment.pi_username?.trim() || `User ${comment.player_id}`;
            const open = Boolean(expandedThreads[comment.id]);
            const replies = replyRowsByRoot[comment.id] ?? [];
            const composerOpen = Boolean(replyOpen[comment.id]);
            return (
              <li key={comment.id} className="flex gap-3">
                <InitialAvatar name={name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="truncate text-sm font-semibold text-foreground">{name}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTimeEn(comment.created_at)}
                      </span>
                    </div>
                    <button type="button" className="shrink-0 text-muted-foreground hover:text-foreground p-1" aria-label="More">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap break-words">{comment.body}</p>

                  <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 hover:text-foreground"
                      onClick={() => void onToggleLike(comment)}
                    >
                      <Heart
                        className={cn(
                          "h-4 w-4",
                          comment.viewer_has_liked
                            ? `${LIKE_HEART} fill-current`
                            : "stroke-[1.5] fill-none stroke-current"
                        )}
                      />
                      <span>{formatCount(Number(comment.like_count ?? 0))}</span>
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 hover:text-foreground"
                      onClick={() => {
                        setReplyOpen((m) => ({ ...m, [comment.id]: !m[comment.id] }));
                        setReplyDrafts((d) => ({
                          ...d,
                          [comment.id]: d[comment.id] ?? "",
                        }));
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Reply
                    </button>
                  </div>

                  {comment.reply_count > 0 ? (
                    <button
                      type="button"
                      className="mt-1 flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground"
                      onClick={() => void toggleThread(comment.id)}
                    >
                      {formatCount(comment.reply_count)} {comment.reply_count === 1 ? "Reply" : "Replies"}
                      <ChevronDown className={cn("h-4 w-4 transition-transform", open ? "rotate-180" : "")} />
                    </button>
                  ) : null}

                  {open ? (
                    <div className="mt-3 space-y-3 border-l border-border pl-3">
                      {replyFetchLoading[comment.id] ? (
                        <p className="text-xs text-muted-foreground">Loading replies…</p>
                      ) : (
                        <ul className="space-y-1">
                          {replies.map((r) => {
                            const rname = r.pi_username?.trim() || `User ${r.player_id}`;
                            return (
                              <li key={`${r.id}-${r.created_at}`} className="flex gap-2">
                                <InitialAvatar name={rname} size="sm" />
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                    <span className="text-xs font-semibold text-foreground">{rname}</span>
                                    <span className="text-[11px] text-muted-foreground">
                                      {formatRelativeTimeEn(r.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words">{r.body}</p>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ) : null}

                  {composerOpen ? (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        value={replyDrafts[comment.id] ?? ""}
                        onChange={(e) =>
                          setReplyDrafts((m) => ({
                            ...m,
                            [comment.id]: e.target.value,
                          }))
                        }
                        placeholder="Write a reply…"
                        className="sm:flex-1"
                        disabled={Boolean(replyPosting[comment.id]) || !ppxToken}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void submitReply(comment.id);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="shrink-0 bg-sky-500 text-white hover:bg-sky-600"
                        disabled={!ppxToken || !(replyDrafts[comment.id] ?? "").trim() || replyPosting[comment.id]}
                        onClick={() => void submitReply(comment.id)}
                      >
                        Post reply
                      </Button>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
          </ul>
          {loadingMore ? (
            <p className="mt-4 text-center text-sm text-muted-foreground">Loading more…</p>
          ) : null}
          {hasMore ? <div ref={sentinelRef} className="h-8 w-full shrink-0" aria-hidden /> : null}
        </>
      )}
    </div>
  );
}
