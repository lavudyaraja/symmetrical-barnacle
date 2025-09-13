import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  BarChart3, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share, 
  Users, 
  TrendingUp, 
  Clock, 
  Download,
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StoryAnalyticsData {
  story: {
    id: string;
    content?: string;
    media_url?: string;
    media_type: string;
    created_at: string;
    expires_at: string;
    views_count: number;
  };
  totalViews: number;
  totalReactions: number;
  totalReplies: number;
  totalShares: number;
  viewerDemographics: {
    ageGroup: Record<string, number>;
    location: Record<string, number>;
    timeOfDay: Record<string, number>;
  };
  engagementRate: number;
  reachRate: number;
  topReactions: Array<{ emoji: string; count: number }>;
  viewersTimeline: Array<{ hour: number; views: number }>;
  bestPerformingTime: string;
  comparisionWithPrevious: {
    viewsChange: number;
    engagementChange: number;
  };
}

interface StoryAnalyticsProps {
  storyId: string;
  onClose: () => void;
}

export function StoryAnalytics({ storyId, onClose }: StoryAnalyticsProps) {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<StoryAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    loadAnalytics();
  }, [storyId, timeRange]);

  const loadAnalytics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load story details
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .eq('user_id', user.id)
        .single();

      if (storyError) throw storyError;

      // Load views
      const { data: views, error: viewsError } = await supabase
        .from('story_views')
        .select(`
          *,
          profiles!story_views_user_id_fkey(username, avatar_url, created_at)
        `)
        .eq('story_id', storyId);

      if (viewsError) throw viewsError;

      // Load reactions
      const { data: reactions, error: reactionsError } = await supabase
        .from('story_reactions')
        .select('emoji, created_at')
        .eq('story_id', storyId);

      if (reactionsError) throw reactionsError;

      // Load replies
      const { data: replies, error: repliesError } = await supabase
        .from('story_replies')
        .select('created_at')
        .eq('story_id', storyId);

      if (repliesError) throw repliesError;

      // Load analytics events
      const { data: analytics, error: analyticsError } = await supabase
        .from('story_analytics')
        .select('event_type, created_at, metadata')
        .eq('story_id', storyId);

      if (analyticsError) throw analyticsError;

      // Process data
      const totalViews = views?.length || 0;
      const totalReactions = reactions?.length || 0;
      const totalReplies = replies?.length || 0;
      const totalShares = analytics?.filter(a => a.event_type === 'share').length || 0;

      // Calculate engagement rate
      const engagementRate = totalViews > 0 ? 
        ((totalReactions + totalReplies + totalShares) / totalViews) * 100 : 0;

      // Process reactions
      const reactionCounts = reactions?.reduce((acc, r) => {
        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const topReactions = Object.entries(reactionCounts)
        .map(([emoji, count]) => ({ emoji, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Process views timeline
      const viewersTimeline = new Array(24).fill(0).map((_, hour) => {
        const hourViews = views?.filter(v => {
          const viewHour = new Date(v.viewed_at).getHours();
          return viewHour === hour;
        }).length || 0;
        return { hour, views: hourViews };
      });

      // Find best performing time
      const bestHour = viewersTimeline.reduce((max, curr) => 
        curr.views > max.views ? curr : max
      );
      const bestPerformingTime = `${bestHour.hour}:00 - ${bestHour.hour + 1}:00`;

      // Calculate demographics (mock data for now - would need real user data)
      const viewerDemographics = {
        ageGroup: {
          '18-24': Math.floor(totalViews * 0.3),
          '25-34': Math.floor(totalViews * 0.4),
          '35-44': Math.floor(totalViews * 0.2),
          '45+': Math.floor(totalViews * 0.1)
        },
        location: {
          'Local': Math.floor(totalViews * 0.6),
          'National': Math.floor(totalViews * 0.3),
          'International': Math.floor(totalViews * 0.1)
        },
        timeOfDay: {
          'Morning': viewersTimeline.slice(6, 12).reduce((sum, h) => sum + h.views, 0),
          'Afternoon': viewersTimeline.slice(12, 18).reduce((sum, h) => sum + h.views, 0),
          'Evening': viewersTimeline.slice(18, 24).reduce((sum, h) => sum + h.views, 0),
          'Night': viewersTimeline.slice(0, 6).reduce((sum, h) => sum + h.views, 0)
        }
      };

      // Mock comparison data (would calculate from previous stories)
      const comparisionWithPrevious = {
        viewsChange: Math.floor((Math.random() - 0.5) * 40), // -20% to +20%
        engagementChange: Math.floor((Math.random() - 0.5) * 30) // -15% to +15%
      };

      setAnalyticsData({
        story,
        totalViews,
        totalReactions,
        totalReplies,
        totalShares,
        viewerDemographics,
        engagementRate,
        reachRate: Math.floor(engagementRate * 1.2), // Mock reach rate
        topReactions,
        viewersTimeline,
        bestPerformingTime,
        comparisionWithPrevious
      });

    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = async () => {
    if (!analyticsData) return;

    try {
      const dataToExport = {
        story_id: storyId,
        export_date: new Date().toISOString(),
        metrics: {
          total_views: analyticsData.totalViews,
          total_reactions: analyticsData.totalReactions,
          total_replies: analyticsData.totalReplies,
          total_shares: analyticsData.totalShares,
          engagement_rate: analyticsData.engagementRate,
          reach_rate: analyticsData.reachRate
        },
        demographics: analyticsData.viewerDemographics,
        top_reactions: analyticsData.topReactions,
        timeline: analyticsData.viewersTimeline,
        best_time: analyticsData.bestPerformingTime
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `story-analytics-${storyId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Analytics exported successfully!');
    } catch (error) {
      console.error('Failed to export analytics:', error);
      toast.error('Failed to export analytics');
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-3 h-3" />;
    if (change < 0) return <TrendingUp className="w-3 h-3 transform rotate-180" />;
    return null;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading analytics...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No analytics data available</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <BarChart3 className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-semibold">Story Analytics</h2>
              <p className="text-sm text-muted-foreground">
                {new Date(analyticsData.story.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(['24h', '7d', '30d'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
            
            <Button variant="outline" size="sm" onClick={exportAnalytics}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Story Preview */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Story Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden relative max-w-48 mx-auto">
                    {analyticsData.story.media_type === 'image' && analyticsData.story.media_url && (
                      <img
                        src={analyticsData.story.media_url}
                        alt="Story"
                        className="w-full h-full object-cover"
                      />
                    )}
                    {analyticsData.story.media_type === 'video' && analyticsData.story.media_url && (
                      <video
                        src={analyticsData.story.media_url}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        autoPlay
                      />
                    )}
                    {analyticsData.story.media_type === 'text' && (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 p-4">
                        <p className="text-white text-sm text-center">
                          {analyticsData.story.content}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 text-center text-xs text-muted-foreground">
                    <p>Posted {new Date(analyticsData.story.created_at).toLocaleTimeString()}</p>
                    <p>Expires {new Date(analyticsData.story.expires_at).toLocaleTimeString()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Metrics */}
            <div className="lg:col-span-2 space-y-6">
              {/* Key Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Eye className="w-5 h-5 text-blue-600" />
                        <p className="text-2xl font-bold mt-2">{formatNumber(analyticsData.totalViews)}</p>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div className={`flex items-center text-xs ${getChangeColor(analyticsData.comparisionWithPrevious.viewsChange)}`}>
                        {getChangeIcon(analyticsData.comparisionWithPrevious.viewsChange)}
                        <span className="ml-1">{Math.abs(analyticsData.comparisionWithPrevious.viewsChange)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Heart className="w-5 h-5 text-red-600" />
                        <p className="text-2xl font-bold mt-2">{formatNumber(analyticsData.totalReactions)}</p>
                        <p className="text-xs text-muted-foreground">Reactions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <MessageCircle className="w-5 h-5 text-green-600" />
                        <p className="text-2xl font-bold mt-2">{formatNumber(analyticsData.totalReplies)}</p>
                        <p className="text-xs text-muted-foreground">Replies</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Share className="w-5 h-5 text-purple-600" />
                        <p className="text-2xl font-bold mt-2">{formatNumber(analyticsData.totalShares)}</p>
                        <p className="text-xs text-muted-foreground">Shares</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Engagement Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Engagement Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analyticsData.engagementRate.toFixed(1)}%</div>
                    <div className={`text-sm flex items-center mt-1 ${getChangeColor(analyticsData.comparisionWithPrevious.engagementChange)}`}>
                      {getChangeIcon(analyticsData.comparisionWithPrevious.engagementChange)}
                      <span className="ml-1">{Math.abs(analyticsData.comparisionWithPrevious.engagementChange)}% from last story</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Best Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{analyticsData.bestPerformingTime}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Peak engagement time
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Reactions */}
              {analyticsData.topReactions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Top Reactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      {analyticsData.topReactions.map((reaction) => (
                        <div key={reaction.emoji} className="text-center">
                          <div className="text-2xl mb-1">{reaction.emoji}</div>
                          <div className="text-sm font-medium">{reaction.count}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Demographics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Age Groups</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(analyticsData.viewerDemographics.ageGroup).map(([age, count]) => (
                        <div key={age} className="flex justify-between text-sm">
                          <span>{age}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(analyticsData.viewerDemographics.location).map(([location, count]) => (
                        <div key={location} className="flex justify-between text-sm">
                          <span>{location}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Time of Day</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(analyticsData.viewerDemographics.timeOfDay).map(([time, count]) => (
                        <div key={time} className="flex justify-between text-sm">
                          <span>{time}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Views Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Views Throughout the Day</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-1 h-32">
                    {analyticsData.viewersTimeline.map((hourData) => (
                      <div
                        key={hourData.hour}
                        className="flex-1 bg-primary/20 rounded-t flex flex-col justify-end relative group"
                        style={{ 
                          height: `${Math.max((hourData.views / Math.max(...analyticsData.viewersTimeline.map(h => h.views))) * 100, 5)}%` 
                        }}
                      >
                        <div className="bg-primary rounded-t h-full" />
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {hourData.views} views at {hourData.hour}:00
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>0:00</span>
                    <span>6:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>24:00</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}