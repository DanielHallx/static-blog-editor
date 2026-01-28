"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, FileText, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PostCard } from "@/components/posts/PostCard";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

function PostCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-4 w-1/3" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-9" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        Get started by creating your first blog post. Your content will appear here.
      </p>
      <Link href="/posts/new">
        <Button size="lg" className="btn-press">
          <Plus className="mr-2 h-5 w-5" />
          Create your first post
        </Button>
      </Link>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-6">
        <Search className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-destructive">Error loading posts</h3>
      <p className="text-muted-foreground mb-2">{message}</p>
      <p className="text-sm text-muted-foreground">Please try refreshing the page.</p>
    </div>
  );
}

export default function PostsPage() {
  const [includeDrafts, setIncludeDrafts] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["posts", includeDrafts],
    queryFn: () => api.listPosts(includeDrafts),
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => api.deletePost(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({
        title: "Post deleted",
        description: "The post has been deleted successfully",
      });
    },
    onError: (err) => {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Failed to delete post",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (slug: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      deleteMutation.mutate(slug);
    }
  };

  const publishedCount = data?.posts.filter((p) => !p.draft).length || 0;
  const draftCount = data?.posts.filter((p) => p.draft).length || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8 animate-slide-down">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="icon"
                  className="transition-all duration-200 hover:bg-accent hover:-translate-x-0.5"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {data?.total || 0} total posts
                  {data && data.total > 0 && (
                    <span className="ml-2">
                      ({publishedCount} published, {draftCount} drafts)
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg",
                  "bg-muted/50 transition-colors duration-200",
                  "hover:bg-muted"
                )}
              >
                <Switch
                  id="include-drafts"
                  checked={includeDrafts}
                  onCheckedChange={setIncludeDrafts}
                />
                <Label htmlFor="include-drafts" className="cursor-pointer text-sm">
                  Show drafts
                </Label>
              </div>
              <Link href="/posts/new">
                <Button className="btn-press shadow-sm hover:shadow-md transition-shadow duration-200">
                  <Plus className="mr-2 h-4 w-4" />
                  New Post
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-children">
            {[...Array(6)].map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            message={error instanceof Error ? error.message : "Unknown error occurred"}
          />
        ) : data?.posts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-children">
            {data?.posts.map((post) => (
              <PostCard key={post.slug} post={post} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
