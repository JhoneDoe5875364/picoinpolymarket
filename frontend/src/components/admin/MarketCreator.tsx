"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { apiFetchWithToken } from "@/lib/api";

const marketSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters long."),
  description: z.string().min(20, "Description must be at least 20 characters long."),
  category: z.string().min(3, "Category is required."),
  resolutionDate: z.date().optional(),
  resolutionTime: z.string().optional(),
  timezone: z.string().optional(),
  // Legacy field for backward compatibility
  endDate: z.date().optional(),
  isClear: z.boolean().refine((v) => v === true, {
    message: "Resolution source and criteria must be clear.",
  }),
  noRestricted: z.boolean().refine((v) => v === true, {
    message: "You must confirm the market does not involve restricted topics.",
  }),
});

type MarketFormData = z.infer<typeof marketSchema>;

const categories = [
  "Crypto",
  "Technology",
  "Sports",
  "Politics",
  "Science",
  "Finance",
  "Entertainment",
  "World News",
  "Environment",
  "Other",
];

// Common timezones - using IANA timezone names
// Common timezones ordered by UTC offset, with GMT offset labels
const commonTimezones = [
  // GMT-12 to GMT-9
  { value: "Etc/GMT+12", label: "International Date Line West (GMT-12)" },
  { value: "Pacific/Pago_Pago", label: "Pacific/Pago_Pago (GMT-11)" },
  { value: "Pacific/Honolulu", label: "Pacific/Honolulu (GMT-10)" },
  { value: "America/Anchorage", label: "America/Anchorage (GMT-9)" },
  // GMT-8 to GMT-5
  { value: "America/Los_Angeles", label: "America/Los_Angeles (GMT-8)" },
  { value: "America/Denver", label: "America/Denver (GMT-7)" },
  { value: "America/Chicago", label: "America/Chicago (GMT-6)" },
  { value: "America/New_York", label: "America/New_York (GMT-5)" },
  // GMT-4 to GMT-1
  { value: "America/Halifax", label: "America/Halifax (GMT-4)" },
  { value: "America/St_Johns", label: "America/St_Johns (GMT-3)" }, // Standard only
  { value: "America/Argentina/Buenos_Aires", label: "America/Argentina/Buenos_Aires (GMT-3)" },
  { value: "Atlantic/South_Georgia", label: "Atlantic/South_Georgia (GMT-2)" },
  { value: "Atlantic/Azores", label: "Atlantic/Azores (GMT-1)" },
  // GMT+0 (UTC) and UK
  { value: "UTC", label: "UTC (GMT+0)" },
  { value: "Europe/London", label: "Europe/London (GMT+0)" },
  // Central Europe
  { value: "Europe/Paris", label: "Europe/Paris (GMT+1)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (GMT+1)" },
  { value: "Africa/Lagos", label: "Africa/Lagos (GMT+1)" },
  // Eastern Europe/Africa
  { value: "Europe/Athens", label: "Europe/Athens (GMT+2)" },
  { value: "Europe/Helsinki", label: "Europe/Helsinki (GMT+2)" },
  { value: "Africa/Cairo", label: "Africa/Cairo (GMT+2)" },
  { value: "Europe/Istanbul", label: "Europe/Istanbul (GMT+3)" },
  { value: "Asia/Jerusalem", label: "Asia/Jerusalem (GMT+2)" },
  // Middle East
  { value: "Asia/Dubai", label: "Asia/Dubai (GMT+4)" },
  { value: "Asia/Karachi", label: "Asia/Karachi (GMT+5)" },
  { value: "Asia/Dhaka", label: "Asia/Dhaka (GMT+6)" },
  { value: "Asia/Bangkok", label: "Asia/Bangkok (GMT+7)" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai (GMT+8)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (GMT+8)" },
  { value: "Asia/Seoul", label: "Asia/Seoul (GMT+9)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (GMT+9)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (GMT+10)" },
  { value: "Pacific/Noumea", label: "Pacific/Noumea (GMT+11)" },
  { value: "Pacific/Auckland", label: "Pacific/Auckland (GMT+12)" },
  // GMT+13 and +14 (extreme east)
  { value: "Pacific/Apia", label: "Pacific/Apia (GMT+13)" },
  { value: "Pacific/Kiritimati", label: "Pacific/Kiritimati (GMT+14)" },
];

type MarketCreatorProps = {
  onCreated?: () => void;
};

export function MarketCreator({ onCreated }: MarketCreatorProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MarketFormData>({
    resolver: zodResolver(marketSchema),
    defaultValues: {
      question: "",
      description: "",
      category: "",
      resolutionDate: undefined,
      resolutionTime: "",
      timezone: "UTC",
      isClear: false,
      noRestricted: false,
    },
  });

  async function onSubmit(data: MarketFormData) {
    setIsSubmitting(true);
    try {
      // Map UI fields -> backend payload
      const payload: any = {
        question: data.question.trim(),
        description: data.description.trim(),
        category: data.category.trim(),
        checklist_resolution_clarity: data.isClear,
        checklist_restricted_topics: data.noRestricted,
      };

      // Use new format (date + time + timezone) if available, otherwise fall back to legacy format
      if (data.resolutionDate) {
        const dateStr = format(data.resolutionDate, "yyyy-MM-dd");
        payload.resolution_date_str = dateStr;
        
        if (data.resolutionTime) {
          payload.resolution_time_str = data.resolutionTime;
        }
        
        if (data.timezone) {
          payload.timezone = data.timezone;
        }
      } else if (data.endDate) {
        // Legacy format for backward compatibility
        payload.resolution_date = data.endDate.toISOString();
      }

      const res = await apiFetchWithToken("/admin/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(res?.error || "Create failed");
      }

      toast({
        title: "Market Created",
        description: `ID: ${res.market?.id ?? "—"}`,
      });
      form.reset();
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
    <Card>
      <CardHeader>
        <CardTitle>Create a New Market</CardTitle>
        <CardDescription>Fill out the details below to launch a new prediction market.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <Textarea placeholder="Provide clear resolution criteria and the source of truth for the outcome..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
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
                name="resolutionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resolution Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.watch("resolutionDate") && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="resolutionTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resolution Time (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          placeholder="HH:MM:SS"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Specify the exact time for resolution (defaults to 00:00:00)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "UTC"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {commonTimezones.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Timezone for the resolution date and time
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="space-y-4 rounded-md border p-4">
              <h3 className="text-lg font-medium">Compliance Checklist</h3>

              <FormField
                control={form.control}
                name="isClear"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Question & Resolution Clarity</FormLabel>
                      <FormDescription>
                        The market question is unambiguous and the resolution criteria are clearly defined.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="noRestricted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>No Restricted Topics</FormLabel>
                      <FormDescription>
                        This market does not involve violence, personal harm, or other restricted topics.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>

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
