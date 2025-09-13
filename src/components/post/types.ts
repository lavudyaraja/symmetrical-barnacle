export interface PostProps {
  id: string;
  username: string;
  avatar: string;
  timeAgo: string;
  content: string;
  image?: string;
  media_type?: 'image' | 'video';
  likes: number;
  comments: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  commentsCount?: number;
  userId?: string;
  onDelete?: (postId: string) => void;
}

export interface PostState {
  isLiked: boolean;
  isBookmarked: boolean;
  likes: number;
  loading: boolean;
  showComments: boolean;
  actualCommentsCount: number;
  showDeleteDialog: boolean;
  isDeleting: boolean;
  showShareDialog: boolean;
  showImageModal: boolean;
  imageLoading: boolean;
  imageError: boolean;
}

export interface PostHandlers {
  handleLike: () => Promise<void>;
  handleBookmark: () => Promise<void>;
  handleShare: () => Promise<void>;
  handleCopyContent: () => Promise<void>;
  handleCopyLink: () => Promise<void>;
  handleDelete: () => Promise<void>;
  handleEdit: () => void;
  handleImageClick: () => void;
  handleImageLoad: () => void;
  handleImageError: () => void;
  handleImageModalClose: () => void;
  handleDownloadImage: () => Promise<void>;
  setShowComments: (show: boolean) => void;
  setShowDeleteDialog: (show: boolean) => void;
  setShowShareDialog: (show: boolean) => void;
  setShowImageModal: (show: boolean) => void;
}

// Enhanced types for EnhancedPost
export interface EnhancedPostProps extends PostProps {
  // Enhanced features
  viewCount?: number;
  shareCount?: number;
  location?: string;
  tags?: string[];
  isPinned?: boolean;
  isPromoted?: boolean;
  isVerified?: boolean;
  engagement?: {
    impressions: number;
    clickThroughRate: number;
    avgTimeSpent: number;
  };
  metadata?: {
    deviceType?: string;
    platform?: string;
    originalPostId?: string; // For reposts
  };
  // Interactive features
  allowComments?: boolean;
  allowSharing?: boolean;
  isEditable?: boolean;
  autoPlay?: boolean;
  showAnalytics?: boolean;
  // Visual enhancements
  theme?: 'default' | 'minimal' | 'elevated' | 'compact';
  priority?: 'low' | 'normal' | 'high' | 'featured';
}

export interface EnhancedPostState extends PostState {
  isExpanded: boolean;
  isPlaying: boolean;
  viewStartTime: number;
  hasBeenViewed: boolean;
  isReporting: boolean;
  showAnalytics: boolean;
  isAutoPlaying: boolean;
  readingProgress: number;
}

export interface PostAnalytics {
  postId: string;
  userId?: string;
  eventType: 'view' | 'like' | 'share' | 'comment' | 'bookmark' | 'click' | 'share_attempt';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface PostEngagement {
  impressions: number;
  clickThroughRate: number;
  avgTimeSpent: number;
  uniqueViews: number;
  totalShares: number;
  engagementRate: number;
}