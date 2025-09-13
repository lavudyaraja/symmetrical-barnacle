import { MessageCircle, Share2, Copy, ExternalLink, X, Download, Heart, Share, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PostProps, PostState, PostHandlers } from "./types";
import { formatTimeAgo, generatePostUrl, generateShareText } from "./utils";
import { toast } from "sonner";
import { useState, useRef } from "react";

interface PostModalsProps {
  post: PostProps;
  state: PostState;
  handlers: PostHandlers;
}

export function PostModals({ post, state, handlers }: PostModalsProps) {
  const { id, username, avatar, timeAgo, content, image, media_type } = post;
  const { 
    showDeleteDialog, 
    isDeleting, 
    showShareDialog, 
    showImageModal,
    isLiked,
    likes,
    loading,
    actualCommentsCount
  } = state;

  const postUrl = generatePostUrl(id);
  const shareText = generateShareText(username, content);

  // Video controls state
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Determine if the media is a video
  const isVideo = media_type === 'video' || (
    !media_type && image && 
    ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v']
      .some(ext => image.toLowerCase().includes(ext))
  );

  // Toggle video mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  // Share handlers
  const shareToWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + postUrl)}`;
    window.open(whatsappUrl, '_blank');
    toast.success('Shared to WhatsApp!');
    handlers.setShowShareDialog(false);
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`;
    window.open(twitterUrl, '_blank');
    toast.success('Shared to Twitter!');
    handlers.setShowShareDialog(false);
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookUrl, '_blank');
    toast.success('Shared to Facebook!');
    handlers.setShowShareDialog(false);
  };

  const shareToLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}&title=${encodeURIComponent(`${username}'s post`)}&summary=${encodeURIComponent(content.substring(0, 200))}`;
    window.open(linkedinUrl, '_blank');
    toast.success('Shared to LinkedIn!');
    handlers.setShowShareDialog(false);
  };

  const shareToTelegram = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank');
    toast.success('Shared to Telegram!');
    handlers.setShowShareDialog(false);
  };

  const shareViaEmail = () => {
    const emailUrl = `mailto:?subject=${encodeURIComponent(`Check out ${username}'s post`)}&body=${encodeURIComponent(shareText + '\n\n' + postUrl)}`;
    window.location.href = emailUrl;
    toast.success('Opening email client...');
    handlers.setShowShareDialog(false);
  };

  const shareViaNative = async () => {
    try {
      const shareData = {
        title: `${username}'s post`,
        text: shareText,
        url: postUrl,
      };
      
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Post shared successfully!');
        handlers.setShowShareDialog(false);
      } else {
        // Fallback: copy link to clipboard
        await navigator.clipboard.writeText(postUrl);
        toast.success('Link copied to clipboard!');
        handlers.setShowShareDialog(false);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        try {
          await navigator.clipboard.writeText(postUrl);
          toast.success('Link copied to clipboard!');
        } catch {
          toast.error('Failed to share post');
        }
        handlers.setShowShareDialog(false);
      }
    }
  };

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={handlers.setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handlers.handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={handlers.setShowShareDialog}>
        <DialogContent className="sm:max-w-md max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Share Post</DialogTitle>
            <DialogDescription>
              Choose how you'd like to share this post
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-4">
            {/* Native Share - Show first on mobile */}
            <Button 
              variant="outline" 
              onClick={shareViaNative}
              className="h-12 flex flex-col items-center justify-center gap-1 order-1"
            >
              <Share2 className="h-5 w-5" />
              <span className="text-xs">Share</span>
            </Button>

            {/* WhatsApp */}
            <Button 
              variant="outline" 
              onClick={shareToWhatsApp}
              className="h-12 flex flex-col items-center justify-center gap-1 text-green-600 hover:bg-green-50 order-2"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs">WhatsApp</span>
            </Button>

            {/* Copy Link - Show prominently */}
            <Button 
              variant="outline" 
              onClick={handlers.handleCopyLink}
              className="h-12 flex flex-col items-center justify-center gap-1 text-gray-600 hover:bg-gray-50 order-3"
            >
              <Copy className="h-5 w-5" />
              <span className="text-xs">Copy Link</span>
            </Button>

            {/* Twitter */}
            <Button 
              variant="outline" 
              onClick={shareToTwitter}
              className="h-12 flex flex-col items-center justify-center gap-1 text-blue-500 hover:bg-blue-50 order-4"
            >
              <Share className="h-5 w-5" />
              <span className="text-xs">Twitter</span>
            </Button>

            {/* Facebook */}
            <Button 
              variant="outline" 
              onClick={shareToFacebook}
              className="h-12 flex flex-col items-center justify-center gap-1 text-blue-700 hover:bg-blue-50 order-5"
            >
              <Share className="h-5 w-5" />
              <span className="text-xs">Facebook</span>
            </Button>

            {/* Telegram */}
            <Button 
              variant="outline" 
              onClick={shareToTelegram}
              className="h-12 flex flex-col items-center justify-center gap-1 text-blue-400 hover:bg-blue-50 order-6"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs">Telegram</span>
            </Button>

            {/* LinkedIn */}
            <Button 
              variant="outline" 
              onClick={shareToLinkedIn}
              className="h-12 flex flex-col items-center justify-center gap-1 text-blue-800 hover:bg-blue-50 order-7 sm:order-5"
            >
              <ExternalLink className="h-5 w-5" />
              <span className="text-xs">LinkedIn</span>
            </Button>

            {/* Email */}
            <Button 
              variant="outline" 
              onClick={shareViaEmail}
              className="h-12 flex flex-col items-center justify-center gap-1 text-gray-600 hover:bg-gray-50 order-8 sm:order-6"
            >
              <ExternalLink className="h-5 w-5" />
              <span className="text-xs">Email</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Media Modal (Image/Video) */}
      {image && (
        <Dialog open={showImageModal} onOpenChange={handlers.setShowImageModal}>
          <DialogContent className="max-w-[300px] max-h-[600px] p-0 overflow-hidden bg-black/95 border-0">
            <div className="relative w-full h-full">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 sm:top-2 sm:right-2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm"
                onClick={handlers.handleImageModalClose}
              >
                <X className="h-4 w-4" />
              </Button>
              
              {/* Download button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-9 sm:top-2 sm:right-10 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm"
                onClick={handlers.handleDownloadImage}
                title={`Download ${isVideo ? 'video' : 'image'}`}
              >
                <Download className="h-4 w-4" />
              </Button>
              
              {/* Volume control button - only show for videos */}
              {isVideo && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-17 sm:top-2 sm:right-18 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm"
                  onClick={toggleMute}
                  title={isMuted ? 'Unmute video' : 'Mute video'}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              )}
              
              {/* Media container */}
              <div 
                className="flex items-center justify-center p-4 cursor-pointer"
                onClick={handlers.handleImageModalClose}
              >
                {isVideo ? (
                  <video
                    ref={videoRef}
                    src={image}
                    className="w-80 h-100 object-cover rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={() => {
                      // Set initial mute state based on video  
                      if (videoRef.current) {
                        setIsMuted(videoRef.current.muted);
                        // Start with audio enabled for modal videos
                        videoRef.current.muted = false;
                        setIsMuted(false);
                      }
                    }}
                  />
                ) : (
                  <img
                    src={image}
                    alt="Full size post image"
                    className="w-80 h-100 object-cover rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                    loading="lazy"
                  />
                )}
              </div>
              
              {/* Media info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3">
                <div className="text-white max-w-sm mx-auto">
                  <div className="flex items-center space-x-3 mb-2">
                    <Avatar className="h-8 w-8 ring-2 ring-white/20">
                      <AvatarImage src={avatar} alt={username} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{username}</p>
                      <p className="text-xs text-gray-300">{formatTimeAgo(timeAgo)}</p>
                    </div>
                    {/* Media type indicator */}
                    {isVideo && (
                      <div className="ml-auto bg-red-600/80 rounded px-2 py-1 text-xs font-medium flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        VIDEO
                      </div>
                    )}
                  </div>
                  <p className="leading-relaxed text-gray-100 text-sm mb-3">{content}</p>
                  
                  {/* Action buttons in modal */}
                  <div className="flex items-center justify-center space-x-3 pt-2 border-t border-white/20">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlers.handleLike();
                      }}
                      disabled={loading}
                      className={`text-white hover:bg-white/20 h-8 ${isLiked ? 'text-red-400' : ''}`}
                    >
                      <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                      <span className="text-sm">{likes}</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlers.setShowComments(true);
                        handlers.handleImageModalClose();
                      }}
                      className="text-white hover:bg-white/20 h-8"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm">{actualCommentsCount || post.comments}</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlers.handleShare();
                        handlers.handleImageModalClose();
                      }}
                      className="text-white hover:bg-white/20 h-8"
                    >
                      <Share className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Tap to close hint */}
              <div className="absolute top-2 left-2 sm:top-4 sm:left-4 text-white/70 text-xs bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                <span className="hidden sm:inline">Tap to close or press ESC</span>
                <span className="sm:hidden">Tap to close</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}