import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search as SearchIcon, Users, Hash } from "lucide-react";
import { toast } from "sonner";

interface SearchUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  follower_count?: number;
}

interface SearchPost {
  id: string;
  content: string;
  image_url?: string;
  media_type?: 'image' | 'video' | null;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
  _count: {
    likes: number;
    comments: number;
  };
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users');

  useEffect(() => {
    const searchQuery = searchParams.get('q');
    if (searchQuery) {
      setQuery(searchQuery);
      // Auto-switch to posts tab if searching for hashtags
      if (searchQuery.startsWith('#')) {
        setActiveTab('posts');
      }
      performSearch(searchQuery);
    }
  }, [searchParams, activeTab]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            username,
            display_name,
            avatar_url,
            bio
          `)
          .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
          .limit(20);

        if (error) throw error;
        setUsers(data || []);
      } else if (activeTab === 'posts') {
        // Search posts by content or hashtags
        const { data, error } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            image_url,
            media_type,
            created_at,
            user_id,
            profiles:user_id(
              username,
              display_name,
              avatar_url
            )
          `)
          .ilike('content', `%${searchQuery}%`)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        
        // Get likes and comments count for each post
        const postsWithCounts = await Promise.all(
          (data || []).map(async (post) => {
            const [likesResult, commentsResult] = await Promise.all([
              supabase.from('likes').select('id', { count: 'exact' }).eq('post_id', post.id),
              supabase.from('comments').select('id', { count: 'exact' }).eq('post_id', post.id)
            ]);
            
            return {
              ...post,
              _count: {
                likes: likesResult.count || 0,
                comments: commentsResult.count || 0
              }
            };
          })
        );
        
        setPosts(postsWithCounts);
      }
    } catch (error) {
      console.error('Error searching:', error);
      toast.error(`Failed to search ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query);
    }
  };

  const followUser = async (userId: string) => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: currentUser.user.id,
          following_id: userId
        });

      if (error) throw error;
      toast.success('User followed successfully');
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Search Header */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">Search</h1>
            
            <form onSubmit={handleSearch} className="relative max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users and posts..." 
                className="pl-10"
              />
            </form>

            {/* Tabs */}
            <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
              <Button
                variant={activeTab === 'users' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setActiveTab('users');
                  if (query.trim()) performSearch(query);
                }}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Users
              </Button>
              <Button
                variant={activeTab === 'posts' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setActiveTab('posts');
                  if (query.trim()) performSearch(query);
                }}
                className="flex items-center gap-2"
              >
                <Hash className="h-4 w-4" />
                Posts
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-muted"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activeTab === 'users' && users.length > 0 ? (
            <div className="space-y-4">
              {users.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>
                            {user.display_name?.[0] || user.username?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <Link 
                            to={`/profile/${user.username}`}
                            className="font-semibold hover:underline"
                          >
                            {user.display_name || user.username}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            @{user.username}
                          </p>
                          {user.bio && (
                            <p className="text-sm text-muted-foreground max-w-md">
                              {user.bio}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => followUser(user.id)}
                      >
                        Follow
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activeTab === 'posts' && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.profiles?.avatar_url} />
                        <AvatarFallback>
                          {post.profiles?.display_name?.[0] || post.profiles?.username?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Link 
                            to={`/profile/${post.profiles?.username}`}
                            className="font-semibold hover:underline text-sm"
                          >
                            {post.profiles?.display_name || post.profiles?.username}
                          </Link>
                          <span className="text-muted-foreground text-xs">
                            @{post.profiles?.username}
                          </span>
                          <span className="text-muted-foreground text-xs">·</span>
                          <span className="text-muted-foreground text-xs">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm mb-3 leading-relaxed">{post.content}</p>
                        {post.image_url && (
                          <div className="mb-3">
                            <img 
                              src={post.image_url} 
                              alt="Post image" 
                              className="rounded-lg max-h-64 w-auto object-cover"
                            />
                          </div>
                        )}
                        <div className="flex items-center space-x-4 text-muted-foreground text-xs">
                          <span>{post._count.likes} likes</span>
                          <span>{post._count.comments} comments</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activeTab === 'posts' && query && !loading ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No posts found</h3>
                <p className="text-muted-foreground">
                  Try searching with different keywords or hashtags
                </p>
              </CardContent>
            </Card>
          ) : activeTab === 'users' && query && !loading ? (
            <Card>
              <CardContent className="p-6 text-center">
                <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No users found</h3>
                <p className="text-muted-foreground">
                  Try searching with different keywords
                </p>
              </CardContent>
            </Card>
          ) : !query ? (
            <Card>
              <CardContent className="p-6 text-center">
                <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">
                  Search for {activeTab === 'users' ? 'users' : 'posts'}
                </h3>
                <p className="text-muted-foreground">
                  {activeTab === 'users' 
                    ? 'Enter a username or name to find people'
                    : 'Enter keywords or hashtags to find posts'
                  }
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}