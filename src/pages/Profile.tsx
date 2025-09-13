import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Link2, Calendar, Users, Heart, Bookmark, Edit3, MessageCircle, Camera, MapPinIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/components/post/Post';
import { toast } from 'sonner';

interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  website: string;
  location: string;
  created_at: string;
}

interface PostData {
  id: string;
  content: string;
  image_url: string;
  created_at: string;
  profiles: Profile;
  likes: { user_id: string }[];
  bookmarks: { user_id: string }[];
  _count: { likes: number };
}

const Profile = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [likedPosts, setLikedPosts] = useState<PostData[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<PostData[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  const fetchProfile = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);

      // Fetch posts
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id(*),
          likes:likes(user_id),
          bookmarks:bookmarks(user_id)
        `)
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false });

      if (postsData) {
        const formattedPosts = postsData.map(post => ({
          ...post,
          _count: { likes: post.likes?.length || 0 }
        }));
        setPosts(formattedPosts);
      }

      // Check if current user follows this profile
      if (user && user.id !== profileData.id) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', profileData.id)
          .single();

        setIsFollowing(!!followData);
      }

      // Get followers/following counts
      const { count: followers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profileData.id);

      const { count: following } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profileData.id);

      setFollowersCount(followers || 0);
      setFollowingCount(following || 0);

    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user || !profile) return;

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.id);
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: profile.id
          });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      toast.error('Failed to update follow status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
        <Header />
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-muted rounded-lg"></div>
            <div className="h-20 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
        <Header />
        <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">Profile not found</h1>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <Header />
      
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <Card className="backdrop-blur-sm bg-card/80 border-0 shadow-xl mb-6">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="w-32 h-32 mx-auto md:mx-0">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {profile.display_name?.[0] || profile.username[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl font-bold">{profile.display_name || profile.username}</h1>
                    <p className="text-muted-foreground">@{profile.username}</p>
                  </div>
                  
                  {isOwnProfile ? (
                    <Link to="/edit-profile">
                      <Button variant="outline" className="md:ml-auto">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </Link>
                  ) : user && (
                    <div className="flex gap-2 md:ml-auto">
                      <Button
                        onClick={handleFollow}
                        variant={isFollowing ? "outline" : "default"}
                      >
                        {isFollowing ? 'Unfollow' : 'Follow'}
                      </Button>
                      <Button variant="outline" size="icon">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-foreground mb-4">{profile.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-1">
                      <Link2 className="w-4 h-4" />
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {profile.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold">{followingCount}</span> Following
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold">{followersCount}</span> Followers
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-0">
            {posts.length === 0 ? (
              <Card className="backdrop-blur-sm bg-card/80 border-0 shadow-xl p-8 text-center">
                <p className="text-muted-foreground">No posts yet</p>
              </Card>
            ) : (
              posts.map(post => (
                <Post
                  key={post.id}
                  id={post.id}
                  username={post.profiles.username}
                  avatar={post.profiles.avatar_url}
                  timeAgo={new Date(post.created_at).toLocaleDateString()}
                  content={post.content}
                  image={post.image_url}
                  likes={post._count.likes}
                  comments={0}
                  isLiked={post.likes.some(like => like.user_id === user?.id)}
                  isBookmarked={post.bookmarks.some(bookmark => bookmark.user_id === user?.id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="likes">
            <Card className="backdrop-blur-sm bg-card/80 border-0 shadow-xl p-8 text-center">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Liked posts will appear here</p>
            </Card>
          </TabsContent>

          <TabsContent value="bookmarks">
            <Card className="backdrop-blur-sm bg-card/80 border-0 shadow-xl p-8 text-center">
              <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Bookmarked posts will appear here</p>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;