import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TrendingUp, Hash, Users, Flame, Sparkles, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TrendingItem {
  id: string;
  text: string;
  count: number;
  growth: number;
  category: 'hashtag' | 'topic' | 'user';
}

export const TrendingSection: React.FC = () => {
  const [trendingData, setTrendingData] = useState<{
    hashtags: TrendingItem[];
    topics: TrendingItem[];
    users: TrendingItem[];
  }>({
    hashtags: [],
    topics: [],
    users: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrendingData();
  }, []);

  const fetchTrendingData = async () => {
    try {
      setIsLoading(true);

      // Fetch trending hashtags from the database
      const { data: hashtagsData } = await supabase
        .from('trending_hashtags')
        .select('*')
        .order('trend_score', { ascending: false })
        .limit(10);

      // Mock trending topics and users (in a real app, these would come from analytics)
      const mockTopics: TrendingItem[] = [
        { id: '1', text: 'AI Technology', count: 1250, growth: 15.5, category: 'topic' },
        { id: '2', text: 'Social Media', count: 980, growth: 8.2, category: 'topic' },
        { id: '3', text: 'Climate Change', count: 750, growth: 22.1, category: 'topic' },
        { id: '4', text: 'Web Development', count: 650, growth: 5.8, category: 'topic' },
        { id: '5', text: 'Mental Health', count: 580, growth: 12.3, category: 'topic' }
      ];

      const mockUsers: TrendingItem[] = [
        { id: '1', text: '@tech_innovator', count: 5200, growth: 25.6, category: 'user' },
        { id: '2', text: '@creative_mind', count: 3800, growth: 18.4, category: 'user' },
        { id: '3', text: '@wellness_guru', count: 2900, growth: 32.1, category: 'user' },
        { id: '4', text: '@code_wizard', count: 2100, growth: 14.7, category: 'user' },
        { id: '5', text: '@design_artist', count: 1850, growth: 21.3, category: 'user' }
      ];

      const processedHashtags: TrendingItem[] = hashtagsData?.map(h => ({
        id: h.id,
        text: h.hashtag,
        count: h.post_count,
        growth: Number(h.trend_score),
        category: 'hashtag' as const
      })) || [];

      setTrendingData({
        hashtags: processedHashtags,
        topics: mockTopics,
        users: mockUsers
      });
    } catch (error) {
      console.error('Error fetching trending data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="backdrop-blur-sm bg-card/80 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span>Trending Now</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="w-32 h-4 bg-muted rounded"></div>
                </div>
                <div className="w-16 h-4 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40">
          <Button
            variant="outline"
            size="lg"
            className="flex items-center space-x-2 bg-background/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 px-4 py-3 rounded-l-xl rounded-r-none border-r-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-medium">Trending</span>
              <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 px-2 py-1">
                <Sparkles className="w-3 h-3 mr-1" />
                AI
              </Badge>
            </div>
          </Button>
        </div>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span>Trending Now</span>
            <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Powered
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTrendingData}
          >
            Refresh
          </Button>
        </div>
        
        <div className="overflow-y-auto max-h-[60vh]">
          <Tabs defaultValue="hashtags" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="hashtags" className="flex items-center space-x-1">
                <Hash className="w-4 h-4" />
                <span>Hashtags</span>
              </TabsTrigger>
              <TabsTrigger value="topics" className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>Topics</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>People</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="hashtags" className="mt-4">
              <div className="space-y-3">
                {trendingData.hashtags.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Hash className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">{item.text}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{item.count.toLocaleString()}</div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-500">+{item.growth.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="topics" className="mt-4">
              <div className="space-y-3">
                {trendingData.topics.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="font-medium">{item.text}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{item.count.toLocaleString()}</div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-500">+{item.growth.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="users" className="mt-4">
              <div className="space-y-3">
                {trendingData.users.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-purple-500" />
                        <span className="font-medium">{item.text}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{item.count.toLocaleString()}</div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-500">+{item.growth.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};