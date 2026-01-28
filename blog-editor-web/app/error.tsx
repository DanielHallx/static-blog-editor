"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground text-sm">
            An unexpected error occurred. Please try again or refresh the page.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={reset} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            <Button onClick={() => (window.location.href = "/")}>
              <Home className="mr-2 h-4 w-4" />
              Go home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
