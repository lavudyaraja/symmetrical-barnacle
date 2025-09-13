import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Comments } from "../comments";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PostProps, PostState, PostHandlers } from "./types";
import { generatePostUrl, generateShareText } from "./utils";
import { PostHeader } from "./PostHeader";
import { PostContent } from "./PostContent";
import { PostActions } from "./PostActions";
import { PostModals } from "./PostModals";

export function Post({ 
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
  onDelete
}: PostProps) {
  const { user } = useAuth();
  
  // State
  const [state, setState] = useState<PostState>({
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
  });

  // Check if current user owns this post
  const isOwner = user && (user.id === userId || user.email === username);

  // Generate URLs and share text
  const postUrl = generatePostUrl(id);
  const shareText = generateShareText(username, content);

  // Handlers
  const handleLike = useCallback(async () => {
    if (!user || state.loading) return;
    
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      if (state.isLiked) {
        // Remove like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', id);

        if (error) throw error;
        
        setState(prev => ({ 
          ...prev, 
          isLiked: false, 
          likes: prev.likes - 1 
        }));
      } else {
        // Add like
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            post_id: id
          });

        if (error) throw error;
        
        setState(prev => ({ 
          ...prev, 
          isLiked: true, 
          likes: prev.likes + 1 
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
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
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', id);

        if (error) throw error;
        
        setState(prev => ({ ...prev, isBookmarked: false }));
        toast.success('Removed from bookmarks');
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            post_id: id
          });

        if (error) throw error;
        
        setState(prev => ({ ...prev, isBookmarked: true }));
        toast.success('Added to bookmarks');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user, state.loading, state.isBookmarked, id]);

  const handleShare = useCallback(async () => {
    setState(prev => ({ ...prev, showShareDialog: true }));
  }, []);

  const handleCopyContent = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Post content copied to clipboard!');
    } catch (error) {
      console.error('Error copying content:', error);
      toast.error('Failed to copy content');
    }
  }, [content]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      toast.success('Post link copied to clipboard!');
    } catch (error) {
      console.error('Error copying link:', error);
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
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Double-check ownership

      if (error) throw error;

      toast.success('Post deleted successfully!');
      onDelete?.(id);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    } finally {
      setState(prev => ({ 
        ...prev, 
        isDeleting: false, 
        showDeleteDialog: false 
      }));
    }
  }, [isOwner, id, user, onDelete]);

  const handleEdit = useCallback(() => {
    // For now, just copy content for editing
    handleCopyContent();
    toast.info('Content copied! You can create a new post with this content.');
  }, [handleCopyContent]);

  const handleImageClick = useCallback(() => {
    if (!state.imageError) {
      setState(prev => ({ ...prev, showImageModal: true }));
    }
  }, [state.imageError]);

  const handleImageLoad = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      imageLoading: false, 
      imageError: false 
    }));
  }, []);

  const handleImageError = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      imageLoading: false, 
      imageError: true 
    }));
  }, []);

  const handleImageModalClose = useCallback(() => {
    setState(prev => ({ ...prev, showImageModal: false }));
  }, []);

  const handleDownloadImage = useCallback(async () => {
    if (!image) return;
    
    // Determine if the media is a video
    const isVideo = media_type === 'video' || (
      !media_type && image && 
      ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v']
        .some(ext => image.toLowerCase().includes(ext))
    );
    
    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vibe-creator-${isVideo ? 'video' : 'image'}-${id}.${isVideo ? 'mp4' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`${isVideo ? 'Video' : 'Image'} downloaded successfully!`);
    } catch (error) {
      console.error('Error downloading media:', error);
      toast.error(`Failed to download ${media_type === 'video' || (!media_type && image?.includes('.mp4')) ? 'video' : 'image'}`);
    }
  }, [image, id, media_type]);

  const setShowComments = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showComments: show }));
  }, []);

  const setShowDeleteDialog = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showDeleteDialog: show }));
  }, []);

  const setShowShareDialog = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showShareDialog: show }));
  }, []);

  const setShowImageModal = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showImageModal: show }));
  }, []);

  // Create handlers object
  const handlers: PostHandlers = {
    handleLike,
    handleBookmark,
    handleShare,
    handleCopyContent,
    handleCopyLink,
    handleDelete,
    handleEdit,
    handleImageClick,
    handleImageLoad,
    handleImageError,
    handleImageModalClose,
    handleDownloadImage,
    setShowComments,
    setShowDeleteDialog,
    setShowShareDialog,
    setShowImageModal,
  };

  // Handle keyboard events for image modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (state.showImageModal && event.key === 'Escape') {
        handleImageModalClose();
      }
    };

    if (state.showImageModal) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [state.showImageModal, handleImageModalClose]);

  const postProps: PostProps = {
    id,
    username,
    avatar,
    timeAgo,
    content,
    image,
    likes: initialLikes,
    comments,
    isLiked: initialIsLiked,
    isBookmarked: initialIsBookmarked,
    commentsCount,
    userId,
    onDelete
  };

  return (
    <Card className="glass-card p-6 mb-6 transition-all duration-300 hover:shadow-lg">
      <PostHeader post={postProps} handlers={handlers} isOwner={!!isOwner} />
      <PostContent post={postProps} state={state} handlers={handlers} />
      <PostActions post={postProps} state={state} handlers={handlers} />

      <Comments 
        postId={id}
        isOpen={state.showComments}
        onClose={() => setShowComments(false)}
      />

      <PostModals post={postProps} state={state} handlers={handlers} />
    </Card>
  );
}