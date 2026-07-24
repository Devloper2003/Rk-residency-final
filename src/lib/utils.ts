import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely parse a JSON string into an array. Returns the fallback on any error
 * (malformed JSON, non-array value, null/undefined input). Prevents the
 * "Unexpected token" runtime crash that takes down an entire page when the
 * database contains a truncated or manually-edited JSON string.
 */
export function safeJsonArray<T>(raw: string | null | undefined, fallback: T[] = []): T[] {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

