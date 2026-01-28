"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { forwardRef, useImperativeHandle } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TagInput } from "./TagInput";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  description: z.string().min(1, "Description is required").max(500),
  date: z.date(),
  draft: z.boolean(),
  tags: z.array(z.string()),
});

export type FrontmatterFormData = z.infer<typeof formSchema>;

export interface FrontmatterFormRef {
  getValues: () => FrontmatterFormData;
  setValues: (data: FrontmatterFormData) => void;
}

interface FrontmatterFormProps {
  defaultValues?: Partial<FrontmatterFormData>;
  onSubmit: (data: FrontmatterFormData) => void;
  isLoading?: boolean;
  hideSlug?: boolean;
}

export const FrontmatterForm = forwardRef<FrontmatterFormRef, FrontmatterFormProps>(
  function FrontmatterForm(
    { defaultValues, onSubmit, isLoading, hideSlug = false },
    ref
  ) {
    const form = useForm<FrontmatterFormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        title: "",
        slug: "",
        description: "",
        date: new Date(),
        draft: false,
        tags: [],
        ...defaultValues,
      },
    });

    const { register, handleSubmit, watch, setValue, formState, getValues, reset } = form;
    const { errors } = formState;

    // Expose getValues to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        getValues: () => getValues(),
        setValues: (data: FrontmatterFormData) => reset(data),
      }),
      [getValues, reset],
    );

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setValue("title", title);

    if (!hideSlug && !defaultValues?.slug) {
      const slug = title
        .toLowerCase()
        .replace(/[\s_]+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("slug", slug);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="My Awesome Post"
          {...register("title")}
          onChange={handleTitleChange}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {!hideSlug && (
        <div className="space-y-2">
          <Label htmlFor="slug">URL Slug</Label>
          <Input id="slug" placeholder="my-awesome-post" {...register("slug")} />
          {errors.slug && (
            <p className="text-sm text-destructive">{errors.slug.message}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="A brief description of your post..."
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !watch("date") && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {watch("date") ? format(watch("date"), "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={watch("date")}
              onSelect={(date) => date && setValue("date", date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <TagInput
          value={watch("tags")}
          onChange={(tags) => setValue("tags", tags)}
          placeholder="Add tags..."
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="draft"
          checked={watch("draft")}
          onCheckedChange={(checked) => setValue("draft", checked)}
        />
        <Label htmlFor="draft">Save as draft</Label>
      </div>

    <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Saving..." : "Save Post"}
      </Button>
    </form>
  );
});
