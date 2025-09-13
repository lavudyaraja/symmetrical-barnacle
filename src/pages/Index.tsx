import { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { CreatePost } from "@/components/post/CreatePost";
import { EnhancedPost } from "@/components/post/EnhancedPost";
import { StoryFeedEnhanced } from "@/components/stories";
import { InfiniteScroll } from "@/components/InfiniteScroll";
import { SmartFeed } from "@/components/SmartFeed";
import { TrendingSection } from "@/components/trending";
// import { ClearPostsAdmin } from "@/components/post/ClearPostsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

interface PostData {
  id: string;
  content: string;
  image_url: string;
  media_type?: 'image' | 'video';
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
  likes: { user_id: string }[];
  bookmarks: { user_id: string }[];
  _count: { likes: number; comments: number };
}

const Index = () => {
  const { user, loading } = useAuth();
  const { notifications, unreadCount } = useRealtimeNotifications();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [showSmartFeed, setShowSmartFeed] = useState(false);
  const POSTS_PER_PAGE = 10;
  const lastPostCreatedTimeRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (user) {
      fetchPosts();
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [user]);

  const fetchPosts = async (pageNum = 0, reset = false) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current || !mountedRef.current) return;
    
    isFetchingRef.current = true;
    setPostsLoading(true);
    
    try {
      const from = pageNum * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(*),
          likes:likes(user_id),
          bookmarks:bookmarks(user_id)
        `)
        .order('created_at', { ascending: false })
        .range(from, to);

      // Check if component is still mounted before processing
      if (!mountedRef.current) return;

      // Get comments count separately
      const postsWithComments = await Promise.all(
        (data || []).map(async (post) => {
          const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);
          
          return {
            ...post,
            _count: { 
              likes: post.likes?.length || 0,
              comments: count || 0
            }
          };
        })
      );

      if (error) throw error;
      
      // Final check before updating state
      if (!mountedRef.current) return;

      if (reset) {
        setPosts(postsWithComments.filter((post, index, self) => 
          index === self.findIndex(p => p.id === post.id)
        ));
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(post => post.id));
          const newPosts = postsWithComments.filter(post => !existingIds.has(post.id));
          const combined = [...prev, ...newPosts];
          // Remove any potential duplicates
          return combined.filter((post, index, self) => 
            index === self.findIndex(p => p.id === post.id)
          );
        });
      }

      setHasMore(postsWithComments.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      if (mountedRef.current) {
        setPostsLoading(false);
      }
      isFetchingRef.current = false;
    }
  };

  const handlePostDeleted = (deletedPostId: string) => {
    setPosts(prev => prev.filter(post => post.id !== deletedPostId));
  };
  const handlePostCreated = () => {
    if (!mountedRef.current) return;
    
    const now = Date.now();
    // Prevent multiple calls within 3 seconds and prevent concurrent refreshes
    if (now - lastPostCreatedTimeRef.current < 3000 || isRefreshingRef.current || isFetchingRef.current) {
      console.log('Post creation refresh blocked: too soon or already refreshing');
      return;
    }
    
    lastPostCreatedTimeRef.current = now;
    isRefreshingRef.current = true;
    
    setPage(0);
    fetchPosts(0, true).finally(() => {
      if (mountedRef.current) {
        isRefreshingRef.current = false;
      }
    });
  };

  const loadMorePosts = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${Math.floor(diffInHours / 24)}d`;
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-primary rounded-full"></div>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <Header />
      <main className="container max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-4">
        <div className="w-full">
          {/* Main Content */}
          <div className="max-w-2xl mx-auto w-full">
            {/* <ClearPostsAdmin /> */}
            <StoryFeedEnhanced />
            <CreatePost onPostCreated={handlePostCreated} />
            {/* Feed Toggle */}
            <div className="mb-4">
              <div className="flex items-center justify-center gap-2 sm:gap-4">
                <button
                  onClick={() => setShowSmartFeed(false)}
                  className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-colors ${
                    !showSmartFeed 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  Recent Posts
                </button>
                <button
                  onClick={() => setShowSmartFeed(true)}
                  className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-colors ${
                    showSmartFeed 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  Smart Feed
                </button>
              </div>
            </div>

            {showSmartFeed ? (
              <SmartFeed posts={posts} onPostDeleted={handlePostDeleted} />
            ) : (
              <>
                <InfiniteScroll
                  hasMore={hasMore}
                  loading={postsLoading && page > 0}
                  onLoadMore={loadMorePosts}
                  className="space-y-4"
                >
                  {postsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="backdrop-blur-sm bg-card/80 border-0 shadow-xl rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-muted rounded-full"></div>
                            <div className="space-y-2">
                              <div className="w-32 h-4 bg-muted rounded"></div>
                              <div className="w-20 h-3 bg-muted rounded"></div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="w-full h-4 bg-muted rounded"></div>
                            <div className="w-3/4 h-4 bg-muted rounded"></div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : posts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-lg">No posts yet. Create your first post!</p>
                    </div>
                  ) : (
                    posts.map((post, index) => {
                      // Extract hashtags from content for tags
                      const hashtags = post.content.match(/#\w+/g)?.map(tag => tag.slice(1)) || [];
                      
                      // Calculate view count based on likes and comments (simulated)
                      const viewCount = Math.max(post._count.likes * 3 + post._count.comments * 2, post._count.likes + post._count.comments);
                      
                      // Determine if post should be featured (high engagement)
                      const isHighEngagement = post._count.likes > 10 || post._count.comments > 5;
                      const priority = isHighEngagement ? 'high' : 'normal';
                      
                      return (
                        <EnhancedPost
                          key={post.id}
                          id={post.id}
                          username={post.profiles.username}
                          avatar={post.profiles.avatar_url}
                          timeAgo={post.created_at}
                          content={post.content}
                          image={post.image_url}
                          media_type={post.media_type}
                          likes={post._count.likes}
                          comments={post._count.comments}
                          commentsCount={post._count.comments}
                          isLiked={post.likes.some(like => like.user_id === user.id)}
                          isBookmarked={post.bookmarks.some(bookmark => bookmark.user_id === user.id)}
                          userId={post.user_id}
                          onDelete={handlePostDeleted}
                          // Enhanced features
                          viewCount={viewCount}
                          shareCount={Math.floor(post._count.likes / 2)}
                          tags={hashtags}
                          isPinned={index === 0 && isHighEngagement} // Pin first high-engagement post
                          isVerified={post.profiles.username.includes('admin') || post._count.likes > 20}
                          allowComments={true}
                          showAnalytics={post.user_id === user.id}
                          theme="default"
                          priority={priority as 'low' | 'normal' | 'high' | 'featured'}
                          engagement={{
                            impressions: viewCount,
                            clickThroughRate: Math.min(95, Math.max(5, (post._count.comments / Math.max(1, viewCount)) * 100)),
                            avgTimeSpent: Math.max(10, Math.min(120, post.content.length / 10))
                          }}
                        />
                      );
                    })
                  )}
                </InfiniteScroll>

                {!hasMore && posts.length > 0 && (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">You're all caught up!</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Sidebar */}
        </div>
        
        {/* Floating Trending Button */}
        <TrendingSection />
      </main>
    </div>
  );
};

export default Index;
