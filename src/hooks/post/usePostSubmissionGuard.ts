import { useRef, useCallback } from 'react';

interface PostSubmissionGuard {
  canSubmit: (content: string) => boolean;
  recordSubmission: (content: string) => void;
}

/**
 * Hook to prevent duplicate post submissions
 * Tracks recent submissions to prevent duplicates
 */
export function usePostSubmissionGuard(windowMs: number = 5000): PostSubmissionGuard {
  const submissionsRef = useRef<Map<string, number>>(new Map());

  const canSubmit = useCallback((content: string): boolean => {
    const now = Date.now();
    const trimmedContent = content.trim();
    
    if (!trimmedContent) return false;
    
    const lastSubmission = submissionsRef.current.get(trimmedContent);
    
    // Clean up old submissions (older than window)
    const cutoff = now - windowMs;
    for (const [key, timestamp] of submissionsRef.current.entries()) {
      if (timestamp < cutoff) {
        submissionsRef.current.delete(key);
      }
    }
    
    // Check if this content was submitted recently
    if (lastSubmission && (now - lastSubmission) < windowMs) {
      return false;
    }
    
    return true;
  }, [windowMs]);

  const recordSubmission = useCallback((content: string): void => {
    const trimmedContent = content.trim();
    if (trimmedContent) {
      submissionsRef.current.set(trimmedContent, Date.now());
    }
  }, []);

  return { canSubmit, recordSubmission };
}