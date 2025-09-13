import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, Heart, MessageCircle, Share, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostData {
  id: string;
  content: string;
  author: {
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  image_url?: string;
  created_at: string;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  tags?: string[];
}

interface ContentPreviewSnippetsProps {
  post: PostData;
  maxContentLength?: number;
  showFullContent?: boolean;
  onToggleContent?: () => void;
  onPostClick?: (postId: string) => void;
  className?: string;
  compact?: boolean;
}

const ContentPreviewSnippets: React.FC<ContentPreviewSnippetsProps> = ({
  post,
  maxContentLength = 150,
  showFullContent = false,
  onToggleContent,
  onPostClick,
  className = '',
  compact = false
}) => {
  const isContentTruncated = post.content.length > maxContentLength;
  const displayContent = showFullContent || !isContentTruncated 
    ? post.content 
    : post.content.slice(0, maxContentLength) + '...';

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  const handlePostClick = () => {
    onPostClick?.(post.id);
  };

  const handleToggleContent = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleContent?.();
  };

  if (compact) {
    return (
      <Card 
        className={cn(
          "cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20",
          className
        )}
        onClick={handlePostClick}
      >
        <CardContent className="p-3">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={post.author.avatar_url} />
              <AvatarFallback className="text-xs">
                {post.author.full_name?.[0] || post.author.username[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm truncate">
                  {post.author.full_name || post.author.username}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(post.created_at)}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {displayContent}
              </p>
              
              {isContentTruncated && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleContent}
                  className="h-6 px-2 text-xs text-primary"
                >
                  {showFullContent ? 'Show less' : 'Show more'}
                </Button>
              )}
              
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {post.likes_count && post.likes_count > 0 && (
                  <span className="flex items-center gap-1">
                    <Heart size={12} />
                    {post.likes_count}
                  </span>
                )}
                {post.comments_count && post.comments_count > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageCircle size={12} />
                    {post.comments_count}
                  </span>
                )}
              </div>
            </div>
            
            {post.image_url && (
              <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                <img 
                  src={post.image_url} 
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200",
        className
      )}
      onClick={handlePostClick}
    >
      <CardContent className="p-4">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.avatar_url} />
              <AvatarFallback>
                {post.author.full_name?.[0] || post.author.username[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">
                {post.author.full_name || post.author.username}
              </p>
              <p className="text-xs text-muted-foreground">
                @{post.author.username} • {formatTimeAgo(post.created_at)}
              </p>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal size={16} />
          </Button>
        </div>

        {/* Post Content */}
        <div className="mb-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {displayContent}
          </p>
          
          {isContentTruncated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleContent}
              className="mt-2 h-6 px-2 text-xs text-primary hover:bg-primary/10"
            >
              {showFullContent ? 'Show less' : 'Read more'}
            </Button>
          )}
        </div>

        {/* Post Image */}
        {post.image_url && (
          <div className="mb-3 rounded-lg overflow-hidden">
            <img 
              src={post.image_url} 
              alt=""
              className="w-full max-h-64 object-cover"
            />
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {post.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{post.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Heart size={16} className="mr-1" />
              <span className="text-xs">
                {post.likes_count || 0}
              </span>
            </Button>
            
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <MessageCircle size={16} className="mr-1" />
              <span className="text-xs">
                {post.comments_count || 0}
              </span>
            </Button>
            
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Share size={16} className="mr-1" />
              <span className="text-xs">
                {post.shares_count || 0}
              </span>
            </Button>
          </div>
          
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Bookmark size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentPreviewSnippets;