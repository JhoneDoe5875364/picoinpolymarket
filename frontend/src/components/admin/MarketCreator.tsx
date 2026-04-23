"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { apiFetchWithToken } from "@/lib/api";

const marketSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters long."),
  slug: z.string().min(1, "Slug is required."),
  description: z.string().min(20, "Description must be at least 20 characters long."),
  rules: z.string().min(10, "Rules must be at least 10 characters long."),
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

  const form = useForm<MarketFormData>({
    resolver: zodResolver(marketSchema),
    defaultValues: {
      question: "",
      slug: "",
      description: "",
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

  const imageOptions = useMemo(() => {
    return images.map((img) => ({
      ...img,
      value: img.url,
    }));
  }, [images]);

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
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      form.setError("startDate", { type: "manual", message: "Start/end date is invalid." });
      return;
    }
    if (end <= start) {
      form.setError("endDate", { type: "manual", message: "End date must be after start date." });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        question: data.question.trim(),
        slug: data.slug.trim(),
        description: data.description.trim(),
        rules: data.rules.trim(),
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
          Fill in question, description, rules, category, dates, liquidity, and market image.
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
              name="rules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rules</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List detailed participation and resolution rules."
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
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[92px_1fr] items-center gap-2 md:block">
                    <FormLabel className="m-0">Start Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage className="col-span-2 md:col-span-1" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-[92px_1fr] items-center gap-2 md:block">
                    <FormLabel className="m-0">End Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage className="col-span-2 md:col-span-1" />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium">Market Image</h3>
                <label className={cn("inline-flex items-center gap-2 text-sm", isUploadingImage && "opacity-60")}>
                  <UploadCloud className="h-4 w-4" />
                  <span>{isUploadingImage ? "Uploading..." : "Upload image"}</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".png,.jpg,.jpeg,.webp,.gif,image/*"
                    disabled={isUploadingImage}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        uploadImage(file);
                      }
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>

              {imageOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No uploaded image yet.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto pr-1">
                  <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                    {imageOptions.map((img) => {
                      const active = selectedIcon === img.value;
                      return (
                        <button
                          type="button"
                          key={img.name}
                          onClick={() => form.setValue("icon", img.value, { shouldValidate: true })}
                          className={cn(
                            "overflow-hidden rounded-md border bg-muted/20 transition",
                            active ? "border-primary ring-2 ring-primary/30" : "hover:border-primary/40"
                          )}
                        >
                          <img src={img.url} alt={img.name} className="h-16 w-full object-cover" loading="lazy" />
                          <div className="truncate px-2 py-1 text-[11px]">{img.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {isLoadingMeta && (
              <p className="text-sm text-muted-foreground">Loading categories and images...</p>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Market
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
