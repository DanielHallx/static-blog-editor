"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, HardDrive, Loader2, Check } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FrontmatterForm,
  type FrontmatterFormData,
  type FrontmatterFormRef,
} from "@/components/posts/FrontmatterForm";
import { MarkdownEditor, type PendingImage } from "@/components/editor/MarkdownEditor";
import { useToast } from "@/components/ui/use-toast";
import { api, type CreatePostData } from "@/lib/api";
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

export default function NewPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const formRef = useRef<FrontmatterFormRef>(null);
  const [showDraftDialog, setShowDraftDialog] = useState(false);

  const handlePendingImagesChange = useCallback((images: PendingImage[]) => {
    setPendingImages(images);
  }, []);

  // Local draft hook
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
    key: "new-post",
    getData,
  });

  // Check for existing draft after hydration
  useEffect(() => {
    if (isHydrated && hasDraft) {
      setShowDraftDialog(true);
    }
  }, [isHydrated, hasDraft]);

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

  const createMutation = useMutation({
    mutationFn: async (data: CreatePostData) => {
      let finalContent = data.content;

      // Upload pending images and replace blob URLs
      for (const img of pendingImages) {
        try {
          const result = await api.uploadImage(data.slug, img.file);
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

      return api.createPost({ ...data, content: finalContent });
    },
    onSuccess: (post) => {
      // Clear draft on successful save
      clearDraft();
      toast({
        title: "Post created",
        description: "Your post has been created successfully",
      });
      router.push(`/posts/${post.slug}/edit`);
    },
    onError: (error) => {
      toast({
        title: "Create failed",
        description:
          error instanceof Error ? error.message : "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: FrontmatterFormData) => {
    createMutation.mutate({
      slug: data.slug,
      title: data.title,
      description: data.description,
      date: format(data.date, "yyyy-MM-dd"),
      draft: data.draft,
      tags: data.tags,
      content: content,
    });
  };

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
              <h1 className="text-2xl font-bold">Create New Post</h1>
              <p className="text-sm text-muted-foreground">
                Create a new blog post
              </p>
            </div>
          </div>
          {/* Draft status indicator */}
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
                  slug="new-post"
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
                  isLoading={createMutation.isPending}
                  defaultValues={{
                    date: new Date(),
                    draft: true,
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
