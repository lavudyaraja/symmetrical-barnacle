import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Heart, MoreHorizontal, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

interface CommentsProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function Comments({ postId, isOpen, onClose }: CommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [showSmartReplies, setShowSmartReplies] = useState(false);

  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
    }
  }, [isOpen, postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Fetch profiles for comments
      const commentsWithProfiles = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('id', comment.user_id)
            .single();
          
          return {
            ...comment,
            profiles: profile || { username: 'Unknown', display_name: 'Unknown User', avatar_url: '' }
          };
        })
      );
      
      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      // Analyze comment content for moderation
      const { data: moderationData, error: moderationError } = await supabase.functions.invoke('ai-content-analysis', {
        body: {
          content: newComment.trim(),
          contentType: 'comment',
          contentId: 'pending'
        }
      });

      if (moderationError) {
        console.warn('Comment moderation failed, proceeding:', moderationError);
      } else if (moderationData?.moderation_status === 'flagged') {
        toast.error("Comment flagged for review. Please revise.");
        return;
      } else if (moderationData?.toxicity_score > 0.7) {
        toast.error("Comment appears inappropriate. Please revise.");
        return;
      }

      const { data: commentData, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Update moderation with actual comment ID
      if (moderationData && commentData) {
        await supabase.functions.invoke('ai-content-analysis', {
          body: {
            content: newComment.trim(),
            contentType: 'comment',
            contentId: commentData.id
          }
        });
      }

      setNewComment("");
      await fetchComments();
      
      if (moderationData?.moderation_status === 'review') {
        toast.success('Comment submitted for review.');
      } else {
        toast.success('Comment added!');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const generateSmartReplies = async () => {
    if (comments.length === 0) {
      toast.error("No conversation context available for smart replies");
      return;
    }

    setLoadingReplies(true);
    try {
      // Build conversation context from recent comments
      const conversation = comments
        .slice(-5) // Get last 5 comments for context
        .map(comment => `${comment.profiles.display_name || comment.profiles.username}: ${comment.content}`)
        .join('\n');

      const { data, error } = await supabase.functions.invoke('ai-smart-replies', {
        body: { conversation }
      });

      if (error) throw error;

      setSmartReplies(data.replies || []);
      setShowSmartReplies(true);
      toast.success("Smart replies generated!");
    } catch (error) {
      console.error('Error generating smart replies:', error);
      toast.error("Failed to generate smart replies");
    } finally {
      setLoadingReplies(false);
    }
  };

  const useSmartReply = (reply: string) => {
    setNewComment(reply);
    setShowSmartReplies(false);
    toast.success("Reply applied!");
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Comments</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-3">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="w-24 h-3 bg-muted rounded"></div>
                    <div className="w-full h-4 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <Link to={`/profile/${comment.profiles.username}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.profiles.avatar_url} />
                    <AvatarFallback>
                      {comment.profiles.display_name?.[0] || comment.profiles.username[0]}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        to={`/profile/${comment.profiles.username}`}
                        className="font-semibold text-sm hover:underline"
                      >
                        {comment.profiles.display_name || comment.profiles.username}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                      <Heart className="w-3 h-3 mr-1" />
                      Like
                    </Button>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                      Reply
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {user && (
          <div className="p-4 border-t space-y-3">
            {/* Smart Replies Section */}
            {showSmartReplies && smartReplies.length > 0 && (
              <div className="bg-secondary/20 rounded-lg p-3 border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">Smart Replies:</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowSmartReplies(false)}
                    className="h-6 w-6 p-0"
                  >
                    ✕
                  </Button>
                </div>
                <div className="space-y-2">
                  {smartReplies.map((reply, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-left text-xs h-auto p-2 w-full justify-start"
                      onClick={() => useSmartReply(reply)}
                    >
                      {reply}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {user.user_metadata?.display_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex space-x-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || submitting}
                      size="icon"
                      className="shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={generateSmartReplies}
                      disabled={loadingReplies || comments.length === 0}
                      size="icon"
                      variant="outline"
                      className="shrink-0"
                      title="Generate smart replies"
                    >
                      <Sparkles className={`w-4 h-4 ${loadingReplies ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}