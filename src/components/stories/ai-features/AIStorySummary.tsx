import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Sparkles, 
  Clock, 
  Users, 
  TrendingUp,
  Copy,
  RefreshCw,
  BarChart3,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

interface StorySummary {
  id: string;
  type: 'tldr' | 'highlights' | 'engagement' | 'timeline';
  title: string;
  content: string;
  metrics?: {
    views: number;
    reactions: number;
    replies: number;
    shares: number;
  };
  keyMoments?: string[];
  tags?: string[];
}

interface AIStorySummaryProps {
  stories: Array<{
    id: string;
    content: string;
    media_url: string;
    media_type: string;
    created_at: string;
    views_count?: number;
  }>;
  timeRange: '24h' | '7d' | '30d' | 'all';
  onSummaryGenerate?: (summary: StorySummary) => void;
  className?: string;
}

export function AIStorySummary({
  stories,
  timeRange = '24h',
  onSummaryGenerate,
  className = ''
}: AIStorySummaryProps) {
  const [summaries, setSummaries] = useState<StorySummary[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSummaryType, setSelectedSummaryType] = useState<StorySummary['type']>('tldr');

  // Generate AI summaries based on story sequence
  const generateStorySummaries = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate AI analysis of story sequence
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const mockSummaries: StorySummary[] = [
        {
          id: 'tldr-1',
          type: 'tldr',
          title: 'Story Sequence TL;DR',
          content: 'A productive day filled with work achievements, a coffee break with friends, and ending with a beautiful sunset view. The mood progressed from focused energy to social connection to peaceful reflection.',
          metrics: {
            views: stories.reduce((sum, story) => sum + (story.views_count || 0), 0),
            reactions: 45,
            replies: 12,
            shares: 8
          },
          keyMoments: [
            'Morning productivity boost',
            'Social coffee meetup',
            'Sunset reflection time'
          ],
          tags: ['#ProductiveDay', '#SocialVibes', '#Mindfulness']
        },
        {
          id: 'highlights-1',
          type: 'highlights',
          title: 'Top Story Moments',
          content: 'Your most engaging content today featured authentic moments of connection and achievement. The coffee shop story got the most reactions, while the sunset post resonated deeply with your audience.',
          keyMoments: [
            'Coffee shop story: 89% engagement rate',
            'Work achievement post: 76% engagement rate',
            'Sunset reflection: 92% save rate'
          ]
        },
        {
          id: 'engagement-1',
          type: 'engagement',
          title: 'Engagement Insights',
          content: 'Your stories today showed strong authentic connection with your audience. People responded most to genuine moments and scenic content. Posting frequency was optimal for engagement.',
          metrics: {
            views: 1247,
            reactions: 156,
            replies: 23,
            shares: 34
          }
        },
        {
          id: 'timeline-1',
          type: 'timeline',
          title: 'Day Timeline Recap',
          content: 'Morning: Work focus and productivity | Afternoon: Social connection and collaboration | Evening: Personal reflection and nature appreciation',
          keyMoments: [
            '9:00 AM - Started with motivation',
            '2:00 PM - Connected with friends',
            '7:00 PM - Captured sunset moment'
          ]
        }
      ];

      // Filter by selected type
      const filteredSummaries = selectedSummaryType === 'tldr' 
        ? mockSummaries 
        : mockSummaries.filter(s => s.type === selectedSummaryType);

      setSummaries(filteredSummaries);
    } catch (error) {
      console.error('Error generating summaries:', error);
      toast.error('Failed to generate story summaries');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate on stories change
  useEffect(() => {
    if (stories.length > 0) {
      generateStorySummaries();
    }
  }, [stories, selectedSummaryType, timeRange]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Summary copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleSummarySelect = (summary: StorySummary) => {
    onSummaryGenerate?.(summary);
    toast.success('Summary selected!');
  };

  const summaryTypeIcons = {
    tldr: FileText,
    highlights: Sparkles,
    engagement: TrendingUp,
    timeline: Clock
  };

  const summaryTypeColors = {
    tldr: 'bg-blue-100 text-blue-700 border-blue-200',
    highlights: 'bg-purple-100 text-purple-700 border-purple-200',
    engagement: 'bg-green-100 text-green-700 border-green-200',
    timeline: 'bg-orange-100 text-orange-700 border-orange-200'
  };

  if (stories.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            No stories available for summary generation
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5" />
            AI Story Summaries
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            AI-generated insights and summaries for your story sequences
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Summary Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'tldr', label: 'TL;DR Summary' },
                { type: 'highlights', label: 'Top Highlights' },
                { type: 'engagement', label: 'Engagement Analysis' },
                { type: 'timeline', label: 'Timeline Recap' }
              ].map(({ type, label }) => (
                <Button
                  key={type}
                  variant={selectedSummaryType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSummaryType(type as StorySummary['type'])}
                  className="text-xs"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Time Range Info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Analyzing {stories.length} stories</span>
            </div>
            <Badge variant="secondary">
              {timeRange === '24h' ? 'Last 24 hours' : 
               timeRange === '7d' ? 'Last 7 days' :
               timeRange === '30d' ? 'Last 30 days' : 'All time'}
            </Badge>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateStorySummaries}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating AI summaries...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {summaries.length > 0 ? 'Regenerate Summaries' : 'Generate Smart Summaries'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Summaries */}
      {summaries.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Generated Summaries
          </h3>
          
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {summaries.map((summary) => {
                const IconComponent = summaryTypeIcons[summary.type];
                
                return (
                  <Card 
                    key={summary.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Summary Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-4 h-4" />
                            <h4 className="font-medium">{summary.title}</h4>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`${summaryTypeColors[summary.type]} text-xs`}
                            >
                              {summary.type.toUpperCase()}
                            </Badge>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(summary.content);
                              }}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Summary Content */}
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {summary.content}
                        </p>

                        {/* Key Moments */}
                        {summary.keyMoments && summary.keyMoments.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Key Moments
                            </h5>
                            <div className="space-y-1">
                              {summary.keyMoments.map((moment, index) => (
                                <div key={index} className="text-xs p-2 bg-muted rounded flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                  {moment}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Metrics */}
                        {summary.metrics && (
                          <div className="grid grid-cols-4 gap-3 pt-2 border-t">
                            <div className="text-center">
                              <div className="text-lg font-bold text-primary">{summary.metrics.views}</div>
                              <div className="text-xs text-muted-foreground">Views</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600">{summary.metrics.reactions}</div>
                              <div className="text-xs text-muted-foreground">Reactions</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">{summary.metrics.replies}</div>
                              <div className="text-xs text-muted-foreground">Replies</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-purple-600">{summary.metrics.shares}</div>
                              <div className="text-xs text-muted-foreground">Shares</div>
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {summary.tags && summary.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {summary.tags.map((tag, index) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Use Summary Button */}
                        <Button
                          onClick={() => handleSummarySelect(summary)}
                          className="w-full"
                          size="sm"
                        >
                          Use This Summary
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}