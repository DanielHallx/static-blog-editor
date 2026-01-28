"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,     // 5分钟 - 博客内容不常变化
            gcTime: 30 * 60 * 1000,       // 30分钟保留缓存
            refetchOnWindowFocus: false,
            refetchOnMount: false,        // 已有缓存时不重新请求
            retry: 2,                     // 失败重试2次
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
