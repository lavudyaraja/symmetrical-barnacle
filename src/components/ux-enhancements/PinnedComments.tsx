import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Pin, PinOff, ArrowUp, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar_url?: string;
    full_name?: string;
  };
  created_at: string;
  likes_count?: number;
  is_helpful?: boolean;
}

interface PinnedCommentsProps {
  postId: string;
  comments: Comment[];
  pinnedCommentIds: string[];
  currentUserId: string;
  postAuthorId: string;
  onPinComment?: (commentId: string) => void;
  onUnpinComment?: (commentId: string) => void;
  maxPinnedComments?: number;
  className?: string;
}

const PinnedComments: React.FC<PinnedCommentsProps> = ({
  postId,
  comments,
  pinnedCommentIds,
  currentUserId,
  postAuthorId,
  onPinComment,
  onUnpinComment,
  maxPinnedComments = 3,
  className = ''
}) => {
  const [showPinActions, setShowPinActions] = useState<string | null>(null);

  const isPostAuthor = currentUserId === postAuthorId;
  const pinnedComments = comments.filter(comment => 
    pinnedCommentIds.includes(comment.id)
  );
  const unpinnedComments = comments.filter(comment => 
    !pinnedCommentIds.includes(comment.id)
  );

  const canPinMoreComments = pinnedComments.length < maxPinnedComments;

  const handlePinComment = (commentId: string) => {
    if (!canPinMoreComments) {
      return;
    }
    onPinComment?.(commentId);
    setShowPinActions(null);
  };

  const handleUnpinComment = (commentId: string) => {
    onUnpinComment?.(commentId);
    setShowPinActions(null);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const renderComment = (comment: Comment, isPinned = false) => (
    <Card 
      key={comment.id}
      className={cn(
        "relative",
        isPinned && "border-primary/30 bg-primary/5",
        className
      )}
    >
      <CardContent className="p-3">
        {/* Pinned indicator */}
        {isPinned && (
          <div className="flex items-center gap-1 mb-2">
            <Pin size={14} className="text-primary" />
            <Badge variant="outline" className="text-xs">
              Pinned by author
            </Badge>
          </div>
        )}

        {/* Comment header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-medium">
                {comment.author.full_name?.[0] || comment.author.username[0]}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">{comment.author.full_name || comment.author.username}</p>
              <p className="text-xs text-muted-foreground">@{comment.author.username}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(comment.created_at)}
            </span>
            
            {/* Pin/Unpin actions - only show for post author */}
            {isPostAuthor && (
              <div className="relative">
                {isPinned ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnpinComment(comment.id)}
                    className="h-6 w-6 p-0 text-primary"
                    title="Unpin comment"
                  >
                    <PinOff size={14} />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePinComment(comment.id)}
                    disabled={!canPinMoreComments}
                    className="h-6 w-6 p-0"
                    title={canPinMoreComments ? "Pin comment" : `Maximum ${maxPinnedComments} pinned comments`}
                  >
                    <Pin size={14} />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Comment content */}
        <p className="text-sm mb-2">{comment.content}</p>

        {/* Comment meta */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {comment.likes_count && comment.likes_count > 0 && (
            <div className="flex items-center gap-1">
              <ArrowUp size={12} />
              <span>{comment.likes_count} likes</span>
            </div>
          )}
          
          {comment.is_helpful && (
            <div className="flex items-center gap-1">
              <Star size={12} className="text-yellow-500" />
              <span>Helpful</span>
            </div>
          )}
          
          {isPinned && (
            <Badge variant="secondary" className="text-xs">
              <Pin size={10} className="mr-1" />
              Pinned
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Pinned Comments Section */}
      {pinnedComments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Pin size={16} className="text-primary" />
            <h4 className="text-sm font-medium">
              Pinned Comments ({pinnedComments.length})
            </h4>
            {isPostAuthor && (
              <Badge variant="outline" className="text-xs">
                {maxPinnedComments - pinnedComments.length} slots available
              </Badge>
            )}
          </div>
          
          {pinnedComments.map(comment => renderComment(comment, true))}
        </div>
      )}

      {/* Regular Comments */}
      {unpinnedComments.length > 0 && pinnedComments.length > 0 && (
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">
            Other Comments
          </h4>
          {unpinnedComments.slice(0, 5).map(comment => renderComment(comment, false))}
        </div>
      )}

      {/* Show all comments if no pinned comments */}
      {pinnedComments.length === 0 && unpinnedComments.length > 0 && (
        <div className="space-y-2">
          {unpinnedComments.map(comment => renderComment(comment, false))}
        </div>
      )}

      {/* Pin Instructions for Post Author */}
      {isPostAuthor && comments.length > 0 && pinnedComments.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-3 text-center">
            <Pin size={20} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Pin helpful comments to highlight them for other users
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click the pin icon on any comment to pin it
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PinnedComments;