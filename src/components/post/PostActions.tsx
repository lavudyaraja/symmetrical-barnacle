import { Heart, MessageCircle, Share, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostProps, PostState, PostHandlers } from "./types";

interface PostActionsProps {
  post: PostProps;
  state: PostState;
  handlers: PostHandlers;
}

export function PostActions({ post, state, handlers }: PostActionsProps) {
  const { content, comments } = post;
  const { isLiked, isBookmarked, likes, loading, actualCommentsCount } = state;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlers.handleLike}
          disabled={loading}
          className={`animate-heart ${isLiked ? 'liked' : ''} hover:bg-accent`}
        >
          <Heart 
            className={`h-5 w-5 mr-1 ${isLiked ? 'fill-like-red text-like-red' : ''}`} 
          />
          <span className={isLiked ? 'text-like-red font-semibold' : ''}>{likes}</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="hover:bg-accent"
          onClick={() => handlers.setShowComments(true)}
        >
          <MessageCircle className="h-5 w-5 mr-1" />
          {actualCommentsCount || comments}
        </Button>
        
        <Button variant="ghost" size="sm" className="hover:bg-accent" onClick={handlers.handleShare}>
          <Share className="h-5 w-5" />
        </Button>
      </div>

      <Button
        variant="ghost" 
        size="icon" 
        onClick={handlers.handleBookmark}
        disabled={loading}
        className={`text-muted-foreground hover:text-foreground ${isBookmarked ? 'text-yellow-500' : ''}`}
      >
        <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
      </Button>
    </div>
  );
}