"use client";

import { useEffect, useState } from "react";

/** Hydrates after the first render so server and client markup agree. */
export function useLocalState<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => value is T,
) {
  const [value, setValue] = useState(fallback);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    // Hydrate after mount without synchronously cascading from the effect.
    queueMicrotask(() => {
      if (!active) return;
      try {
        const parsed: unknown = JSON.parse(localStorage.getItem(key) || "null");
        if (validate(parsed)) setValue(parsed);
      } catch {
        /* Private browsing can disable storage. */
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [key, validate]);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* Keep the session usable. */
      }
    }
  }, [key, value, ready]);
  return [value, setValue, ready] as const;
}

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");
