"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Image,
  Minus,
} from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { MarkdownPreview } from "./MarkdownPreview";
import { ImageUploader, type PendingImage } from "./ImageUploader";
import { cn } from "@/lib/utils";

export type { PendingImage };

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  slug: string;
  onPendingImagesChange?: (images: PendingImage[]) => void;
}

interface ToolbarButtonProps {
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  onClick: () => void;
}

function ToolbarButton({ icon: Icon, label, shortcut, onClick }: ToolbarButtonProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={cn(
              "h-8 w-8 p-0",
              "hover:bg-accent hover:text-accent-foreground",
              "transition-all duration-200",
              "active:scale-95"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="flex items-center gap-2">
          <span>{label}</span>
          {shortcut && (
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              {shortcut}
            </kbd>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ToolbarDivider() {
  return <Separator orientation="vertical" className="mx-1 h-6" />;
}

export function MarkdownEditor({ value, onChange, slug, onPendingImagesChange }: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<string>("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const pendingImagesRef = useRef<PendingImage[]>([]);

  // Notify parent when pending images change
  useEffect(() => {
    onPendingImagesChange?.(pendingImages);
    pendingImagesRef.current = pendingImages;
  }, [pendingImages, onPendingImagesChange]);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((img) => URL.revokeObjectURL(img.blobUrl));
    };
  }, []);

  // Insert text at cursor position or wrap selected text
  const insertAtCursor = useCallback(
    (prefix: string, suffix: string = "", defaultText: string = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const textToInsert = selectedText || defaultText;

      const before = value.substring(0, start);
      const after = value.substring(end);
      const newText = `${before}${prefix}${textToInsert}${suffix}${after}`;

      onChange(newText);

      // Restore focus and cursor position
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = selectedText
          ? start + prefix.length + selectedText.length + suffix.length
          : start + prefix.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [value, onChange]
  );

  // Insert text on a new line
  const insertOnNewLine = useCallback(
    (text: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const before = value.substring(0, start);
      const after = value.substring(start);

      // Check if we need to add a newline before
      const needsNewline = before.length > 0 && !before.endsWith("\n");
      const prefix = needsNewline ? "\n" : "";

      const newText = `${before}${prefix}${text}${after}`;
      onChange(newText);

      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + prefix.length + text.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [value, onChange]
  );

  // Toolbar actions - memoized to prevent unnecessary re-renders
  const actions = useMemo(
    () => ({
      bold: () => insertAtCursor("**", "**", "bold text"),
      italic: () => insertAtCursor("*", "*", "italic text"),
      h1: () => insertOnNewLine("# "),
      h2: () => insertOnNewLine("## "),
      h3: () => insertOnNewLine("### "),
      bulletList: () => insertOnNewLine("- "),
      numberedList: () => insertOnNewLine("1. "),
      quote: () => insertOnNewLine("> "),
      inlineCode: () => insertAtCursor("`", "`", "code"),
      codeBlock: () => insertOnNewLine("```\n\n```"),
      link: () => insertAtCursor("[", "](url)", "link text"),
      image: () => insertAtCursor("![", "](url)", "alt text"),
      horizontalRule: () => insertOnNewLine("\n---\n"),
    }),
    [insertAtCursor, insertOnNewLine]
  );

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const isMod = e.metaKey || e.ctrlKey;

      if (isMod) {
        switch (e.key.toLowerCase()) {
          case "b":
            e.preventDefault();
            actions.bold();
            break;
          case "i":
            e.preventDefault();
            actions.italic();
            break;
          case "k":
            e.preventDefault();
            actions.link();
            break;
          case "e":
            e.preventDefault();
            actions.inlineCode();
            break;
        }
      }
    },
    [actions]
  );

  const handleImageUpload = (markdown: string, pendingImage: PendingImage) => {
    // Add to pending images
    setPendingImages((prev) => [...prev, pendingImage]);

    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + "\n\n" + markdown + "\n");
      return;
    }

    const start = textarea.selectionStart;
    const before = value.substring(0, start);
    const after = value.substring(start);
    const needsNewline = before.length > 0 && !before.endsWith("\n");
    const prefix = needsNewline ? "\n\n" : "";

    onChange(`${before}${prefix}${markdown}\n${after}`);
  };

  // Determine shortcut modifier based on platform
  const modKey = typeof navigator !== "undefined" && navigator.platform.includes("Mac") ? "⌘" : "Ctrl+";

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
          <TabsList className="grid w-full sm:w-auto grid-cols-2">
            <TabsTrigger value="write" className="px-6">
              Write
            </TabsTrigger>
            <TabsTrigger value="preview" className="px-6">
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Toolbar - only show in write mode */}
          {activeTab === "write" && (
            <div className="flex items-center gap-0.5 flex-wrap">
              <ToolbarButton
                icon={Bold}
                label="Bold"
                shortcut={`${modKey}B`}
                onClick={actions.bold}
              />
              <ToolbarButton
                icon={Italic}
                label="Italic"
                shortcut={`${modKey}I`}
                onClick={actions.italic}
              />
              <ToolbarDivider />
              <ToolbarButton icon={Heading1} label="Heading 1" onClick={actions.h1} />
              <ToolbarButton icon={Heading2} label="Heading 2" onClick={actions.h2} />
              <ToolbarButton icon={Heading3} label="Heading 3" onClick={actions.h3} />
              <ToolbarDivider />
              <ToolbarButton icon={List} label="Bullet List" onClick={actions.bulletList} />
              <ToolbarButton
                icon={ListOrdered}
                label="Numbered List"
                onClick={actions.numberedList}
              />
              <ToolbarButton icon={Quote} label="Quote" onClick={actions.quote} />
              <ToolbarDivider />
              <ToolbarButton
                icon={Code}
                label="Inline Code"
                shortcut={`${modKey}E`}
                onClick={actions.inlineCode}
              />
              <ToolbarButton
                icon={Link}
                label="Link"
                shortcut={`${modKey}K`}
                onClick={actions.link}
              />
              <ToolbarButton icon={Image} label="Image" onClick={actions.image} />
              <ToolbarButton icon={Minus} label="Horizontal Rule" onClick={actions.horizontalRule} />
            </div>
          )}
        </div>

        <TabsContent value="write" className="mt-4">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write your content in Markdown...

Keyboard shortcuts:
  ⌘/Ctrl + B = Bold
  ⌘/Ctrl + I = Italic
  ⌘/Ctrl + K = Link
  ⌘/Ctrl + E = Code"
            className={cn(
              "min-h-[400px] font-mono text-sm resize-y",
              "transition-shadow duration-200",
              "focus:shadow-md"
            )}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <div
            className={cn(
              "min-h-[400px] rounded-md border bg-background p-6",
              "transition-all duration-200"
            )}
          >
            {value ? (
              <MarkdownPreview content={value} slug={slug} />
            ) : (
              <p className="text-muted-foreground italic">
                Nothing to preview yet. Start writing!
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ImageUploader onUpload={handleImageUpload} />
    </div>
  );
}
