"use client";

import { Info, AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type CalloutType = "info" | "warning" | "error" | "success";

interface CalloutBlockProps {
  type?: CalloutType;
  children: React.ReactNode;
}

const calloutConfig: Record<
  CalloutType,
  { icon: React.ElementType; className: string }
> = {
  info: {
    icon: Info,
    className: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200",
  },
  error: {
    icon: AlertCircle,
    className: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
  },
  success: {
    icon: CheckCircle,
    className: "border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-200",
  },
};

export function CalloutBlock({ type = "info", children }: CalloutBlockProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn("my-4 flex gap-3 rounded-lg border p-4", config.className)}>
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="text-sm">{children}</div>
    </div>
  );
}
