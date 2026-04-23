"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetchWithToken } from "@/lib/api";

const suggestionSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters long."),
  description: z.string().min(20, "Description must be at least 20 characters long."),
  category: z.string().min(1, "Category is required."),
  startDate: z.string().min(1, "Start date is required."),
  endDate: z.string().min(1, "End date is required."),
});

type SuggestionFormData = z.infer<typeof suggestionSchema>;
type CategoryOption = { id: number; slug: string; name: string };

let suggestionCategoryCache: CategoryOption[] | null = null;
let suggestionCategoryRequest: Promise<CategoryOption[]> | null = null;

async function fetchSuggestionCategories(): Promise<CategoryOption[]> {
  if (suggestionCategoryCache) {
    return suggestionCategoryCache;
  }
  if (suggestionCategoryRequest) {
    return suggestionCategoryRequest;
  }

  suggestionCategoryRequest = (async () => {
    const res = await apiFetchWithToken("/suggestions/categories", { method: "GET" });
    const rows = Array.isArray(res?.data) ? res.data : [];
    suggestionCategoryCache = rows;
    return rows;
  })();

  try {
    return await suggestionCategoryRequest;
  } finally {
    suggestionCategoryRequest = null;
  }
}

type SuggestMarketFormProps = {
  onSubmitted?: () => void;
};

export function SuggestMarketForm({ onSubmitted }: SuggestMarketFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const form = useForm<SuggestionFormData>({
    resolver: zodResolver(suggestionSchema),
    defaultValues: {
      question: "",
      description: "",
      category: "",
      startDate: "",
      endDate: "",
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setIsLoadingCategories(true);
      try {
        const rows = await fetchSuggestionCategories();
        if (cancelled) return;
        setCategories(rows);
        if (!form.getValues("category") && rows.length > 0) {
          form.setValue("category", rows[0].slug, { shouldValidate: true });
        }
      } catch (error: any) {
        if (cancelled) return;
        toast({
          title: "Failed to load categories",
          description: error?.message ?? "Could not fetch suggestion categories.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) {
          setIsLoadingCategories(false);
        }
      }
    }

    loadCategories();
    return () => {
      cancelled = true;
    };
  }, [form, toast]);

  async function onSubmit(data: SuggestionFormData) {
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
      const res = await apiFetchWithToken("/suggestions", {
        method: "POST",
        body: JSON.stringify({
          question: data.question.trim(),
          description: data.description.trim(),
          category: data.category.trim(),
          start_date: start.toISOString(),
          end_date: end.toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error(res?.error || "Submission failed");
      }

      toast({
        title: "Suggestion submitted",
        description: "Your market suggestion is now pending admin review.",
      });
      form.reset({
        question: "",
        description: "",
        category: categories[0]?.slug ?? "",
        startDate: "",
        endDate: "",
      });
      onSubmitted?.();
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error?.message ?? "Unable to send suggestion. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description & Rules</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Provide clear resolution criteria and any important details..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.slug} value={category.slug}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="datetime-local" className="ppx-datetime-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input type="datetime-local" className="ppx-datetime-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {isLoadingCategories ? (
          <p className="text-sm text-muted-foreground">Loading categories...</p>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || isLoadingCategories}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Suggestion
          </Button>
        </div>
      </form>
    </Form>
  );
}