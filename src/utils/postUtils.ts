/**
 * Utility functions for post management to prevent duplicates
 */

export interface PostData {
  id: string;
  content: string;
  image_url: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
  likes: { user_id: string }[];
  bookmarks: { user_id: string }[];
  _count: { likes: number; comments: number };
}

/**
 * Remove duplicate posts from an array based on ID
 */
export function removeDuplicatePosts(posts: PostData[]): PostData[] {
  const seenIds = new Set<string>();
  return posts.filter(post => {
    if (seenIds.has(post.id)) {
      return false;
    }
    seenIds.add(post.id);
    return true;
  });
}

/**
 * Merge new posts with existing posts, avoiding duplicates
 */
export function mergePosts(existingPosts: PostData[], newPosts: PostData[]): PostData[] {
  const existingIds = new Set(existingPosts.map(post => post.id));
  const uniqueNewPosts = newPosts.filter(post => !existingIds.has(post.id));
  return [...existingPosts, ...uniqueNewPosts];
}

/**
 * Check if two posts are likely duplicates (same content, user, similar timestamp)
 */
export function arePostsSimilar(post1: PostData, post2: PostData): boolean {
  if (post1.id === post2.id) return true;
  
  // Check if same user and same content
  if (post1.user_id === post2.user_id && post1.content.trim() === post2.content.trim()) {
    // Check if created within 5 minutes of each other
    const timeDiff = Math.abs(
      new Date(post1.created_at).getTime() - new Date(post2.created_at).getTime()
    );
    return timeDiff < 5 * 60 * 1000; // 5 minutes
  }
  
  return false;
}

/**
 * Clean up potential duplicate posts from an array
 */
export function cleanupDuplicatePosts(posts: PostData[]): PostData[] {
  const cleaned: PostData[] = [];
  
  for (const post of posts) {
    const isDuplicate = cleaned.some(existingPost => arePostsSimilar(post, existingPost));
    if (!isDuplicate) {
      cleaned.push(post);
    }
  }
  
  return cleaned;
}

/**
 * Throttle function to prevent rapid successive calls
 */
export function createThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastCallTime = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCallTime >= delay) {
      lastCallTime = now;
      func(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        func(...args);
        timeoutId = null;
      }, delay - (now - lastCallTime));
    }
  };
}