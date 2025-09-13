/**
 * Utility functions for formatting time and dates
 */

/**
 * Format a timestamp into a human-readable "time ago" format
 */
export function formatTimeAgo(timestamp: string | Date): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w`;
    
    // For older posts, show actual date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'unknown';
  }
}

/**
 * Format a timestamp into a full date string
 */
export function formatFullDate(timestamp: string | Date): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting full date:', error);
    return 'Invalid date';
  }
}

/**
 * Check if a timestamp is from today
 */
export function isToday(timestamp: string | Date): boolean {
  try {
    const date = new Date(timestamp);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  } catch {
    return false;
  }
}

/**
 * Check if a timestamp is from this week
 */
export function isThisWeek(timestamp: string | Date): boolean {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    return diffInDays < 7;
  } catch {
    return false;
  }
}