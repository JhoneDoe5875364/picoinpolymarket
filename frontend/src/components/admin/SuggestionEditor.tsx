"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiFetchWithToken } from "@/lib/api";
import type { Suggestion } from "@/lib/types";
import { MarketImagePickerField } from "@/components/admin/MarketImagePickerField";

type CategoryOption = { id: number; slug: string; name: string };
type MarketImage = { name: string; url: string };
type SuggestionEditorLoadResult = {
  suggestion: Suggestion;
  categories: CategoryOption[];
  images: MarketImage[];
};
type SuggestionApprovalForm = {
  question: string;
  description: string;
  slug: string;
  rules: string;
  category: string;
  liquidity: string;
  startDate: string;
  endDate: string;
  image: string;
};

const loadCache = new Map<string, SuggestionEditorLoadResult>();
const loadInFlight = new Map<string, Promise<SuggestionEditorLoadResult>>();

function slugify(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "market";
}

function toDateTimeLocalInput(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function createDefaultApprovalForm(suggestion: Suggestion): SuggestionApprovalForm {
  return {
    question: suggestion.question ?? "",
    description: suggestion.description ?? "",
    slug: slugify(suggestion.question ?? ""),
    rules: "",
    category: suggestion.category ?? "",
    liquidity: "0",
    startDate: toDateTimeLocalInput(suggestion.start_date),
    endDate: toDateTimeLocalInput(suggestion.end_date),
    image: "",
  };
}

async function fetchSuggestionEditorData(suggestionId: string): Promise<SuggestionEditorLoadResult> {
  const cached = loadCache.get(suggestionId);
  if (cached) return cached;

  const pending = loadInFlight.get(suggestionId);
  if (pending) return pending;

  const request = (async () => {
    const [suggestionRes, categoryRes, imageRes] = await Promise.all([
      apiFetchWithToken(`/suggestions/${suggestionId}`, { method: "GET" }),
      apiFetchWithToken("/suggestions/categories", { method: "GET" }),
      apiFetchWithToken("/markets/images", { method: "GET" }),
    ]);

    const suggestion = (suggestionRes?.data ?? null) as Suggestion | null;
    if (!suggestion?.id) {
      throw new Error("Suggestion not found");
    }

    const payload: SuggestionEditorLoadResult = {
      suggestion,
      categories: Array.isArray(categoryRes?.data) ? categoryRes.data : [],
      images: Array.isArray(imageRes?.data) ? imageRes.data : [],
    };
    loadCache.set(suggestionId, payload);
    return payload;
  })();

  loadInFlight.set(suggestionId, request);
  try {
    return await request;
  } finally {
    loadInFlight.delete(suggestionId);
  }
}

type SuggestionEditorProps = {
  suggestionId: string;
};

export function SuggestionEditor({ suggestionId }: SuggestionEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [images, setImages] = useState<MarketImage[]>([]);
  const [form, setForm] = useState<SuggestionApprovalForm>({
    question: "",
    description: "",
    slug: "",
    rules: "",
    category: "",
    liquidity: "0",
    startDate: "",
    endDate: "",
    image: "",
  });
  const startDateInputRef = useRef<HTMLInputElement | null>(null);
  const endDateInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const payload = await fetchSuggestionEditorData(suggestionId);
        if (cancelled) return;
        setCategories(payload.categories);
        setImages(payload.images);
        const next = createDefaultApprovalForm(payload.suggestion);
        if (!next.category && payload.categories.length > 0) {
          next.category = payload.categories[0].slug;
        }
        setForm(next);
      } catch (e: any) {
        if (cancelled) return;
        toast({
          title: "Failed to load suggestion",
          description: e?.message ?? "Unable to load suggestion editor data.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [suggestionId, toast]);

  async function uploadImage(file: File) {
    setIsUploadingImage(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      const res = await apiFetchWithToken("/admin/markets/images", {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          content_base64: dataUrl,
        }),
      });

      if (!res?.ok || !res?.data?.url) {
        throw new Error(res?.error || "Image upload failed");
      }

      const uploaded = { name: res.data.name, url: res.data.url };
      setImages((prev) => [uploaded, ...prev.filter((item) => item.url !== uploaded.url)]);
      setForm((prev) => ({ ...prev, image: uploaded.url }));
      toast({ title: "Image uploaded", description: uploaded.name });
    } catch (e: any) {
      toast({
        title: "Image upload failed",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function approveSuggestion() {
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast({
        title: "Invalid date",
        description: "Start/end date is invalid.",
        variant: "destructive",
      });
      return;
    }
    if (end <= start) {
      toast({
        title: "Invalid date range",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetchWithToken(`/suggestions/${suggestionId}/approve`, {
        method: "POST",
        body: JSON.stringify({
          question: form.question.trim(),
          description: form.description.trim(),
          slug: form.slug.trim(),
          rules: form.rules.trim(),
          category: form.category.trim(),
          liquidity: form.liquidity.trim(),
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          image: form.image.trim() || null,
        }),
      });
      if (!res?.ok) {
        throw new Error(res?.error || "Failed to approve suggestion");
      }

      toast({
        title: "Suggestion approved",
        description: `Market created: ${res?.market?.question ?? form.question}`,
      });
      router.push("/admin/suggestions");
      router.refresh();
    } catch (e: any) {
      toast({
        title: "Approval failed",
        description: e?.message ?? "Unexpected error.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <Button variant="ghost" onClick={() => router.push("/admin/suggestions")} className="mb-2 p-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Manage Suggestions
        </Button>
      </div>
      <h2 className="text-xl font-semibold leading-none tracking-tight">Edit Suggestion</h2>
      <p className="text-xs text-muted-foreground">
        Finalize question, rules, dates, liquidity, and image before creating the market.
      </p>

      {isLoading ? <p className="text-xs text-muted-foreground">Loading suggestion editor...</p> : null}

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center gap-3 md:block md:space-y-0">
            <Label htmlFor="suggestion-question" className="w-24 shrink-0 md:w-auto text-xs text-muted-foreground">Question</Label>
            <Input
              id="suggestion-question"
              className="text-xs focus-visible:outline-none focus-visible:ring-0 w-full"
              value={form.question}
              onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
              disabled={isLoading || isSubmitting}
            />
          </div>
          <div className="flex items-center gap-3 md:block md:space-y-0">
            <Label htmlFor="suggestion-slug" className="w-24 shrink-0 md:w-auto text-xs text-muted-foreground">Slug</Label>
            <Input
              id="suggestion-slug"
              className="text-xs focus-visible:outline-none focus-visible:ring-0 w-full"
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              disabled={isLoading || isSubmitting}
            />
          </div>
          <div className="flex items-center gap-3 md:block md:space-y-0">
            <Label htmlFor="suggestion-description" className="w-24 shrink-0 md:w-auto text-xs text-muted-foreground">Description</Label>
            <Textarea
              id="suggestion-description"
              className="text-xs focus-visible:outline-none focus-visible:ring-0 w-full"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              disabled={isLoading || isSubmitting}
            />
          </div>
          <div className="flex items-center gap-3 md:block md:space-y-0">
            <Label htmlFor="suggestion-rules" className="w-24 shrink-0 md:w-auto text-xs text-muted-foreground">Rules</Label>
            <Textarea
              id="suggestion-rules"
              className="text-xs focus-visible:outline-none focus-visible:ring-0 w-full"
              value={form.rules}
              onChange={(e) => setForm((prev) => ({ ...prev, rules: e.target.value }))}
              disabled={isLoading || isSubmitting}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 md:block md:space-y-0">
            <Label className="w-24 shrink-0 md:w-auto text-xs text-muted-foreground">Category</Label>
            <Select
              value={form.category}
              onValueChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
              disabled={isLoading || isSubmitting}
            >
              <SelectTrigger className="flex-1 md:w-full">
                <SelectValue className="text-xs" placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.slug} value={category.slug} className="text-xs">
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 md:block md:space-y-0">
            <Label htmlFor="suggestion-liquidity" className="w-24 shrink-0 md:w-auto text-xs text-muted-foreground">
              Liquidity
            </Label>
            <Input
              id="suggestion-liquidity"
              className="text-xs"
              type="number"
              min={0}
              step="1"
              value={form.liquidity}
              onChange={(e) => setForm((prev) => ({ ...prev, liquidity: e.target.value }))}
              disabled={isLoading || isSubmitting}
            />
          </div>
          <div className="flex items-center gap-3 md:block md:space-y-0">
            <Label htmlFor="suggestion-start-date" className="w-24 shrink-0 md:w-auto text-xs text-muted-foreground">
              Start Date
            </Label>
            <div className="relative flex-1">
              <Input
                id="suggestion-start-date"
                type="datetime-local"
                className="ppx-datetime-input pr-10 text-xs"
                value={form.startDate}
                onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                ref={startDateInputRef}
                disabled={isLoading || isSubmitting}
              />
              <button
                type="button"
                aria-label="Open start date picker"
                className="ppx-datetime-trigger"
                onClick={() => {
                  const input = startDateInputRef.current;
                  if (!input) return;
                  if (typeof input.showPicker === "function") {
                    input.showPicker();
                  } else {
                    input.focus();
                  }
                }}
                disabled={isLoading || isSubmitting}
              >
                <Calendar className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 md:block md:space-y-0">
            <Label htmlFor="suggestion-end-date" className="w-24 shrink-0 md:w-auto text-xs text-muted-foreground">
              End Date
            </Label>
            <div className="relative flex-1">
              <Input
                id="suggestion-end-date"
                type="datetime-local"
                className="ppx-datetime-input pr-10 text-xs"
                value={form.endDate}
                onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                ref={endDateInputRef}
                disabled={isLoading || isSubmitting}
              />
              <button
                type="button"
                aria-label="Open end date picker"
                className="ppx-datetime-trigger"
                onClick={() => {
                  const input = endDateInputRef.current;
                  if (!input) return;
                  if (typeof input.showPicker === "function") {
                    input.showPicker();
                  } else {
                    input.focus();
                  }
                }}
                disabled={isLoading || isSubmitting}
              >
                <Calendar className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <MarketImagePickerField
          selectedIcon={form.image}
          images={images}
          isUploadingImage={isUploadingImage}
          onUploadImage={uploadImage}
          onSelectImage={(url) => setForm((prev) => ({ ...prev, image: url }))}
        />

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/suggestions")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={approveSuggestion} disabled={isLoading || isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Approve & Create Market
          </Button>
        </div>
      </div>
    </section>
  );
}
