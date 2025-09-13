import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  MessageCircle, 
  Share, 
  MoreHorizontal,
  Volume2,
  VolumeX,
  Eye,
  Bookmark,
  Send,
  Smile,
  X,
  Zap,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import type { Story, Reaction, Reply } from './index';

interface StoryViewerEnhancedProps {
  stories: Story[];
  initialStoryIndex: number;
  onClose: () => void;
  isOpen: boolean;
}

const EMOJI_REACTIONS = ['❤️', '😂', '😮', '😢', '😠', '👏', '🔥', '💯'];

export function StoryViewerEnhanced({ 
  stories, 
  initialStoryIndex, 
  onClose, 
  isOpen 
}: StoryViewerEnhancedProps) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showReactions, setShowReactions] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [storyReactions, setStoryReactions] = useState<Reaction[]>([]);
  const [storyReplies, setStoryReplies] = useState<Reply[]>([]);
  const [pollVote, setPollVote] = useState<string | null>(null);
  const [lastViewPosition, setLastViewPosition] = useState<number>(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentStory = stories[currentIndex];
  const isOwner = user?.id === currentStory?.user_id;

  // Smart scroll to resume from last position
  useEffect(() => {
    const savedPosition = localStorage.getItem('lastStoryPosition');
    if (savedPosition && !isNaN(Number(savedPosition))) {
      setLastViewPosition(Number(savedPosition));
      if (Number(savedPosition) < stories.length) {
        setCurrentIndex(Number(savedPosition));
      }
    }
  }, [stories.length]);

  // Save current position
  useEffect(() => {
    localStorage.setItem('lastStoryPosition', currentIndex.toString());
  }, [currentIndex]);

  // Progress tracking for stories
  useEffect(() => {
    if (!isPlaying || !currentStory) return;

    const duration = currentStory.media_type === 'video' ? 
      (videoRef.current?.duration || 15) * 1000 : 5000; // 5 seconds for image/text

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (duration / 100));
        if (newProgress >= 100) {
          goToNext();
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, currentStory, currentIndex]);

  // Auto-advance for non-video stories
  useEffect(() => {
    if (!isPlaying || currentStory?.media_type === 'video') return;

    const duration = 5000; // 5 seconds for image/text stories
    autoAdvanceTimeoutRef.current = setTimeout(() => {
      goToNext();
    }, duration);

    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, [currentIndex, isPlaying, currentStory]);

  // Load story interactions
  useEffect(() => {
    if (!currentStory) return;
    loadStoryInteractions();
  }, [currentStory?.id]);

  const loadStoryInteractions = async () => {
    if (!currentStory) return;

    try {
      // Load reactions
      const { data: reactions } = await supabase
        .from('story_reactions')
        .select('*')
        .eq('story_id', currentStory.id);

      // Load replies
      const { data: replies } = await supabase
        .from('story_replies')
        .select('*')
        .eq('story_id', currentStory.id)
        .order('created_at', { ascending: true });

      setStoryReactions(reactions || []);
      // For replies, we need to fetch usernames separately or use a different approach
      const repliesWithUsernames = await Promise.all(
        (replies || []).map(async (reply) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', reply.user_id)
            .single();
          
          return {
            id: reply.id,
            user_id: reply.user_id,
            username: profile?.username || 'Anonymous',
            content: reply.content,
            created_at: reply.created_at
          };
        })
      );
      
      setStoryReplies(repliesWithUsernames);

      // Mark as viewed
      if (user && user.id !== currentStory.user_id) {
        await supabase
          .from('story_views')
          .insert({ story_id: currentStory.id, user_id: user.id })
          .select();
      }
    } catch (error) {
      console.error('Failed to load story interactions:', error);
    }
  };

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => {
      if (videoRef.current) {
        if (prev) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
      }
      return !prev;
    });
  }, []);

  const handleReaction = async (emoji: string) => {
    if (!user || !currentStory) return;

    try {
      // Check if user already reacted
      const existingReaction = storyReactions.find(r => r.user_id === user.id);
      
      if (existingReaction) {
        // Update existing reaction
        await supabase
          .from('story_reactions')
          .update({ emoji })
          .eq('id', existingReaction.id);
      } else {
        // Create new reaction
        await supabase
          .from('story_reactions')
          .insert({
            story_id: currentStory.id,
            user_id: user.id,
            emoji
          });
      }

      // Update local state
      setStoryReactions(prev => {
        if (existingReaction) {
          return prev.map(r => r.id === existingReaction.id ? { ...r, emoji } : r);
        } else {
          return [...prev, {
            id: `temp_${Date.now()}`,
            user_id: user.id,
            emoji,
            created_at: new Date().toISOString()
          }];
        }
      });

      setShowReactions(false);
      toast.success('Reaction sent!');
    } catch (error) {
      console.error('Failed to send reaction:', error);
      toast.error('Failed to send reaction');
    }
  };

  const handleReply = async () => {
    if (!user || !currentStory || !replyText.trim()) return;

    try {
      const { data, error } = await supabase
        .from('story_replies')
        .insert({
          story_id: currentStory.id,
          user_id: user.id,
          content: replyText.trim()
        })
        .select()
        .single();

      if (error) throw error;

      setStoryReplies(prev => [...prev, {
        id: data.id,
        user_id: user.id,
        username: user.email?.split('@')[0] || 'You',
        content: replyText.trim(),
        created_at: data.created_at
      }]);

      setReplyText('');
      setShowReplyBox(false);
      toast.success('Reply sent!');
    } catch (error) {
      console.error('Failed to send reply:', error);
      toast.error('Failed to send reply');
    }
  };

  const handlePollVote = async (option: string) => {
    if (!user || !currentStory || pollVote) return;

    try {
      await supabase
        .from('story_poll_votes')
        .insert({
          story_id: currentStory.id,
          user_id: user.id,
          option
        });

      setPollVote(option);
      toast.success('Vote recorded!');
    } catch (error) {
      console.error('Failed to vote:', error);
      toast.error('Failed to vote');
    }
  };

  const saveToHighlights = async () => {
    if (!user || !currentStory || !isOwner) return;

    try {
      await supabase
        .from('story_highlights')
        .insert({
          story_id: currentStory.id,
          user_id: user.id,
          title: 'Highlight'
        });

      toast.success('Saved to Highlights!');
    } catch (error) {
      console.error('Failed to save to highlights:', error);
      toast.error('Failed to save to highlights');
    }
  };

  const shareStory = async () => {
    if (!currentStory) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${currentStory.username}'s Story`,
          text: currentStory.content || 'Check out this story!',
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Story link copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to share:', error);
      toast.error('Failed to share story');
    }
  };

  // Parse story overlays and stickers
  const textOverlays = currentStory?.text_overlays ? 
    JSON.parse(currentStory.text_overlays) : [];
  const stickers = currentStory?.stickers ? 
    JSON.parse(currentStory.stickers) : [];
  const poll = currentStory?.poll ? 
    JSON.parse(currentStory.poll) : null;

  if (!isOpen || !currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex gap-1">
          {stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width: index < currentIndex ? '100%' : 
                         index === currentIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-yellow-500 p-0.5">
            <img
              src={currentStory.avatar_url || '/default-avatar.png'}
              alt={currentStory.username}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div>
            <p className="text-white font-medium">{currentStory.username}</p>
            <p className="text-white/70 text-sm">
              {new Date(currentStory.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {currentStory.media_type === 'video' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlayPause}
            className="text-white hover:bg-white/20"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div
        ref={containerRef}
        className="relative w-full max-w-md h-full mx-4 flex items-center justify-center"
        onClick={togglePlayPause}
      >
        {/* Story Content */}
        <div className="relative w-full h-[80vh] bg-black rounded-2xl overflow-hidden">
          {currentStory.media_type === 'image' && currentStory.media_url && (
            <img
              src={currentStory.media_url}
              alt="Story"
              className="w-full h-full object-cover"
            />
          )}
          
          {currentStory.media_type === 'video' && currentStory.media_url && (
            <video
              ref={videoRef}
              src={currentStory.media_url}
              className="w-full h-full object-cover"
              autoPlay
              muted={isMuted}
              loop={false}
              onEnded={goToNext}
            />
          )}
          
          {currentStory.media_type === 'text' && (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
              <p className="text-white text-2xl text-center p-8 font-medium">
                {currentStory.content}
              </p>
            </div>
          )}

          {/* Text Overlays */}
          {textOverlays.map((overlay: any) => (
            <div
              key={overlay.id}
              className="absolute pointer-events-none"
              style={{
                left: `${overlay.x}%`,
                top: `${overlay.y}%`,
                fontSize: `${overlay.fontSize}px`,
                color: overlay.color,
                fontFamily: overlay.fontFamily,
                transform: `rotate(${overlay.rotation}deg)`,
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {overlay.text}
            </div>
          ))}

          {/* Stickers */}
          {stickers.map((sticker: any) => (
            <div
              key={sticker.id}
              className="absolute pointer-events-none"
              style={{
                left: `${sticker.x}px`,
                top: `${sticker.y}px`,
                transform: `scale(${sticker.scale}) rotate(${sticker.rotation}deg)`
              }}
            >
              {sticker.content}
            </div>
          ))}

          {/* Poll */}
          {poll && (
            <div className="absolute bottom-20 left-4 right-4">
              <Card className="bg-black/50 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <h3 className="text-white font-medium mb-3">{poll.question}</h3>
                  <div className="space-y-2">
                    {poll.options.map((option: string, index: number) => (
                      <Button
                        key={index}
                        variant={pollVote === option ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => handlePollVote(option)}
                        disabled={!!pollVote}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Areas */}
          <div className="absolute inset-0 flex">
            <div 
              className="flex-1 flex items-center justify-start pl-4"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
            >
              {currentIndex > 0 && (
                <ChevronLeft className="w-8 h-8 text-white/70 hover:text-white transition-colors" />
              )}
            </div>
            
            <div className="flex-1" />
            
            <div 
              className="flex-1 flex items-center justify-end pr-4"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
            >
              {currentIndex < stories.length - 1 && (
                <ChevronRight className="w-8 h-8 text-white/70 hover:text-white transition-colors" />
              )}
            </div>
          </div>
        </div>

        {/* Quick Reactions */}
        {showReactions && (
          <div className="absolute bottom-32 left-4 right-4">
            <div className="flex justify-center gap-2 bg-black/50 backdrop-blur-sm rounded-full p-3">
              {EMOJI_REACTIONS.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(emoji)}
                  className="text-2xl hover:scale-110 transition-transform"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Reply Box */}
        {showReplyBox && (
          <div className="absolute bottom-20 left-4 right-4">
            <div className="flex gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-3">
              <Input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Reply to story..."
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleReply();
                  }
                }}
              />
              <Button size="sm" onClick={handleReply} disabled={!replyText.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-8 left-4 right-4 z-10">
        <div className="flex justify-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReactions(!showReactions)}
            className="text-white hover:bg-white/20"
          >
            <Heart className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplyBox(!showReplyBox)}
            className="text-white hover:bg-white/20"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={shareStory}
            className="text-white hover:bg-white/20"
          >
            <Share className="w-5 h-5" />
          </Button>
          
          {isOwner && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={saveToHighlights}
                className="text-white hover:bg-white/20"
              >
                <Bookmark className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="text-white hover:bg-white/20"
              >
                <BarChart3 className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && isOwner && (
        <div className="absolute top-20 right-4 w-64 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
          <h3 className="font-medium mb-3">Story Analytics</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Views:</span>
              <span>{currentStory.views_count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Reactions:</span>
              <span>{storyReactions.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Replies:</span>
              <span>{storyReplies.length}</span>
            </div>
          </div>
          
          {storyReactions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-white/70 mb-1">Top Reactions:</p>
              <div className="flex gap-1">
                {EMOJI_REACTIONS.slice(0, 5).map((emoji) => {
                  const count = storyReactions.filter(r => r.emoji === emoji).length;
                  return count > 0 ? (
                    <Badge key={emoji} variant="outline" className="text-xs">
                      {emoji} {count}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Replies Panel */}
      {storyReplies.length > 0 && isOwner && (
        <div className="absolute top-20 left-4 w-64 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white max-h-64 overflow-y-auto">
          <h3 className="font-medium mb-3">Replies ({storyReplies.length})</h3>
          <div className="space-y-2">
            {storyReplies.slice(-5).map((reply) => (
              <div key={reply.id} className="text-sm">
                <p className="font-medium text-xs text-white/70">{reply.username}</p>
                <p>{reply.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}