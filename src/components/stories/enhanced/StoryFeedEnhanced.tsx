import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  Play, 
  Eye, 
  Clock, 
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Users
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { StoryCreator } from './StoryCreator';
import { StoryViewerEnhanced } from './StoryViewerEnhanced';
import HoverPreviews from '@/components/ux-enhancements/HoverPreviews';

interface StoryUser {
  id: string;
  username: string;
  avatar_url?: string;
  stories: Story[];
  hasUnwatched: boolean;
  lastStoryTime: string;
  isHighlight?: boolean;
  highlightTitle?: string;
}

interface Story {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  content?: string;
  media_url?: string;
  media_type: 'image' | 'video' | 'text';
  text_overlays?: string;
  stickers?: string;
  filters?: string;
  music?: string;
  poll?: string;
  created_at: string;
  expires_at: string;
  views_count?: number;
  is_viewed?: boolean;
}

interface StoryFeedEnhancedProps {
  className?: string;
}

export function StoryFeedEnhanced({ className }: StoryFeedEnhancedProps) {
  const { user } = useAuth();
  const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);
  const [highlights, setHighlights] = useState<StoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [selectedStories, setSelectedStories] = useState<Story[]>([]);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [showViewer, setShowViewer] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<'all' | 'close-friends' | 'trending'>('all');
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Load stories and highlights
  useEffect(() => {
    if (user) {
      console.log('User found, loading stories for:', user.id);
      loadStories();
      loadHighlights();
      loadAIRecommendations();
    } else {
      console.log('No user found');
    }
  }, [user, currentFilter]);

  // Check scroll position
  useEffect(() => {
    checkScrollPosition();
  }, [storyUsers]);

  const loadStories = async () => {
    if (!user) {
      console.log('No user, skipping stories load');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Loading stories for user:', user.id);
      
      // Try the simplest possible query first
      const { data: stories, error } = await supabase
        .from('stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20); // Add limit to avoid large queries
      
      if (error) {
        console.error('Stories query error:', error);
        throw error;
      }

      console.log('Raw stories data:', stories);
      
      if (!stories || stories.length === 0) {
        console.log('No stories found');
        setStoryUsers([]);
        return;
      }

      // Now try to get profile data separately to avoid join issues
      const userIds = [...new Set(stories.map(s => s.user_id))];
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);
        
      if (profileError) {
        console.warn('Profile query error:', profileError);
        // Continue without profiles rather than failing completely
      }

      console.log('Profiles data:', profiles);

      // Group stories by us33er
      const userMap = new Map<string, StoryUser>();
      
      stories.forEach(story => {
        const userId = story.user_id;
        const profile = profiles?.find(p => p.id === userId);
        const username = profile?.username || 'Unknown';
        const avatarUrl = profile?.avatar_url;
        
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            id: userId,
            username,
            avatar_url: avatarUrl,
            stories: [],
            hasUnwatched: false,
            lastStoryTime: story.created_at
          });
        }
        
        const userStory = userMap.get(userId)!;
        userStory.stories.push({
          id: story.id,
          user_id: story.user_id,
          username,
          avatar_url: avatarUrl,
          content: story.content,
          media_url: story.media_url,
          media_type: (story.media_type as 'image' | 'video' | 'text') || 'text',
          created_at: story.created_at,
          expires_at: story.expires_at,
          views_count: story.views_count,
          is_viewed: false, // Simplified - assume not viewed for now
          text_overlays: story.text_overlays ? JSON.stringify(story.text_overlays) : undefined,
          stickers: story.stickers ? JSON.stringify(story.stickers) : undefined,
          filters: story.filters ? JSON.stringify(story.filters) : undefined,
          music: story.music ? JSON.stringify(story.music) : undefined,
          poll: story.poll ? JSON.stringify(story.poll) : undefined
        });
        
        // Mark as unwatched for now
        userStory.hasUnwatched = true;
        
        // Update last story time
        if (new Date(story.created_at) > new Date(userStory.lastStoryTime)) {
          userStory.lastStoryTime = story.created_at;
        }
      });

      // Sort users by priority: own stories first, then by last story time
      const sortedUsers = Array.from(userMap.values()).sort((a, b) => {
        if (a.id === user.id) return -1;
        if (b.id === user.id) return 1;
        return new Date(b.lastStoryTime).getTime() - new Date(a.lastStoryTime).getTime();
      });

      console.log('Processed story users:', sortedUsers.length);
      setStoryUsers(sortedUsers);
    } catch (error) {
      console.error('Failed to load stories:', error);
      toast.error(`Failed to load stories: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStoryUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadHighlights = async () => {
    if (!user) return;

    try {
      console.log('Loading highlights...');
      
      // Simplified approach - skip highlights for now if causing issues
      // We can enable this later once basic stories work
      console.log('Highlights disabled for now');
      setHighlights([]);
      
    } catch (error) {
      console.error('Failed to load highlights:', error);
      // Don't show error for highlights - they're optional
      setHighlights([]);
    }
  };

  const loadAIRecommendations = async () => {
    if (!user) return;

    try {
      console.log('AI recommendations disabled for now');
      // Skip AI recommendations for now to avoid function call issues
      setAiRecommendations([]);
    } catch (error) {
      console.error('Failed to load AI recommendations:', error);
      setAiRecommendations([]);
    }
  };

  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const handleStoryClick = (userStories: Story[], storyIndex: number = 0) => {
    setSelectedStories(userStories);
    setSelectedStoryIndex(storyIndex);
    setShowViewer(true);
  };

  const handleCreateStory = () => {
    setShowCreator(true);
  };

  const markStoriesAsViewed = async (userId: string) => {
    if (!user) return;
    
    try {
      const userStoryData = storyUsers.find(u => u.id === userId);
      if (!userStoryData) return;

      const storyIds = userStoryData.stories
        .filter(s => !s.is_viewed)
        .map(s => s.id);

      if (storyIds.length > 0) {
        await supabase
          .from('story_views')
          .insert(
            storyIds.map(storyId => ({
              story_id: storyId,
              user_id: user.id
            }))
          );

        // Update local state
        setStoryUsers(prev => prev.map(u => 
          u.id === userId 
            ? { ...u, hasUnwatched: false, stories: u.stories.map(s => ({ ...s, is_viewed: true })) }
            : u
        ));
      }
    } catch (error) {
      console.error('Failed to mark stories as viewed:', error);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getStoryPreview = (story: Story) => {
    if (story.media_type === 'text') {
      return (
        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-2">
          <p className="text-white text-xs text-center line-clamp-3">
            {story.content}
          </p>
        </div>
      );
    }
    
    if (story.media_url) {
      if (story.media_type === 'video') {
        return (
          <div className="relative w-full h-full">
            <video
              src={story.media_url}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="w-6 h-6 text-white drop-shadow-lg" />
            </div>
          </div>
        );
      } else {
        return (
          <img
            src={story.media_url}
            alt="Story preview"
            className="w-full h-full object-cover"
          />
        );
      }
    }
    
    return (
      <div className="w-full h-full bg-gray-300 flex items-center justify-center">
        <span className="text-gray-500 text-xs">No media</span>
      </div>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['all', 'close-friends', 'trending'].map((filter) => (
            <Button
              key={filter}
              variant={currentFilter === filter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentFilter(filter as any)}
              className="capitalize"
            >
              {filter === 'all' && <Users className="w-4 h-4 mr-1" />}
              {filter === 'close-friends' && <Star className="w-4 h-4 mr-1" />}
              {filter === 'trending' && <TrendingUp className="w-4 h-4 mr-1" />}
              {filter.replace('-', ' ')}
            </Button>
          ))}
        </div>

        {aiRecommendations.length > 0 && (
          <Badge variant="outline" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            {aiRecommendations.length} AI picks
          </Badge>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={async () => {
            try {
              const { data, error } = await supabase.from('stories').select('count').single();
              if (error) {
                toast.error(`DB Error: ${error.message}`);
              } else {
                toast.success('Database connection OK');
                loadStories(); // Retry loading
              }
            } catch (e) {
              toast.error('Connection failed');
            }
          }}
        >
          Test DB
        </Button>
      </div>

      {/* Stories Container */}
      <div className="relative">
        {/* Scroll Buttons */}
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
            onClick={scrollLeft}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        
        {canScrollRight && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
            onClick={scrollRight}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}

        {/* Stories Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
          onScroll={checkScrollPosition}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Create Story Button */}
          <div className="flex-shrink-0">
            <Card 
              className="w-16 h-24 cursor-pointer hover:shadow-md transition-all group border-dashed border-2 border-primary/30 hover:border-primary/60"
              onClick={handleCreateStory}
            >
              <CardContent className="p-0 h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1 group-hover:bg-primary/20 transition-colors">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs text-center text-muted-foreground px-1">
                  Your Story
                </span>
              </CardContent>
            </Card>
          </div>

          {/* User Stories */}
          {storyUsers.map((userStory) => {
            const firstStory = userStory.stories[0];
            const hasMedia = firstStory?.media_url;
            const mediaType = firstStory?.media_type === 'video' ? 'video' : 'image';
            
            return (
              <div key={userStory.id} className="flex-shrink-0">
                {hasMedia ? (
                  <HoverPreviews
                    src={firstStory.media_url!}
                    type={mediaType}
                    alt={`${userStory.username}'s story`}
                    previewDelay={400}
                    enableFullScreen={false}
                    showControls={true}
                    autoPlay={true}
                    muted={true}
                  >
                    <Card 
                      className={cn(
                        "w-16 h-24 cursor-pointer hover:shadow-md transition-all overflow-hidden",
                        userStory.hasUnwatched && "ring-2 ring-primary ring-offset-2"
                      )}
                      onClick={() => {
                        handleStoryClick(userStory.stories);
                        markStoriesAsViewed(userStory.id);
                      }}
                    >
                      <CardContent className="p-0 h-full relative">
                        {/* Story Preview */}
                        <div className="w-full h-16 relative">
                          {getStoryPreview(userStory.stories[0])}
                          
                          {/* Overlay gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          
                          {/* User Avatar */}
                          <div className="absolute top-1 left-1">
                            <Avatar className="w-6 h-6 ring-2 ring-white">
                              <AvatarImage src={userStory.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {userStory.username[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          
                          {/* Story Count */}
                          {userStory.stories.length > 1 && (
                            <div className="absolute top-1 right-1">
                              <Badge variant="secondary" className="text-xs px-1">
                                {userStory.stories.length}
                              </Badge>
                            </div>
                          )}
                          
                          {/* Unviewed Indicator */}
                          {userStory.hasUnwatched && (
                            <div className="absolute bottom-1 right-1">
                              <div className="w-2 h-2 bg-primary rounded-full ring-1 ring-white" />
                            </div>
                          )}
                        </div>
                        
                        {/* Username */}
                        <div className="p-1">
                          <p className="text-xs text-center text-muted-foreground line-clamp-1">
                            {userStory.username}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </HoverPreviews>
                ) : (
                  <Card 
                    className={cn(
                      "w-16 h-24 cursor-pointer hover:shadow-md transition-all overflow-hidden",
                      userStory.hasUnwatched && "ring-2 ring-primary ring-offset-2"
                    )}
                    onClick={() => {
                      handleStoryClick(userStory.stories);
                      markStoriesAsViewed(userStory.id);
                    }}
                  >
                    <CardContent className="p-0 h-full relative">
                      {/* Story Preview */}
                      <div className="w-full h-16 relative">
                        {getStoryPreview(userStory.stories[0])}
                        
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        
                        {/* User Avatar */}
                        <div className="absolute top-1 left-1">
                          <Avatar className="w-6 h-6 ring-2 ring-white">
                            <AvatarImage src={userStory.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {userStory.username[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        
                        {/* Story Count */}
                        {userStory.stories.length > 1 && (
                          <div className="absolute top-1 right-1">
                            <Badge variant="secondary" className="text-xs px-1">
                              {userStory.stories.length}
                            </Badge>
                          </div>
                        )}
                        
                        {/* Unviewed Indicator */}
                        {userStory.hasUnwatched && (
                          <div className="absolute bottom-1 right-1">
                            <div className="w-2 h-2 bg-primary rounded-full ring-1 ring-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* Username */}
                      <div className="p-1">
                        <p className="text-xs text-center text-muted-foreground line-clamp-1">
                          {userStory.username}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}

          {/* Highlights */}
          {highlights.map((highlight) => (
            <div key={`highlight-${highlight.id}`} className="flex-shrink-0">
              <Card 
                className="w-16 h-24 cursor-pointer hover:shadow-md transition-all overflow-hidden border-amber-200"
                onClick={() => handleStoryClick(highlight.stories)}
              >
                <CardContent className="p-0 h-full relative">
                  {/* Highlight Preview */}
                  <div className="w-full h-16 relative">
                    {getStoryPreview(highlight.stories[0])}
                    
                    {/* Highlight Indicator */}
                    <div className="absolute top-1 left-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    </div>
                  </div>
                  
                  {/* Highlight Title */}
                  <div className="p-1">
                    <p className="text-xs text-center text-muted-foreground line-clamp-1">
                      {highlight.highlightTitle}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}

          {/* Loading placeholder */}
          {loading && (
            <>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex-shrink-0">
                  <Card className="w-16 h-24">
                    <CardContent className="p-0 h-full">
                      <div className="w-full h-16 bg-gray-200 animate-pulse" />
                      <div className="p-1">
                        <div className="h-3 bg-gray-200 animate-pulse rounded" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </>
          )}
          
          {/* Empty state */}
          {!loading && storyUsers.length === 0 && (
            <div className="flex-shrink-0 ml-4">
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No stories yet</p>
                <p className="text-xs text-muted-foreground">Create your first story!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      {aiRecommendations.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Recommendations
          </h3>
          <div className="flex gap-2 overflow-x-auto">
            {aiRecommendations.map((rec, index) => (
              <Badge key={index} variant="outline" className="whitespace-nowrap">
                {rec}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Story Creator Modal */}
      <StoryCreator
        isOpen={showCreator}
        onClose={() => setShowCreator(false)}
        onStoryCreated={() => {
          setShowCreator(false);
          loadStories(); // Reload stories
        }}
      />

      {/* Story Viewer */}
      <StoryViewerEnhanced
        stories={selectedStories}
        initialStoryIndex={selectedStoryIndex}
        isOpen={showViewer}
        onClose={() => setShowViewer(false)}
      />
    </div>
  );
}