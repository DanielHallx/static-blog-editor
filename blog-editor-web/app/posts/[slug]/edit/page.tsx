"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2, HardDrive, Loader2, Check } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FrontmatterForm,
  type FrontmatterFormData,
  type FrontmatterFormRef,
} from "@/components/posts/FrontmatterForm";
import { MarkdownEditor, type PendingImage } from "@/components/editor/MarkdownEditor";
import { useToast } from "@/components/ui/use-toast";
import { api, type UpdatePostData } from "@/lib/api";
import { useLocalDraft } from "@/lib/hooks/useLocalDraft";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [content, setContent] = useState("");
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const formRef = useRef<FrontmatterFormRef>(null);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const handlePendingImagesChange = useCallback((images: PendingImage[]) => {
    setPendingImages(images);
  }, []);

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["post", slug],
    queryFn: () => api.getPost(slug),
  });

  const getData = useCallback(() => {
    if (!formRef.current) return null;
    const formData = formRef.current.getValues();
    return {
      title: formData.title,
      slug: formData.slug,
      description: formData.description,
      date: formData.date.toISOString(),
      draft: formData.draft,
      tags: formData.tags,
      content,
    };
  }, [content]);

  const {
    status: draftStatus,
    lastSaved,
    hasUnsavedChanges,
    hasDraft,
    isHydrated,
    loadDraft,
    clearDraft,
  } = useLocalDraft({
    key: `edit-${slug}`,
    getData,
  });

  // Update content when post loads
  useEffect(() => {
    if (post && !draftRestored) {
      setContent(post.content);
    }
  }, [post, draftRestored]);

  useEffect(() => {
    if (isHydrated && hasDraft && post) {
      setShowDraftDialog(true);
    }
  }, [isHydrated, hasDraft, post]);

  const handleRestoreDraft = () => {
    const draft = loadDraft();
    if (draft && formRef.current) {
      formRef.current.setValues({
        title: draft.title,
        slug: draft.slug,
        description: draft.description,
        date: new Date(draft.date),
        draft: draft.draft,
        tags: draft.tags,
      });
      setContent(draft.content);
      setDraftRestored(true);
      toast({
        title: "Draft restored",
        description: "Your previous draft has been restored.",
      });
    }
    setShowDraftDialog(false);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowDraftDialog(false);
  };

  const updateMutation = useMutation({
    mutationFn: async (data: UpdatePostData) => {
      let finalContent = data.content || "";

      // Upload pending images and replace blob URLs
      for (const img of pendingImages) {
        try {
          const result = await api.uploadImage(slug, img.file);
          // Replace blob URL with the actual relative path
          finalContent = finalContent.replace(img.blobUrl, result.relative_path);
          // Revoke the blob URL after successful upload
          URL.revokeObjectURL(img.blobUrl);
        } catch (error) {
          toast({
            title: "Image upload failed",
            description: `Failed to upload ${img.filename}`,
            variant: "destructive",
          });
          throw error;
        }
      }

      return api.updatePost(slug, { ...data, content: finalContent });
    },
    onSuccess: () => {
      // Clear pending images after successful save
      setPendingImages([]);
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ["post", slug] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({
        title: "Post updated",
        description: "Your changes have been saved",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description:
          error instanceof Error ? error.message : "Failed to update post",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deletePost(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({
        title: "Post deleted",
        description: "Your post has been deleted",
      });
      router.push("/posts");
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Failed to delete post",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: FrontmatterFormData) => {
    updateMutation.mutate({
      title: data.title,
      description: data.description,
      date: format(data.date, "yyyy-MM-dd"),
      draft: data.draft,
      tags: data.tags,
      content: content,
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this post?")) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="mb-8 flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
            <Skeleton className="h-[600px]" />
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="flex flex-col items-center justify-center py-16">
            <h2 className="mb-2 text-xl font-semibold">Post not found</h2>
            <p className="mb-4 text-muted-foreground">
              The post you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link href="/posts">
              <Button>Back to posts</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/posts">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Edit Post</h1>
              <p className="text-sm text-muted-foreground">{post.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {draftStatus === "saving" && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span>Saving draft...</span>
                </>
              )}
              {draftStatus === "saved" && lastSaved && !hasUnsavedChanges && (
                <>
                  <HardDrive className="h-4 w-4 text-green-500" />
                  <span>Draft saved {format(lastSaved, "HH:mm")}</span>
                </>
              )}
              {hasUnsavedChanges && draftStatus !== "saving" && (
                <>
                  <HardDrive className="h-4 w-4" />
                  <span>Unsaved changes</span>
                </>
              )}
              {!hasUnsavedChanges && draftStatus === "idle" && !lastSaved && (
                <>
                  <Check className="h-4 w-4 text-muted-foreground" />
                  <span>Sync Ready</span>
                </>
              )}
            </div>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
          {/* Editor */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownEditor
                  value={content}
                  onChange={setContent}
                  slug={slug}
                  onPendingImagesChange={handlePendingImagesChange}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Post Details</CardTitle>
              </CardHeader>
              <CardContent>
                <FrontmatterForm
                  ref={formRef}
                  onSubmit={handleSubmit}
                  isLoading={updateMutation.isPending}
                  hideSlug
                  defaultValues={{
                    title: post.title,
                    slug: post.slug,
                    description: post.description,
                    date: parseISO(post.date),
                    draft: post.draft,
                    tags: post.tags,
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Draft recovery dialog */}
      <AlertDialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore draft?</AlertDialogTitle>
            <AlertDialogDescription>
              You have an unsaved draft from a previous session. Would you like to restore it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardDraft}>
              Discard
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreDraft}>
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
