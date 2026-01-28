"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PenSquare,
  FileText,
  Github,
  Moon,
  Sun,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
  className,
  delay = 0,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  loading: boolean;
  className?: string;
  delay?: number;
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5",
        "group",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute right-0 top-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-150" />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-sm font-medium">{title}</CardDescription>
          <Icon className="h-4 w-4 text-muted-foreground transition-colors duration-200 group-hover:text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold">
          {loading ? (
            <Skeleton className="h-9 w-16" />
          ) : (
            <span className="tabular-nums">{value}</span>
          )}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  description,
  delay = 0,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <Link href={href}>
      <Card
        className={cn(
          "cursor-pointer group h-full",
          "transition-all duration-300 ease-out",
          "hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5",
          "hover:border-primary/30",
          "hover:bg-accent/50"
        )}
        style={{ animationDelay: `${delay}ms` }}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg",
                "bg-primary/10 transition-colors duration-200",
                "group-hover:bg-primary group-hover:text-primary-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <ArrowRight
              className={cn(
                "h-5 w-5 text-muted-foreground",
                "opacity-0 -translate-x-2",
                "transition-all duration-200",
                "group-hover:opacity-100 group-hover:translate-x-0"
              )}
            />
          </div>
          <CardTitle className="text-lg mt-4 group-hover:text-primary transition-colors duration-200">
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="space-y-4 text-center animate-fade-in">
        <div className="flex items-center justify-center">
          <div className="loading-spinner h-10 w-10" />
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function LoginScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
            <PenSquare className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Inkwell</CardTitle>
            <p className="text-xs text-muted-foreground mt-1 tracking-wide">by Daniel Hall</p>
            <CardDescription className="mt-2">
              Sign in with GitHub to manage your blog content
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <a href="/api/auth/login">
            <Button className="w-full group" size="lg">
              <Github className="mr-2 h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              Sign in with GitHub
              <ArrowRight className="ml-2 h-4 w-4 opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { user, setUser, isLoading: authLoading, setLoading } = useAuthStore();
  const [isDark, setIsDark] = useState(false);

  // Check auth on mount
  useEffect(() => {
    api
      .getCurrentUser()
      .then(setUser)
      .catch((error) => {
        // Log for debugging, but don't show to user (401 is expected when not logged in)
        if (error instanceof ApiError && error.status !== 401) {
          console.error("Auth check failed:", error.message);
        }
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [setUser, setLoading]);

  // Initialize dark mode from system preference and listen for changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // Set initial state based on system preference
    const updateDarkMode = (matches: boolean) => {
      setIsDark(matches);
      if (matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    // Apply initial preference
    updateDarkMode(mediaQuery.matches);

    // Listen for system preference changes
    const handleChange = (e: MediaQueryListEvent) => {
      updateDarkMode(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Fetch posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: () => api.listPosts(),
    enabled: !!user,
  });

  const toggleDarkMode = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      // Still clear local state even if server logout fails
      setUser(null);
    }
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  const publishedCount = postsData?.posts.filter((p) => !p.draft).length || 0;
  const draftCount = postsData?.posts.filter((p) => p.draft).length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className={cn(
          "sticky top-0 z-50 border-b",
          "bg-background/80 backdrop-blur-lg",
          "supports-[backdrop-filter]:bg-background/60"
        )}
      >
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
              <PenSquare className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-lg leading-tight">Inkwell</span>
              <span className="text-[10px] text-muted-foreground tracking-wider">by Daniel Hall</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="transition-all duration-200 hover:bg-accent"
            >
              {isDark ? (
                <Sun className="h-5 w-5 transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon className="h-5 w-5 transition-transform duration-300 hover:-rotate-12" />
              )}
            </Button>

            <div
              className={cn(
                "flex items-center gap-3 px-3 py-1.5 rounded-full",
                "bg-muted/50 transition-colors duration-200",
                "hover:bg-muted"
              )}
            >
              <img
                src={user.avatar_url}
                alt={user.login}
                className="h-7 w-7 rounded-full ring-2 ring-background"
              />
              <span className="text-sm font-medium hidden sm:inline">{user.login}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Welcome Section */}
        <div className="mb-10 animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary animate-float" />
            <span className="text-sm font-medium text-primary">Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.name || user.login}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your blog content from here
          </p>
        </div>

        {/* Stats */}
        <div className="mb-10 grid gap-4 md:grid-cols-3 stagger-children">
          <StatCard
            title="Total Posts"
            value={postsData?.total || 0}
            icon={FileText}
            loading={postsLoading}
            delay={0}
          />
          <StatCard
            title="Published"
            value={publishedCount}
            icon={TrendingUp}
            loading={postsLoading}
            delay={100}
          />
          <StatCard
            title="Drafts"
            value={draftCount}
            icon={Clock}
            loading={postsLoading}
            delay={200}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
          <ActionCard
            href="/posts/new"
            icon={PenSquare}
            title="Create New Post"
            description="Write a new blog post with the visual editor"
            delay={0}
          />
          <ActionCard
            href="/posts"
            icon={FileText}
            title="Manage Posts"
            description="View, edit, or delete existing posts"
            delay={100}
          />
        </div>
      </main>
    </div>
  );
}
