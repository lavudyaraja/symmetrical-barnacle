import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share, 
  Users,
  TrendingUp,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  Download
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface StoryAnalytics {
  id: string;
  storyId: string;
  views: {
    total: number;
    unique: number;
    completionRate: number;
    dropOffPoints: Array<{
      time: number; // seconds
      percentage: number;
    }>;
    heatmap: Array<{
      time: string; // HH:MM
      views: number;
    }>;
  };
  reactions: {
    total: number;
    types: Record<string, number>;
    topReactions: Array<{
      emoji: string;
      count: number;
    }>;
  };
  replies: {
    total: number;
    topReplies: Array<{
      userId: string;
      username: string;
      content: string;
      timestamp: string;
    }>;
  };
  shares: {
    total: number;
    platforms: Record<string, number>;
  };
  demographics: {
    ageGroups: Record<string, number>;
    locations: Array<{
      country: string;
      count: number;
    }>;
    devices: Record<string, number>;
  };
  engagement: {
    avgTime: number; // seconds
    peakTime: string; // HH:MM
    retention: number; // percentage
  };
}

interface AdvancedStoryAnalyticsProps {
  storyId: string;
  timeRange?: '24h' | '7d' | '30d' | 'all';
  onExport?: (data: StoryAnalytics) => void;
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function AdvancedStoryAnalytics({
  storyId,
  timeRange = '24h',
  onExport,
  className = ''
}: AdvancedStoryAnalyticsProps) {
  const [analytics, setAnalytics] = useState<StoryAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'reactions' | 'replies' | 'shares'>('views');

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call to fetch analytics
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock analytics data
      const mockAnalytics: StoryAnalytics = {
        id: `analytics-${storyId}-${Date.now()}`,
        storyId,
        views: {
          total: 2456,
          unique: 1892,
          completionRate: 78,
          dropOffPoints: [
            { time: 2, percentage: 95 },
            { time: 5, percentage: 87 },
            { time: 8, percentage: 72 },
            { time: 12, percentage: 45 },
            { time: 15, percentage: 30 }
          ],
          heatmap: [
            { time: '08:00', views: 120 },
            { time: '12:00', views: 340 },
            { time: '16:00', views: 520 },
            { time: '20:00', views: 890 },
            { time: '00:00', views: 320 },
            { time: '04:00', views: 80 }
          ]
        },
        reactions: {
          total: 342,
          types: {
            '❤️': 156,
            '😂': 89,
            '😮': 45,
            '👏': 32,
            '🔥': 20
          },
          topReactions: [
            { emoji: '❤️', count: 156 },
            { emoji: '😂', count: 89 },
            { emoji: '😮', count: 45 },
            { emoji: '👏', count: 32 },
            { emoji: '🔥', count: 20 }
          ]
        },
        replies: {
          total: 67,
          topReplies: [
            {
              userId: 'user1',
              username: 'alex_jones',
              content: 'This looks amazing! Where was this taken?',
              timestamp: '2023-05-15T14:30:00Z'
            },
            {
              userId: 'user2',
              username: 'sarah_m',
              content: 'Beautiful sunset! 🌅',
              timestamp: '2023-05-15T14:32:00Z'
            },
            {
              userId: 'user3',
              username: 'mike_t',
              content: 'Wish I was there with you!',
              timestamp: '2023-05-15T14:35:00Z'
            }
          ]
        },
        shares: {
          total: 89,
          platforms: {
            instagram: 34,
            twitter: 28,
            facebook: 15,
            snapchat: 12
          }
        },
        demographics: {
          ageGroups: {
            '18-24': 45,
            '25-34': 32,
            '35-44': 15,
            '45+': 8
          },
          locations: [
            { country: 'United States', count: 890 },
            { country: 'United Kingdom', count: 456 },
            { country: 'Canada', count: 321 },
            { country: 'Australia', count: 234 },
            { country: 'Germany', count: 156 }
          ],
          devices: {
            mobile: 85,
            tablet: 10,
            desktop: 5
          }
        },
        engagement: {
          avgTime: 8.7,
          peakTime: '20:00',
          retention: 72
        }
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize on mount and when storyId/timeRange changes
  useEffect(() => {
    fetchAnalytics();
  }, [storyId, timeRange]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading analytics...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Story Analytics</h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {timeRange === '24h' ? 'Last 24 hours' : 
             timeRange === '7d' ? 'Last 7 days' :
             timeRange === '30d' ? 'Last 30 days' : 'All time'}
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          {onExport && (
            <Button variant="outline" size="sm" onClick={() => onExport(analytics)}>
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.views.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <Heart className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.reactions.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Reactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.replies.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Replies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Share className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.shares.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Shares</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Engagement Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{formatTime(analytics.engagement.avgTime)}</p>
              <p className="text-sm text-muted-foreground">Avg. View Time</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{analytics.engagement.retention}%</p>
              <p className="text-sm text-muted-foreground">Retention Rate</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{analytics.engagement.peakTime}</p>
              <p className="text-sm text-muted-foreground">Peak Engagement</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Detailed Analytics
            </div>
            <div className="flex gap-1">
              {(['views', 'reactions', 'replies', 'shares'] as const).map((metric) => (
                <Button
                  key={metric}
                  variant={selectedMetric === metric ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMetric(metric)}
                  className="text-xs capitalize"
                >
                  {metric}
                </Button>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Views Analytics */}
          {selectedMetric === 'views' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-4">View Completion Rate</h3>
                <div className="w-full bg-muted rounded-full h-4">
                  <div 
                    className="bg-primary h-4 rounded-full transition-all duration-500"
                    style={{ width: `${analytics.views.completionRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>0%</span>
                  <span className="font-medium">{analytics.views.completionRate}% completion</span>
                  <span>100%</span>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-4">View Heatmap</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.views.heatmap}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="views" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-4">Drop-off Points</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.views.dropOffPoints}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }} 
                      />
                      <YAxis 
                        label={{ value: 'Completion %', angle: -90, position: 'insideLeft' }} 
                      />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="percentage" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Reactions Analytics */}
          {selectedMetric === 'reactions' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-4">Reaction Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.reactions.topReactions}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ emoji, count }) => `${emoji} ${count}`}
                      >
                        {analytics.reactions.topReactions.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-4">Top Reactions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {analytics.reactions.topReactions.map((reaction, index) => (
                    <div key={index} className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl mb-1">{reaction.emoji}</div>
                      <div className="text-lg font-bold">{reaction.count}</div>
                      <div className="text-xs text-muted-foreground">reactions</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Replies Analytics */}
          {selectedMetric === 'replies' && (
            <div className="space-y-4">
              <h3 className="font-medium">Top Replies</h3>
              <div className="space-y-3">
                {analytics.replies.topReplies.map((reply, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">@{reply.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(reply.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{reply.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shares Analytics */}
          {selectedMetric === 'shares' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-4">Share Distribution by Platform</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(analytics.shares.platforms).map(([platform, count]) => ({
                      platform,
                      count
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="platform" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(analytics.shares.platforms).map(([platform, count]) => (
                  <div key={platform} className="p-3 bg-muted rounded-lg text-center">
                    <div className="font-bold text-lg">{count}</div>
                    <div className="text-sm capitalize">{platform}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demographics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Audience Demographics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-4">Age Distribution</h3>
            <div className="space-y-2">
              {Object.entries(analytics.demographics.ageGroups).map(([ageGroup, percentage]) => (
                <div key={ageGroup} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{ageGroup} years</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Top Locations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analytics.demographics.locations.map((location, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{location.country}</span>
                  </div>
                  <span className="font-medium">{location.count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}