"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type DraftStatus = "idle" | "saving" | "saved";

interface DraftData {
  title: string;
  slug: string;
  description: string;
  date: string; // ISO string
  draft: boolean;
  tags: string[];
  content: string;
  savedAt: string;
}

interface UseLocalDraftOptions {
  key: string;
  interval?: number; // Default 5 seconds
  getData: () => Omit<DraftData, "savedAt"> | null;
}

interface UseLocalDraftReturn {
  status: DraftStatus;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  hasDraft: boolean;
  isHydrated: boolean;
  loadDraft: () => DraftData | null;
  clearDraft: () => void;
  saveDraft: () => void;
}

function dataToHash(data: Omit<DraftData, "savedAt">): string {
  return JSON.stringify({
    title: data.title,
    slug: data.slug,
    description: data.description,
    date: data.date,
    draft: data.draft,
    tags: [...data.tags].sort(),
    content: data.content,
  });
}

export function useLocalDraft({
  key,
  interval = 5000, // 5 seconds
  getData,
}: UseLocalDraftOptions): UseLocalDraftReturn {
  const storageKey = `inkwell-draft-${key}`;

  const [status, setStatus] = useState<DraftStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const lastSavedHashRef = useRef<string | null>(null);

  // Check for existing draft after hydration
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const draft = JSON.parse(saved) as DraftData;
        setHasDraft(true);
        setLastSaved(new Date(draft.savedAt));
      } catch {
        // Invalid draft, ignore
      }
    }
    setIsHydrated(true);
  }, [storageKey]);

  // Check for changes
  const checkForChanges = useCallback(() => {
    const data = getData();
    if (!data) return false;

    // Initialize hash on first check
    if (lastSavedHashRef.current === null) {
      lastSavedHashRef.current = dataToHash(data);
      return false;
    }

    const currentHash = dataToHash(data);
    const hasChanges = lastSavedHashRef.current !== currentHash;
    setHasUnsavedChanges(hasChanges);
    return hasChanges;
  }, [getData]);

  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    const data = getData();
    if (!data) return;

    const currentHash = dataToHash(data);

    // Skip if no changes
    if (lastSavedHashRef.current === currentHash) {
      return;
    }

    setStatus("saving");

    const draftData: DraftData = {
      ...data,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(storageKey, JSON.stringify(draftData));
    lastSavedHashRef.current = currentHash;
    setLastSaved(new Date());
    setStatus("saved");
    setHasUnsavedChanges(false);
    setHasDraft(true);
  }, [getData, storageKey]);

  // Load draft from localStorage
  const loadDraft = useCallback((): DraftData | null => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return null;

    try {
      return JSON.parse(saved) as DraftData;
    } catch {
      return null;
    }
  }, [storageKey]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasDraft(false);
    setLastSaved(null);
  }, [storageKey]);

  // Check for changes periodically
  useEffect(() => {
    const changeCheckInterval = setInterval(() => {
      checkForChanges();
    }, 1000);

    return () => clearInterval(changeCheckInterval);
  }, [checkForChanges]);

  // Auto-save interval
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      const hasChanges = checkForChanges();
      if (hasChanges) {
        saveDraft();
      }
    }, interval);

    return () => clearInterval(autoSaveInterval);
  }, [interval, checkForChanges, saveDraft]);

  return {
    status,
    lastSaved,
    hasUnsavedChanges,
    hasDraft,
    isHydrated,
    loadDraft,
    clearDraft,
    saveDraft,
  };
}
