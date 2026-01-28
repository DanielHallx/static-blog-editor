"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
  slug?: string;
}

/**
 * Transform relative image paths to use the backend proxy.
 * Converts paths like "./images/filename.jpg" or "images/filename.jpg"
 * to "/api/images/proxy/{slug}/filename.jpg"
 */
function transformImageUrl(src: string, slug?: string): string {
  if (!slug || !src) return src;

  // Handle relative paths like ./images/filename or images/filename
  const relativePattern = /^\.?\/images\/(.+)$/;
  const match = src.match(relativePattern);

  if (match) {
    const filename = match[1];
    return `/api/images/proxy/${slug}/${filename}`;
  }

  return src;
}

export function MarkdownPreview({ content, className, slug }: MarkdownPreviewProps) {
  return (
    <article
      className={cn(
        // Base prose styles - matching Astro blog
        "prose prose-neutral max-w-none dark:prose-invert",
        // Headings - semibold, proper colors
        "prose-headings:font-semibold",
        "prose-headings:text-foreground",
        // Links - underline with offset
        "prose-a:text-foreground prose-a:underline prose-a:underline-offset-[3px]",
        "prose-a:decoration-foreground/30 hover:prose-a:decoration-foreground/50",
        "prose-a:transition-colors prose-a:duration-300",
        // Inline code - remove the backticks that Typography adds
        "prose-code:before:content-none prose-code:after:content-none",
        "prose-code:rounded prose-code:bg-neutral-100 prose-code:px-1.5 prose-code:py-0.5",
        "prose-code:text-sm prose-code:font-mono prose-code:font-normal",
        "prose-code:text-neutral-800 dark:prose-code:bg-neutral-800 dark:prose-code:text-neutral-200",
        // Code blocks - better contrast
        "prose-pre:bg-neutral-100 prose-pre:text-neutral-800",
        "dark:prose-pre:bg-neutral-900 dark:prose-pre:text-neutral-200",
        "prose-pre:border prose-pre:border-neutral-200 dark:prose-pre:border-neutral-700",
        "prose-pre:rounded-lg prose-pre:py-4",
        // Images - centered with shadow
        "prose-img:mx-auto prose-img:rounded-lg prose-img:shadow-md",
        // Blockquotes
        "prose-blockquote:border-l-4 prose-blockquote:border-muted-foreground/30",
        "prose-blockquote:pl-4 prose-blockquote:not-italic",
        "prose-blockquote:text-muted-foreground",
        // Strong/Bold
        "prose-strong:text-foreground prose-strong:font-semibold",
        // Lists
        "prose-ul:my-4 prose-ol:my-4",
        "prose-li:my-1 prose-li:marker:text-muted-foreground",
        // Horizontal rule
        "prose-hr:border-border",
        // Tables
        "prose-table:border-collapse",
        "prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-4 prose-th:py-2",
        "prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom image component with proxy URL transformation
          img: ({ src, alt, ...props }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={transformImageUrl(src || "", slug)}
              alt={alt || ""}
              loading="lazy"
              {...props}
            />
          ),
          // Custom code block with better styling
          pre: ({ children, ...props }) => (
            <pre
              className="overflow-x-auto bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
              {...props}
            >
              {children}
            </pre>
          ),
          // Custom inline code
          code: ({ className, children, ...props }) => {
            // Check if this is inside a pre (code block) or standalone (inline code)
            const isInline = !className?.includes("language-");
            if (isInline) {
              return (
                <code
                  className="rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 text-sm font-mono text-neutral-800 dark:text-neutral-200"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={cn(className, "text-neutral-800 dark:text-neutral-200")} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
