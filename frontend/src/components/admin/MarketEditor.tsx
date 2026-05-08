"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetchWithToken } from "@/lib/api";
import { Market } from "@/lib/types";
import { MarketImagePickerField } from "@/components/admin/MarketImagePickerField";

const marketSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters long."),
  slug: z.string().min(1, "Slug is required."),
  description: z.string().min(20, "Description must be at least 20 characters long."),
  yesCriteria: z.string().min(10, "Yes criteria must be at least 10 characters long."),
  noCriteria: z.string().min(10, "No criteria must be at least 10 characters long."),
  resolutionSource: z.string().min(5, "Resolution source must be at least 5 characters long."),
  edgeCases: z.string().min(10, "Edge cases must be at least 10 characters long."),
  marketContext: z.string().min(10, "Market context must be at least 10 characters long."),
  resolutionTime: z.string().optional(),
  rules: z.string().optional(),
  category: z.string().min(1, "Category is required."),
  startDate: z.string().min(1, "Start date is required."),
  endDate: z.string().min(1, "End date is required."),
  liquidity: z.number().min(0, "Liquidity must be >= 0"),
  icon: z.string().optional(),
});

type MarketFormData = z.infer<typeof marketSchema>;
type CategoryOption = { id: number; slug: string; name: string };
type MarketImage = { name: string; url: string };
type EditLoadResult = {
  categoryRows: CategoryOption[];
  imageRows: MarketImage[];
  market: Market;
};

const editLoadCache = new Map<string, EditLoadResult>();
const editLoadInFlight = new Map<string, Promise<EditLoadResult>>();

function toDateTimeLocalInput(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

async function fetchEditLoadData(marketId: string): Promise<EditLoadResult> {
  const cached = editLoadCache.get(marketId);
  if (cached) {
    return cached;
  }

  const inFlight = editLoadInFlight.get(marketId);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    const [categoryRes, imageRes, marketRes] = await Promise.all([
      apiFetchWithToken("/markets/categories", { method: "GET" }),
      apiFetchWithToken("/markets/images", { method: "GET" }),
      apiFetchWithToken(`/markets/${marketId}`, { method: "GET" }),
    ]);

    const categoryRows = Array.isArray(categoryRes?.data) ? categoryRes.data : [];
    const imageRows = Array.isArray(imageRes?.data) ? imageRes.data : [];
    const market = (marketRes?.data ?? null) as Market | null;

    if (!market?.id) {
      throw new Error("Market not found");
    }

    const loaded: EditLoadResult = {
      categoryRows,
      imageRows,
      market,
    };
    editLoadCache.set(marketId, loaded);
    return loaded;
  })();

  editLoadInFlight.set(marketId, request);
  try {
    return await request;
  } finally {
    editLoadInFlight.delete(marketId);
  }
}

type MarketEditorProps = {
  marketId: string;
};

export function MarketEditor({ marketId }: MarketEditorProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadedCategorySlug, setLoadedCategorySlug] = useState("");
  const [images, setImages] = useState<MarketImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const startDateInputRef = useRef<HTMLInputElement | null>(null);
  const endDateInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<MarketFormData>({
    resolver: zodResolver(marketSchema),
    defaultValues: {
      question: "",
      slug: "",
      description: "",
      yesCriteria: "",
      noCriteria: "",
      resolutionSource: "",
      edgeCases: "",
      marketContext: "",
      resolutionTime: "",
      rules: "",
      category: "",
      startDate: "",
      endDate: "",
      liquidity: 0,
      icon: "",
    },
  });

  const selectedIcon = form.watch("icon");

  useEffect(() => {
    let cancelled = false;

    async function loadEditData() {
      if (!marketId) return;

      setIsLoading(true);
      try {
        const { categoryRows, imageRows, market } = await fetchEditLoadData(marketId);
        if (cancelled) return;

        setCategories(categoryRows);
        setImages(imageRows);
        setLoadedCategorySlug(market.category ?? "");

        form.reset({
          question: market.question ?? "",
          slug: market.slug ?? "",
          description: market.description ?? "",
          yesCriteria: market.yes_criteria ?? "",
          noCriteria: market.no_criteria ?? "",
          resolutionSource: market.resolution_source ?? "",
          edgeCases: market.edge_cases ?? "",
          marketContext: market.market_context ?? "",
          resolutionTime: toDateTimeLocalInput(market.resolution_time),
          rules: market.rules ?? "",
          category: "",
          startDate: toDateTimeLocalInput(market.start_date),
          endDate: toDateTimeLocalInput(market.end_date),
          liquidity: Number(market.liquidity ?? 0),
          icon: market.icon ?? "",
        });
      } catch (err: any) {
        if (!cancelled) {
          toast({
            title: "Failed to load market",
            description: err?.message ?? "Could not fetch editable market details.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadEditData();
    return () => {
      cancelled = true;
    };
  }, [form, marketId, toast]);

  useEffect(() => {
    if (!loadedCategorySlug || categories.length === 0) return;

    const hasCategory = categories.some((category) => category.slug === loadedCategorySlug);
    if (!hasCategory) return;

    if (form.getValues("category") !== loadedCategorySlug) {
      form.setValue("category", loadedCategorySlug, {
        shouldValidate: true,
      });
    }
  }, [categories, form, loadedCategorySlug]);

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
      form.setValue("icon", uploaded.url, { shouldValidate: true });
      toast({ title: "Image uploaded", description: uploaded.name });
    } catch (err: any) {
      toast({
        title: "Image upload failed",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function onSubmit(data: MarketFormData) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const resolutionTime = data.resolutionTime ? new Date(data.resolutionTime) : null;
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      form.setError("startDate", { type: "manual", message: "Start/end date is invalid." });
      return;
    }
    if (resolutionTime && Number.isNaN(resolutionTime.getTime())) {
      form.setError("resolutionTime", { type: "manual", message: "Resolution time is invalid." });
      return;
    }
    if (end <= start) {
      form.setError("endDate", { type: "manual", message: "End date must be after start date." });
      return;
    }
    if (resolutionTime && resolutionTime < start) {
      form.setError("resolutionTime", { type: "manual", message: "Resolution time must be after start date." });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        question: data.question.trim(),
        slug: data.slug.trim(),
        description: data.description.trim(),
        rules: data.rules?.trim() || null,
        yes_criteria: data.yesCriteria.trim(),
        no_criteria: data.noCriteria.trim(),
        resolution_source: data.resolutionSource.trim(),
        edge_cases: data.edgeCases.trim(),
        market_context: data.marketContext.trim(),
        resolution_time: resolutionTime ? resolutionTime.toISOString() : null,
        category: data.category.trim(),
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        liquidity: data.liquidity,
        icon: data.icon?.trim() || null,
      };

      const res = await apiFetchWithToken(`/admin/markets/${marketId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(res?.error || "Update failed");
      }

      toast({
        title: "Market Updated",
        description: `ID: ${marketId}`,
      });
      router.push("/admin/markets");
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error Updating Market",
        description: err?.message ?? "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <Button variant="ghost" onClick={() => router.push("/admin/markets")} className="mb-2 p-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Manage Markets
        </Button>
      </div>
      <h2 className="text-xl font-semibold leading-none tracking-tight">Edit Market</h2>
      <p className="text-xs text-muted-foreground">
        Update question text, resolution criteria, dates, liquidity, and image for this market.
      </p>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading market editor...</p>
      ) : null}

      <div className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3 md:block md:space-y-0">
                      <FormLabel className="w-24 shrink-0 md:w-auto text-xs text-muted-foreground">Question</FormLabel>
                      <FormControl>
                        <Input
                          className="text-xs focus-visible:outline-none focus-visible:ring-0 w-full"
                          placeholder="e.g., Will X happen by Y date?"
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3 md:block md:space-y-0">
                      <FormLabel className="w-24 shrink-0 md:w-auto text-xs text-muted-foreground">Slug</FormLabel>
                      <FormControl>
                        <Input
                          className="text-xs focus-visible:outline-none focus-visible:ring-0 w-full"
                          placeholder="e.g., will-btc-hit-100k-by-2026"
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3 md:block md:space-y-0">
                      <FormLabel className="w-24 shrink-0 md:w-auto text-xs text-muted-foreground">Description</FormLabel>
                      <FormControl>
                        <Textarea
                          className="text-xs focus-visible:outline-none focus-visible:ring-0 w-full"
                          placeholder="Describe the market context and settlement reference details..."
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="yesCriteria"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3 md:block md:space-y-0">
                      <FormLabel className="w-24 shrink-0 md:w-auto text-xs text-muted-foreground">Yes Criteria</FormLabel>
                      <FormControl>
                        <Textarea
                          className="text-xs focus-visible:outline-none focus-visible:ring-0 w-full"
                          placeholder="Define explicit conditions that resolve this market as YES."
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="noCriteria"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3 md:block md:space-y-0">
                      <FormLabel className="w-24 shrink-0 md:w-auto text-xs text-muted-foreground">No Criteria</FormLabel>
                      <FormControl>
                        <Textarea
                          className="text-xs focus-visible:outline-none focus-visible:ring-0 w-full"
                          placeholder="Define explicit conditions that resolve this market as NO."
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <FormField
                control={form.control}
                name="resolutionSource"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3 md:block md:space-y-0">
                      <FormLabel className="w-24 shrink-0 md:w-auto text-xs text-muted-foreground">Resolution Source</FormLabel>
                      <FormControl>
                        <Input
                          className="text-xs focus-visible:outline-none focus-visible:ring-0 w-full"
                          placeholder="e.g., Official league website, government data portal"
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="resolutionTime"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3 md:block md:space-y-0">
                      <FormLabel className="w-24 shrink-0 md:w-auto text-xs text-muted-foreground">
                        Resolution Time (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="text-xs focus-visible:outline-none focus-visible:ring-0 w-full"
                          type="datetime-local"
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-2">
              <FormField
                control={form.control}
                name="edgeCases"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3 md:block md:space-y-0">
                      <FormLabel className="w-24 shrink-0 md:w-auto text-xs text-muted-foreground">Edge Cases</FormLabel>
                      <FormControl>
                        <Textarea
                          className="text-xs focus-visible:outline-none focus-visible:ring-0 w-full"
                          placeholder="Explain cancellations, delays, missing data, and ambiguity handling."
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marketContext"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3 md:block md:space-y-0">
                      <FormLabel className="w-24 shrink-0 md:w-auto text-xs text-muted-foreground">Market Context</FormLabel>
                      <FormControl>
                        <Textarea
                          className="text-xs focus-visible:outline-none focus-visible:ring-0 w-full"
                          placeholder="Neutral context only. Avoid wording that pushes users toward YES/NO."
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rules"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3 md:block md:space-y-0">
                      <FormLabel className="w-24 shrink-0 md:w-auto text-xs text-muted-foreground">Legacy Rules</FormLabel>
                      <FormControl>
                        <Textarea
                          className="text-xs focus-visible:outline-none focus-visible:ring-0 w-full"
                          placeholder="Optional free-form rules text for backward compatibility."
                          {...field}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3 md:block md:space-y-0">
                      <FormLabel className="w-24 shrink-0 md:w-auto text-xs text-muted-foreground">Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoading || isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className="flex-1 md:w-full">
                            <SelectValue className="text-xs" placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.slug} value={c.slug} className="text-xs">
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="liquidity"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-3 md:block md:space-y-0">
                      <FormLabel className="w-24 shrink-0 md:w-auto text-xs text-muted-foreground">Liquidity</FormLabel>
                      <FormControl>
                        <Input
                          className="text-xs"
                          type="number"
                          min={0}
                          step="0.0001"
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={isLoading || isSubmitting}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => {
                  const { ref, ...fieldProps } = field;
                  return (
                    <FormItem>
                      <div className="flex items-center gap-3 md:block md:space-y-0">
                        <FormLabel className="w-24 shrink-0 md:w-auto text-xs text-muted-foreground">Start Date</FormLabel>
                        <FormControl>
                          <div className="relative flex-1">
                            <Input
                              type="datetime-local"
                              className="ppx-datetime-input pr-10 text-xs"
                              {...fieldProps}
                              ref={(el) => {
                                ref(el);
                                startDateInputRef.current = el;
                              }}
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
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => {
                  const { ref, ...fieldProps } = field;
                  return (
                    <FormItem>
                      <div className="flex items-center gap-3 md:block md:space-y-0">
                        <FormLabel className="w-24 shrink-0 md:w-auto text-xs text-muted-foreground">End Date</FormLabel>
                        <FormControl>
                          <div className="relative flex-1">
                            <Input
                              type="datetime-local"
                              className="ppx-datetime-input pr-10 text-xs"
                              {...fieldProps}
                              ref={(el) => {
                                ref(el);
                                endDateInputRef.current = el;
                              }}
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
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <MarketImagePickerField
              selectedIcon={selectedIcon}
              images={images}
              isUploadingImage={isUploadingImage}
              onUploadImage={uploadImage}
              onSelectImage={(url) => form.setValue("icon", url, { shouldValidate: true })}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/markets")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </section>
  );
}
