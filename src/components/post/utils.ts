// Format time properly
export const formatTimeAgo = (timeString: string) => {
  try {
    const date = new Date(timeString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    // For older posts, show actual date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  } catch {
    return timeString; // Fallback to original timeAgo if parsing fails
  }
};

// Generate proper post URL
export const generatePostUrl = (postId: string) => {
  return `${window.location.origin}/post/${postId}`;
};

// Generate share text
export const generateShareText = (username: string, content: string) => {
  return `Check out this post by ${username}: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`;
};

// Enhanced utility functions
export const calculateEngagementRate = (likes: number, comments: number, shares: number, views: number): number => {
  if (views === 0) return 0;
  return ((likes + comments + shares) / views) * 100;
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const getPostPriority = (engagement: { impressions: number; clickThroughRate: number }, isPromoted: boolean, isPinned: boolean): 'low' | 'normal' | 'high' | 'featured' => {
  if (isPinned || isPromoted) return 'featured';
  if (engagement.impressions > 10000 && engagement.clickThroughRate > 5) return 'high';
  if (engagement.impressions < 100 || engagement.clickThroughRate < 1) return 'low';
  return 'normal';
};

export const extractHashtags = (content: string): string[] => {
  const hashtagRegex = /#([\w]+)/g;
  const matches = content.match(hashtagRegex);
  return matches ? matches.map(tag => tag.substring(1)) : [];
};

export const separateContentAndHashtags = (content: string): { cleanContent: string; hashtags: string[] } => {
  // First extract all hashtags
  const hashtags = extractHashtags(content);
  
  // If no hashtags found, return original content
  if (hashtags.length === 0) {
    return {
      cleanContent: content,
      hashtags: []
    };
  }
  
  // Remove all hashtags from content using a more reliable method
  let cleanContent = content;
  
  // Sort hashtags by length (longest first) to avoid partial replacements
  const sortedHashtags = [...hashtags].sort((a, b) => b.length - a.length);
  
  // Remove each hashtag with its # symbol
  sortedHashtags.forEach(tag => {
    const hashtagWithSymbol = `#${tag}`;
    // Use split and join for exact string replacement
    cleanContent = cleanContent.split(hashtagWithSymbol).join('');
  });
  
  // Clean up extra whitespace and trim
  cleanContent = cleanContent
    .replace(/\s+/g, ' ')
    .trim();
  
  return {
    cleanContent,
    hashtags
  };
};

export const extractMentions = (content: string): string[] => {
  const mentionRegex = /@([\w]+)/g;
  const matches = content.match(mentionRegex);
  return matches ? matches.map(mention => mention.substring(1)) : [];
};

export const estimateReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const words = content.split(' ').length;
  return Math.ceil(words / wordsPerMinute);
};

export const sanitizeContent = (content: string): string => {
  // Basic sanitization - remove potentially harmful content
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
};

export const generatePostSlug = (content: string, id: string): string => {
  const words = content.split(' ').slice(0, 5).join('-');
  const slug = words.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  return `${slug}-${id.slice(0, 8)}`;
};

export const isPostTrending = (likes: number, comments: number, shares: number, timeAgo: string): boolean => {
  const date = new Date(timeAgo);
  const hoursOld = (Date.now() - date.getTime()) / (1000 * 60 * 60);
  
  // Consider trending if high engagement within last 24 hours
  if (hoursOld > 24) return false;
  
  const totalEngagement = likes + comments + shares;
  const engagementPerHour = totalEngagement / Math.max(hoursOld, 1);
  
  return engagementPerHour > 10; // Threshold for trending
};