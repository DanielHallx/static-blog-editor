"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Edit, Trash2, EyeOff, Calendar, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PostListItem } from "@/lib/api";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: PostListItem;
  onDelete: (slug: string) => void;
}

export function PostCard({ post, onDelete }: PostCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-col group",
        // Enhanced hover effects
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/5",
        "hover:border-primary/30",
        // Subtle background change on hover
        "hover:bg-accent/30"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle
            className={cn(
              "text-lg leading-tight",
              "transition-colors duration-200",
              "group-hover:text-primary"
            )}
          >
            {post.title}
          </CardTitle>
          {post.draft && (
            <Badge
              variant="secondary"
              className={cn(
                "shrink-0",
                "transition-all duration-200",
                "group-hover:bg-amber-100 group-hover:text-amber-700",
                "dark:group-hover:bg-amber-900/30 dark:group-hover:text-amber-400"
              )}
            >
              <EyeOff className="mr-1 h-3 w-3" />
              Draft
            </Badge>
          )}
        </div>
        <CardDescription className="flex items-center gap-1.5 text-xs mt-1.5">
          <Calendar className="h-3 w-3" />
          {format(new Date(post.date), "MMMM d, yyyy")}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <p
          className={cn(
            "text-sm text-muted-foreground line-clamp-2",
            "transition-colors duration-200",
            "group-hover:text-foreground/80"
          )}
        >
          {post.description}
        </p>
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((tag, index) => (
              <Badge
                key={tag}
                variant="outline"
                className={cn(
                  "text-xs",
                  "transition-all duration-200",
                  "hover:bg-primary hover:text-primary-foreground hover:border-primary",
                  "cursor-default"
                )}
                style={{
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-3 border-t border-transparent group-hover:border-border/50 transition-colors duration-200">
        <Link href={`/posts/${post.slug}/edit`} className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-full",
              "transition-all duration-200",
              "group-hover:bg-primary group-hover:text-primary-foreground",
              "group-hover:border-primary",
              "group-hover:shadow-sm"
            )}
          >
            <Edit className="mr-1.5 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            Edit
            <ArrowRight className="ml-1.5 h-3 w-3 opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(post.slug)}
          className={cn(
            "transition-all duration-200",
            "text-muted-foreground hover:text-destructive",
            "hover:bg-destructive/10 hover:border-destructive/50",
            "opacity-60 group-hover:opacity-100",
            "active:scale-95"
          )}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
