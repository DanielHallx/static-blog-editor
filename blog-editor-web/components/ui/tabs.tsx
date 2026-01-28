"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

// Context to share the active tab and indicator position
interface TabsContextValue {
  activeTab: string | undefined;
  setActiveTab: (value: string) => void;
  registerTab: (value: string, element: HTMLButtonElement) => void;
  indicatorStyle: { left: number; width: number } | null;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => {
  const [activeTab, setActiveTab] = React.useState<string | undefined>(
    undefined
  );
  const [indicatorStyle, setIndicatorStyle] = React.useState<{
    left: number;
    width: number;
  } | null>(null);
  const tabsRef = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const listRef = React.useRef<HTMLDivElement | null>(null);

  const registerTab = React.useCallback(
    (value: string, element: HTMLButtonElement) => {
      tabsRef.current.set(value, element);
    },
    []
  );

  // Combined ref callback
  const setListRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      // Handle forwarded ref
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
      // Handle local ref
      listRef.current = node;
    },
    [ref]
  );

  // Update indicator position when active tab changes
  React.useEffect(() => {
    if (activeTab && listRef.current) {
      const activeElement = tabsRef.current.get(activeTab);
      if (activeElement) {
        const listRect = listRef.current.getBoundingClientRect();
        const activeRect = activeElement.getBoundingClientRect();
        setIndicatorStyle({
          left: activeRect.left - listRect.left,
          width: activeRect.width,
        });
      }
    }
  }, [activeTab]);

  // Handle resize
  React.useEffect(() => {
    const handleResize = () => {
      if (activeTab && listRef.current) {
        const activeElement = tabsRef.current.get(activeTab);
        if (activeElement) {
          const listRect = listRef.current.getBoundingClientRect();
          const activeRect = activeElement.getBoundingClientRect();
          setIndicatorStyle({
            left: activeRect.left - listRect.left,
            width: activeRect.width,
          });
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab]);

  return (
    <TabsContext.Provider
      value={{ activeTab, setActiveTab, registerTab, indicatorStyle }}
    >
      <TabsPrimitive.List
        ref={setListRef}
        className={cn(
          "relative inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
          className
        )}
        {...props}
      >
        {/* Sliding indicator */}
        {indicatorStyle && (
          <motion.div
            className="absolute h-[calc(100%-8px)] rounded-md bg-background shadow-sm z-0"
            initial={false}
            animate={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
            transition={{
              type: "tween",
              ease: [0.25, 0.1, 0.25, 1],
              duration: 0.3,
            }}
          />
        )}
        {children}
      </TabsPrimitive.List>
    </TabsContext.Provider>
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, value, ...props }, ref) => {
  const context = React.useContext(TabsContext);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  // Combined ref callback
  const setTriggerRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      // Handle forwarded ref
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
      // Handle local ref
      triggerRef.current = node;
    },
    [ref]
  );

  // Register tab and track active state
  React.useEffect(() => {
    if (triggerRef.current && value && context) {
      context.registerTab(value, triggerRef.current);
    }
  }, [value, context]);

  // Check if this tab is active by observing data-state attribute
  React.useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-state" && triggerRef.current) {
          const state = triggerRef.current.getAttribute("data-state");
          if (state === "active" && value && context) {
            context.setActiveTab(value);
          }
        }
      });
    });

    if (triggerRef.current) {
      // Check initial state
      const initialState = triggerRef.current.getAttribute("data-state");
      if (initialState === "active" && value && context) {
        context.setActiveTab(value);
      }

      observer.observe(triggerRef.current, { attributes: true });
    }

    return () => observer.disconnect();
  }, [value, context]);

  return (
    <TabsPrimitive.Trigger
      ref={setTriggerRef}
      value={value}
      className={cn(
        "relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground",
        className
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
