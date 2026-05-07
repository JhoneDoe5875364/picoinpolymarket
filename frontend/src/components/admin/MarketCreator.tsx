"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import { Calendar, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetchWithToken } from "@/lib/api";
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

type MarketCreatorProps = {
  onCreated?: () => void;
};

export function MarketCreator({ onCreated }: MarketCreatorProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [images, setImages] = useState<MarketImage[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
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

    async function loadMeta() {
      setIsLoadingMeta(true);
      try {
        const [categoryRes, imageRes] = await Promise.all([
          apiFetchWithToken("/markets/categories", { method: "GET" }),
          apiFetchWithToken("/markets/images", { method: "GET" }),
        ]);

        if (cancelled) return;
        const categoryRows = Array.isArray(categoryRes?.data) ? categoryRes.data : [];
        const imageRows = Array.isArray(imageRes?.data) ? imageRes.data : [];

        setCategories(categoryRows);
        setImages(imageRows);

        const currentCategory = form.getValues("category");
        if (!currentCategory && categoryRows.length > 0) {
          form.setValue("category", categoryRows[0].slug, { shouldValidate: true });
        }
      } catch (err: any) {
        if (!cancelled) {
          toast({
            title: "Failed to load market metadata",
            description: err?.message ?? "Could not fetch categories/images.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setIsLoadingMeta(false);
      }
    }

    loadMeta();
    return () => {
      cancelled = true;
    };
  }, [form, toast]);

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

      const res = await apiFetchWithToken("/admin/markets", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(res?.error || "Create failed");
      }

      toast({
        title: "Market Created",
        description: `ID: ${res.market?.id ?? "—"}`,
      });
      form.reset({
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
        category: categories[0]?.slug || "",
        startDate: "",
        endDate: "",
        liquidity: 0,
        icon: "",
      });
      onCreated?.();
    } catch (err: any) {
      toast({
        title: "Error Creating Market",
        description: err?.message ?? "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="space-y-1 px-5 pb-3 pt-4">
        <CardTitle>Create a New Market</CardTitle>
        <CardDescription>
          Fill in question, structured resolution rules, context, category, dates, liquidity, and market image.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 pb-4 pt-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Market Question</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Will X happen by Y date?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., will-btc-hit-100k-by-2026" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the market context and settlement reference details..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="yesCriteria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What Counts as Yes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Define explicit conditions that resolve this market as YES."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="noCriteria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What Counts as No</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Define explicit conditions that resolve this market as NO."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="resolutionSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resolution Source</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Official league website, government data portal"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="resolutionTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resolution Time (optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="edgeCases"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Edge Cases</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain cancellations, delays, missing data, and ambiguity handling."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="marketContext"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Market Context</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Neutral context only. Avoid wording that pushes users toward YES/NO."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Legacy Rules (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional free-form rules text for backward compatibility."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[92px_1fr] items-center gap-2 md:block">
                    <FormLabel className="m-0">Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.slug} value={c.slug}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="col-span-2 md:col-span-1" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="liquidity"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[92px_1fr] items-center gap-2 md:block">
                    <FormLabel className="m-0">Liquidity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.0001"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage className="col-span-2 md:col-span-1" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => {
                  const { ref, ...fieldProps } = field;
                  return (
                    <FormItem className="grid grid-cols-[92px_1fr] items-center gap-2 md:block">
                      <FormLabel className="m-0">Start Date</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="datetime-local"
                            className="ppx-datetime-input pr-10"
                            {...fieldProps}
                            ref={(el) => {
                              ref(el);
                              startDateInputRef.current = el;
                            }}
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
                          >
                            <Calendar className="h-4 w-4" />
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="col-span-2 md:col-span-1" />
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
                    <FormItem className="grid grid-cols-[92px_1fr] items-center gap-2 md:block">
                      <FormLabel className="m-0">End Date</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="datetime-local"
                            className="ppx-datetime-input pr-10"
                            {...fieldProps}
                            ref={(el) => {
                              ref(el);
                              endDateInputRef.current = el;
                            }}
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
                          >
                            <Calendar className="h-4 w-4" />
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="col-span-2 md:col-span-1" />
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

            {isLoadingMeta && (
              <p className="text-sm text-muted-foreground">Loading categories and images...</p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Market
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
