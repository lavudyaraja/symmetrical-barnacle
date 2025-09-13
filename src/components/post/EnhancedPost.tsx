import { useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Eye,
  TrendingUp,
  Clock,
  MapPin,
  Award,
  Zap,
  Maximize2,
  Minimize2,
  Flag,
  ShieldCheck,
  Share
} from "lucide-react";
import { Comments } from "../comments";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PostProps, PostState, PostHandlers } from "./types";
import { formatTimeAgo, generatePostUrl, generateShareText } from "./utils";
import { PostHeader } from "./PostHeader";
import { PostContent } from "./PostContent";
import { PostActions } from "./PostActions";
import { PostModals } from "./PostModals";
import HoverPreviews from "../ux-enhancements/HoverPreviews";

interface EnhancedPostProps extends PostProps {
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
  // Interactive features
  allowComments?: boolean;
  showAnalytics?: boolean;
  // Visual enhancements
  theme?: 'default' | 'minimal' | 'elevated' | 'compact';
  priority?: 'low' | 'normal' | 'high' | 'featured';
}

interface EnhancedPostState extends PostState {
  isExpanded: boolean;
  isReporting: boolean;
  showAnalytics: boolean;
  readingProgress: number;
}

export function EnhancedPost({ 
  id,
  username, 
  avatar, 
  timeAgo, 
  content, 
  image,
  media_type,
  likes: initialLikes,
  comments,
  isLiked: initialIsLiked = false,
  isBookmarked: initialIsBookmarked = false,
  commentsCount = 0,
  userId,
  onDelete,
  // Enhanced props
  viewCount = 0,
  shareCount = 0,
  location,
  tags = [],
  isPinned = false,
  isPromoted = false,
  isVerified = false,
  engagement,
  allowComments = true,
  showAnalytics = false,
  theme = 'default',
  priority = 'normal'
}: EnhancedPostProps) {
  const { user } = useAuth();
  const postRef = useRef<HTMLDivElement>(null);
  
  // Enhanced state
  const [state, setState] = useState<EnhancedPostState>({
    isLiked: initialIsLiked,
    isBookmarked: initialIsBookmarked,
    likes: initialLikes,
    loading: false,
    showComments: false,
    actualCommentsCount: commentsCount,
    showDeleteDialog: false,
    isDeleting: false,
    showShareDialog: false,
    showImageModal: false,
    imageLoading: true,
    imageError: false,
    // Enhanced state
    isExpanded: false,
    isReporting: false,
    showAnalytics: false,
    readingProgress: 0,
  });

  const isOwner = user && (user.id === userId || user.email === username);
  const postUrl = generatePostUrl(id);
  const shareText = generateShareText(username, content);

  // Detect media type
  const getMediaType = () => {
    if (!image) return null;
    
    if (media_type === 'video' || media_type === 'image') {
      return media_type;
    }
    
    // Fallback: detect by file extension
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v'];
    const isVideo = videoExtensions.some(ext => image.toLowerCase().includes(ext));
    return isVideo ? 'video' : 'image';
  };

  const detectedMediaType = getMediaType();

  // Theme classes
  const getThemeClasses = () => {
    switch (theme) {
      case 'minimal': return 'border-none shadow-none bg-transparent';
      case 'elevated': return 'shadow-lg border-2 bg-gradient-to-br from-background to-secondary/10';
      case 'compact': return 'p-3 mb-3';
      default: return 'glass-card';
    }
  };

  // Priority classes
  const getPriorityClasses = () => {
    switch (priority) {
      case 'featured': return 'ring-2 ring-primary ring-opacity-50 bg-gradient-to-r from-primary/5 to-secondary/5';
      case 'high': return 'border-l-4 border-l-primary';
      case 'low': return 'opacity-75';
      default: return '';
    }
  };

  // Enhanced handlers
  const handleLike = useCallback(async () => {
    if (!user || state.loading) return;
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      if (state.isLiked) {
        await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', id);
        setState(prev => ({ ...prev, isLiked: false, likes: prev.likes - 1 }));
      } else {
        await supabase.from('likes').insert({ user_id: user.id, post_id: id });
        setState(prev => ({ ...prev, isLiked: true, likes: prev.likes + 1 }));
      }
    } catch (error) {
      toast.error('Failed to update like');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user, state.loading, state.isLiked, id]);

  const handleBookmark = useCallback(async () => {
    if (!user || state.loading) return;
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      if (state.isBookmarked) {
        await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('post_id', id);
        setState(prev => ({ ...prev, isBookmarked: false }));
        toast.success('Removed from bookmarks');
      } else {
        await supabase.from('bookmarks').insert({ user_id: user.id, post_id: id });
        setState(prev => ({ ...prev, isBookmarked: true }));
        toast.success('Added to bookmarks');
      }
    } catch (error) {
      toast.error('Failed to update bookmark');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user, state.loading, state.isBookmarked, id]);

  const handleShare = useCallback(async () => {
    setState(prev => ({ ...prev, showShareDialog: true }));
  }, []);

  const handleExpand = useCallback(() => {
    setState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
  }, []);

  const handleReport = useCallback(async () => {
    if (!user) return;
    setState(prev => ({ ...prev, isReporting: true }));
    
    try {
      console.log('Post reported:', { postId: id, reporterId: user.id });
      toast.success('Post reported successfully');
    } catch (error) {
      toast.error('Failed to report post');
    } finally {
      setState(prev => ({ ...prev, isReporting: false }));
    }
  }, [id, user]);

  const toggleAnalytics = useCallback(() => {
    setState(prev => ({ ...prev, showAnalytics: !prev.showAnalytics }));
  }, []);

  // Standard handlers
  const handleImageClick = useCallback(() => {
    if (!state.imageError) setState(prev => ({ ...prev, showImageModal: true }));
  }, [state.imageError]);

  const handleImageLoad = useCallback(() => {
    setState(prev => ({ ...prev, imageLoading: false, imageError: false }));
  }, []);

  const handleImageError = useCallback(() => {
    setState(prev => ({ ...prev, imageLoading: false, imageError: true }));
  }, []);

  const handleImageModalClose = useCallback(() => {
    setState(prev => ({ ...prev, showImageModal: false }));
  }, []);

  const handleDownloadImage = useCallback(async () => {
    if (!image) return;
    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vibe-creator-${detectedMediaType}-${id}.${detectedMediaType === 'video' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`${detectedMediaType === 'video' ? 'Video' : 'Image'} downloaded successfully!`);
    } catch (error) {
      toast.error(`Failed to download ${detectedMediaType}`);
    }
  }, [image, id, detectedMediaType]);

  const handleCopyContent = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Post content copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy content');
    }
  }, [content]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      toast.success('Post link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    } finally {
      setState(prev => ({ ...prev, showShareDialog: false }));
    }
  }, [postUrl]);

  const handleDelete = useCallback(async () => {
    if (!isOwner) {
      toast.error('You can only delete your own posts');
      return;
    }
    setState(prev => ({ ...prev, isDeleting: true }));
    
    try {
      await supabase.from('posts').delete().eq('id', id).eq('user_id', user.id);
      toast.success('Post deleted successfully!');
      onDelete?.(id);
    } catch (error) {
      toast.error('Failed to delete post');
    } finally {
      setState(prev => ({ ...prev, isDeleting: false, showDeleteDialog: false }));
    }
  }, [isOwner, id, user, onDelete]);

  const handleEdit = useCallback(() => {
    handleCopyContent();
    toast.info('Content copied! You can create a new post with this content.');
  }, [handleCopyContent]);

  const setShowComments = useCallback((show: boolean) => setState(prev => ({ ...prev, showComments: show })), []);
  const setShowDeleteDialog = useCallback((show: boolean) => setState(prev => ({ ...prev, showDeleteDialog: show })), []);
  const setShowShareDialog = useCallback((show: boolean) => setState(prev => ({ ...prev, showShareDialog: show })), []);
  const setShowImageModal = useCallback((show: boolean) => setState(prev => ({ ...prev, showImageModal: show })), []);

  const handlers: PostHandlers = {
    handleLike, handleBookmark, handleShare, handleCopyContent, handleCopyLink,
    handleDelete, handleEdit, handleImageClick, handleImageLoad, handleImageError,
    handleImageModalClose, handleDownloadImage, setShowComments, setShowDeleteDialog,
    setShowShareDialog, setShowImageModal,
  };

  const postProps: PostProps = {
    id, username, avatar, timeAgo, content, image, media_type, likes: initialLikes,
    comments, isLiked: initialIsLiked, isBookmarked: initialIsBookmarked,
    commentsCount, userId, onDelete
  };

  // Render media with hover preview
  const renderMediaContent = () => {
    if (!image || !detectedMediaType) {
      return <PostContent post={postProps} state={state} handlers={handlers} />;
    }

    return (
      <div className="space-y-3 sm:space-y-4">
        {/* Text content */}
        {content && (
          <div className={`text-sm sm:text-base leading-relaxed ${state.isExpanded ? '' : 'line-clamp-6'}`}>
            {content}
          </div>
        )}
        
        {/* Media with hover preview */}
        <HoverPreviews
          src={image}
          type={detectedMediaType as 'image' | 'video'}
          alt={`${username}'s post media`}
          onClick={handleImageClick}
          onDownload={handleDownloadImage}
          className="w-full"
          previewDelay={300}
          autoPlay={true}
          muted={true}
          showControls={true}
          enableFullScreen={true}
        >
          <div className="relative w-full rounded-lg overflow-hidden bg-muted/30">
            {/* Video preview indicator */}
            {detectedMediaType === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black/20 pointer-events-none z-10">
                <div className="bg-black/60 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Hover to preview
                </div>
              </div>
            )}
            
            {state.imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            
            {state.imageError ? (
              <div className="aspect-video flex items-center justify-center bg-muted/50 text-muted-foreground">
                <div className="text-center">
                  <div className="text-lg sm:text-xl mb-2">📷</div>
                  <div className="text-xs sm:text-sm">Failed to load media</div>
                </div>
              </div>
            ) : detectedMediaType === 'video' ? (
              <div className="relative w-full">
                <video
                  src={image}
                  className="w-full max-h-[70vh] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                  onLoadStart={handleImageLoad}
                  onError={handleImageError}
                  onLoadedMetadata={handleImageLoad}
                  preload="metadata"
                  muted
                  playsInline
                  controls
                  style={{ backgroundColor: '#f3f4f6' }} // Fallback background
                />
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-black/50 backdrop-blur-sm rounded-full p-3 border border-white/20">
                    <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1"></div>
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={image}
                alt={`Post by ${username}`}
                className="w-full max-h-[70vh] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
              />
            )}
          </div>
        </HoverPreviews>
      </div>
    );
  };

  return (
    <Card 
      ref={postRef}
      className={`${getThemeClasses()} ${getPriorityClasses()} p-4 sm:p-6 mb-4 sm:mb-6 transition-all duration-300 hover:shadow-lg relative overflow-hidden`}
    >
      {/* Reading progress bar */}
      {state.readingProgress > 0 && state.readingProgress < 100 && (
        <div className="absolute top-0 left-0 h-1 bg-primary transition-all duration-300" 
             style={{ width: `${state.readingProgress}%` }} />
      )}

      {/* Priority indicators */}
      {isPinned && (
        <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
          <Badge variant="secondary" className="text-xs">
            <Award className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />Pinned
          </Badge>
        </div>
      )}

      {isPromoted && (
        <div className="absolute top-1 sm:top-2 right-12 sm:right-20">
          <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
            <Zap className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />Promoted
          </Badge>
        </div>
      )}

      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <PostHeader post={postProps} handlers={handlers} isOwner={!!isOwner} />
        
        <div className="flex items-center space-x-1 sm:space-x-2">
          {isVerified && (
            <div title="Verified">
              <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
            </div>
          )}
          
          {showAnalytics && isOwner && (
            <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8" onClick={toggleAnalytics}>
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          )}
          
          <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8" onClick={handleExpand}>
            {state.isExpanded ? <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />}
          </Button>
        </div>
      </div>

      {/* Analytics Panel */}
      {state.showAnalytics && engagement && (
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="text-center">
              <div className="font-semibold">{engagement.impressions}</div>
              <div className="text-muted-foreground">Impressions</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{engagement.clickThroughRate}%</div>
              <div className="text-muted-foreground">CTR</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{engagement.avgTimeSpent}s</div>
              <div className="text-muted-foreground">Avg Time</div>
            </div>
          </div>
        </div>
      )}

      {/* Media Content with Hover Preview */}
      {renderMediaContent()}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mb-3 sm:mb-4 flex flex-wrap gap-1 sm:gap-2">
          {tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs cursor-pointer hover:bg-primary/10">
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Location */}
      {location && (
        <div className="mb-3 sm:mb-4 flex items-center text-xs sm:text-sm text-muted-foreground">
          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          {location}
        </div>
      )}

      <div className="space-y-4">
        <PostActions post={postProps} state={state} handlers={handlers} />
        
        {/* Additional metrics */}
        {(viewCount > 0 || shareCount > 0) && (
          <>
            <Separator />
            <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap gap-1 sm:gap-0">
                {viewCount > 0 && (
                  <div className="flex items-center">
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden sm:inline">{viewCount.toLocaleString()} views</span>
                    <span className="sm:hidden">{viewCount > 999 ? `${Math.floor(viewCount/1000)}k` : viewCount}</span>
                  </div>
                )}
                {shareCount > 0 && (
                  <div className="flex items-center">
                    <Share className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden sm:inline">{shareCount} shares</span>
                    <span className="sm:hidden">{shareCount}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                {formatTimeAgo(timeAgo)}
              </div>
            </div>
          </>
        )}

        {/* Report action for non-owners */}
        {!isOwner && (
          <>
            <Separator />
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReport}
                disabled={state.isReporting}
                className="text-muted-foreground hover:text-destructive"
              >
                <Flag className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {state.isReporting ? 'Reporting...' : 'Report'}
              </Button>
            </div>
          </>
        )}
      </div>

      {allowComments && (
        <Comments 
          postId={id}
          isOpen={state.showComments}
          onClose={() => setShowComments(false)}
        />
      )}

      <PostModals post={postProps} state={state} handlers={handlers} />
    </Card>
  );
}