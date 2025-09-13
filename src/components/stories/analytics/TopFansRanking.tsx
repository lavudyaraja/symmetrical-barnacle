import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Crown, 
  Trophy,
  Heart,
  MessageCircle,
  Eye,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FanEngagement {
  userId: string;
  username: string;
  avatarUrl: string;
  engagementScore: number;
  views: number;
  reactions: number;
  replies: number;
  streak: number;
  lastActive: string;
}

interface TopFansRankingProps {
  storyId: string;
  timeRange?: '24h' | '7d' | '30d' | 'all';
  onFanSelect?: (fan: FanEngagement) => void;
  className?: string;
}

export function TopFansRanking({
  storyId,
  timeRange = '7d',
  onFanSelect,
  className = ''
}: TopFansRankingProps) {
  const [fans, setFans] = useState<FanEngagement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFan, setSelectedFan] = useState<FanEngagement | null>(null);

  // Fetch top fans data
  const fetchTopFans = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock fan data
      const mockFans: FanEngagement[] = [
        {
          userId: 'user1',
          username: 'alex_jones',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
          engagementScore: 98,
          views: 1245,
          reactions: 89,
          replies: 23,
          streak: 15,
          lastActive: '2023-05-15T14:30:00Z'
        },
        {
          userId: 'user2',
          username: 'sarah_m',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
          engagementScore: 95,
          views: 1123,
          reactions: 78,
          replies: 31,
          streak: 12,
          lastActive: '2023-05-15T13:45:00Z'
        },
        {
          userId: 'user3',
          username: 'mike_t',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
          engagementScore: 92,
          views: 987,
          reactions: 65,
          replies: 18,
          streak: 8,
          lastActive: '2023-05-15T12:20:00Z'
        },
        {
          userId: 'user4',
          username: 'emma_l',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
          engagementScore: 89,
          views: 876,
          reactions: 56,
          replies: 27,
          streak: 22,
          lastActive: '2023-05-15T11:15:00Z'
        },
        {
          userId: 'user5',
          username: 'david_k',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
          engagementScore: 87,
          views: 765,
          reactions: 48,
          replies: 15,
          streak: 5,
          lastActive: '2023-05-15T10:30:00Z'
        }
      ];

      setFans(mockFans);
      if (mockFans.length > 0) {
        setSelectedFan(mockFans[0]);
      }
    } catch (error) {
      console.error('Error fetching top fans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize on mount and when storyId/timeRange changes
  useEffect(() => {
    fetchTopFans();
  }, [storyId, timeRange]);

  // Get fan icon based on rank
  const getFanIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Trophy className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Trophy className="w-5 h-5 text-amber-700" />;
    return <Star className="w-4 h-4 text-primary" />;
  };

  // Get fan badge based on engagement score
  const getFanBadge = (score: number) => {
    if (score >= 95) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (score >= 90) return <Star className="w-4 h-4 text-purple-500" />;
    if (score >= 85) return <Sparkles className="w-4 h-4 text-blue-500" />;
    return <Heart className="w-4 h-4 text-pink-500" />;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading top fans...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Top Fans Ranking
            </div>
            <Badge variant="secondary">
              {timeRange === '24h' ? 'Last 24 hours' : 
               timeRange === '7d' ? 'Last 7 days' :
               timeRange === '30d' ? 'Last 30 days' : 'All time'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fans.length === 0 ? (
            <div className="text-center py-8">
              <Crown className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No fan data available yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Top Fans List */}
              <div className="space-y-2">
                {fans.map((fan, index) => (
                  <div 
                    key={fan.userId}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      selectedFan?.userId === fan.userId 
                        ? 'bg-primary/10 border border-primary' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => {
                      setSelectedFan(fan);
                      onFanSelect?.(fan);
                    }}
                  >
                    <div className="flex items-center justify-center w-8 h-8">
                      {getFanIcon(index + 1)}
                    </div>
                    
                    <div className="flex items-center gap-3 flex-1">
                      <img 
                        src={fan.avatarUrl} 
                        alt={fan.username}
                        className="w-10 h-10 rounded-full"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">@{fan.username}</p>
                          {getFanBadge(fan.engagementScore)}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{fan.engagementScore} score</span>
                          <span>{fan.streak} day streak</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-lg">#{index + 1}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(fan.lastActive).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Fan Details */}
              {selectedFan && (
                <Card className="mt-4">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <img 
                        src={selectedFan.avatarUrl} 
                        alt={selectedFan.username}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">@{selectedFan.username}</h3>
                          {getFanBadge(selectedFan.engagementScore)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Engagement Score: {selectedFan.engagementScore}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <Eye className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <div className="font-bold">{selectedFan.views}</div>
                        <div className="text-xs text-muted-foreground">Views</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <Heart className="w-5 h-5 text-red-600 mx-auto mb-1" />
                        <div className="font-bold">{selectedFan.reactions}</div>
                        <div className="text-xs text-muted-foreground">Reactions</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <MessageCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                        <div className="font-bold">{selectedFan.replies}</div>
                        <div className="text-xs text-muted-foreground">Replies</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-sm">Active streak: {selectedFan.streak} days</span>
                      </div>
                      <Button size="sm">View Profile</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}