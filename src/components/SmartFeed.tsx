import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, Users, Clock, Sparkles, Filter } from "lucide-react";
import { Post } from "@/components/post/Post";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SmartFeedProps {
  posts: any[];
  onPostDeleted?: (postId: string) => void;
}

export function SmartFeed({ posts, onPostDeleted }: SmartFeedProps) {
  const { user } = useAuth();
  const [feedType, setFeedType] = useState<'personalized' | 'trending' | 'following' | 'recent'>('personalized');
  const [personalizedPosts, setPersonalizedPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastPostsRef = useRef<any[]>([]);
  const lastFeedTypeRef = useRef<string>('');

  const calculatePersonalizedScore = (post: any) => {
    let score = 0;
    
    // Time decay factor (newer posts get higher scores)
    const hoursAgo = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
    const timeFactor = Math.max(0, 1 - (hoursAgo / 24)); // Decay over 24 hours
    score += timeFactor * 20;
    
    // Engagement factor
    const engagement = (post._count.likes + post._count.comments * 2) / Math.max(1, hoursAgo);
    score += Math.min(engagement * 10, 30); // Cap at 30 points
    
    // User interaction history (simulated)
    if (post.likes?.some((like: any) => like.user_id === user?.id)) {
      score += 15; // User previously liked similar content
    }
    
    // Content type preferences (simulated)
    if (post.image_url) {
      score += 10; // Visual content preference
    }
    
    return score;
  };

  // Memoize feed calculations to prevent unnecessary re-computation
  const memoizedFeeds = useMemo(() => {
    const getPersonalizedFeed = () => {
      const scoredPosts = posts.map(post => ({
        ...post,
        personalizedScore: calculatePersonalizedScore(post)
      }));
      
      return scoredPosts.sort((a, b) => b.personalizedScore - a.personalizedScore);
    };

    const getTrendingFeed = () => {
      return [...posts].sort((a, b) => {
        const scoreA = a._count.likes + a._count.comments * 2;
        const scoreB = b._count.likes + b._count.comments * 2;
        return scoreB - scoreA;
      });
    };

    const getRecentFeed = () => {
      return [...posts].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    };

    return {
      personalized: getPersonalizedFeed(),
      trending: getTrendingFeed(),
      recent: getRecentFeed()
    };
  }, [posts, user?.id]); // Only recalculate when posts or user changes

  const getFollowingFeed = async () => {
    if (!user) return [];
    
    try {
      // Get users the current user follows
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      
      const followingIds = following?.map(f => f.following_id) || [];
      
      // Filter posts from followed users
      return posts.filter(post => followingIds.includes(post.user_id));
    } catch (error) {
      console.error('Error fetching following feed:', error);
      return [];
    }
  };

  const getRecentFeed = () => {
    return [...posts].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  const updateFeed = async () => {
    // Prevent unnecessary updates
    const postsChanged = JSON.stringify(posts) !== JSON.stringify(lastPostsRef.current);
    const feedTypeChanged = feedType !== lastFeedTypeRef.current;
    
    if (!postsChanged && !feedTypeChanged) {
      return;
    }
    
    lastPostsRef.current = posts;
    lastFeedTypeRef.current = feedType;
    
    setIsLoading(true);
    
    let feedPosts: any[] = [];
    
    switch (feedType) {
      case 'personalized':
        feedPosts = memoizedFeeds.personalized;
        break;
      case 'trending':
        feedPosts = memoizedFeeds.trending;
        break;
      case 'following':
        feedPosts = await getFollowingFeed();
        break;
      case 'recent':
        feedPosts = memoizedFeeds.recent;
        break;
    }
    
    setPersonalizedPosts(feedPosts);
    setIsLoading(false);
  };

  useEffect(() => {
    updateFeed();
  }, [feedType, memoizedFeeds]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${Math.floor(diffInHours / 24)}d`;
  };

  const getFeedDescription = () => {
    switch (feedType) {
      case 'personalized':
        return "AI-curated content based on your interests and engagement patterns";
      case 'trending':
        return "Most popular posts with high engagement across the platform";
      case 'following':
        return "Latest posts from people you follow";
      case 'recent':
        return "All posts in chronological order";
      default:
        return "";
    }
  };

  const getFeedStats = () => {
    const totalEngagement = personalizedPosts.reduce((sum, post) => 
      sum + post._count.likes + post._count.comments, 0
    );
    
    const avgScore = personalizedPosts.reduce((sum, post) => 
      sum + (post.personalizedScore || 0), 0
    ) / Math.max(personalizedPosts.length, 1);

    return {
      totalPosts: personalizedPosts.length,
      totalEngagement,
      avgScore: Math.round(avgScore)
    };
  };

  const stats = getFeedStats();

  return (
    <div className="space-y-6">
      {/* Feed Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-primary" />
              <CardTitle>Smart Feed</CardTitle>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={updateFeed}
              disabled={isLoading}
            >
              <Filter className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={feedType} onValueChange={(value) => setFeedType(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personalized" className="flex items-center space-x-1">
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">For You</span>
              </TabsTrigger>
              <TabsTrigger value="trending" className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Trending</span>
              </TabsTrigger>
              <TabsTrigger value="following" className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Following</span>
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Recent</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">{getFeedDescription()}</p>
              
              {/* Feed Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{stats.totalPosts}</div>
                  <div className="text-xs text-muted-foreground">Posts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{stats.totalEngagement}</div>
                  <div className="text-xs text-muted-foreground">Interactions</div>
                </div>
                {feedType === 'personalized' && (
                  <div>
                    <div className="text-2xl font-bold text-primary">{stats.avgScore}</div>
                    <div className="text-xs text-muted-foreground">AI Score</div>
                  </div>
                )}
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Feed Content */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading smart feed...</p>
          </div>
        ) : personalizedPosts.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No posts found for this feed</p>
            <p className="text-sm text-muted-foreground">Try switching to a different feed type</p>
          </div>
        ) : (
          personalizedPosts.map((post) => (
            <div key={post.id} className="relative">
              <Post
                id={post.id}
                username={post.profiles.username}
                avatar={post.profiles.avatar_url}
                timeAgo={post.created_at}
                content={post.content}
                image={post.image_url}
                likes={post._count.likes}
                comments={post._count.comments}
                commentsCount={post._count.comments}
                isLiked={post.likes?.some((like: any) => like.user_id === user?.id)}
                isBookmarked={post.bookmarks?.some((bookmark: any) => bookmark.user_id === user?.id)}
                userId={post.user_id}
                onDelete={onPostDeleted}
              />
              
              {/* AI Score Badge for Personalized Feed */}
              {feedType === 'personalized' && post.personalizedScore && (
                <Badge 
                  variant="secondary" 
                  className="absolute top-4 right-4 bg-primary/10 text-primary"
                >
                  <Brain className="w-3 h-3 mr-1" />
                  {Math.round(post.personalizedScore)}
                </Badge>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}