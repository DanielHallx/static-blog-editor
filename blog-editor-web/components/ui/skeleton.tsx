import * as React from "react";

import { cn } from "@/lib/utils";

function Skeleton({
  className,
  shimmer = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { shimmer?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted",
        shimmer
          ? "relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-foreground/5 before:to-transparent before:animate-[shimmer_1.5s_infinite]"
          : "animate-pulse",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
