import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Clock, 
  Users, 
  Zap,
  Calendar,
  BarChart3,
  Target,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface EngagementPrediction {
  score: number;
  confidence: number;
  factors: {
    timeOptimal: number;
    contentQuality: number;
    audienceMatch: number;
    trendingTopics: number;
    visualAppeal: number;
  };
  bestPostingTimes: Array<{
    time: string;
    score: number;
    reason: string;
  }>;
  recommendations: string[];
  estimatedMetrics: {
    views: { min: number; max: number; expected: number };
    reactions: { min: number; max: number; expected: number };
    shares: { min: number; max: number; expected: number };
  };
}

interface AIEngagementPredictionProps {
  mediaFile?: File;
  mediaUrl?: string;
  mediaType: 'image' | 'video' | 'text';
  caption?: string;
  hashtags?: string[];
  currentTime?: Date;
  userAnalytics?: {
    averageViews: number;
    peakHours: string[];
    audienceTimezone: string;
  };
  onPredictionUpdate?: (prediction: EngagementPrediction) => void;
  className?: string;
}

export function AIEngagementPrediction({
  mediaFile,
  mediaUrl,
  mediaType,
  caption = '',
  hashtags = [],
  currentTime = new Date(),
  userAnalytics,
  onPredictionUpdate,
  className = ''
}: AIEngagementPredictionProps) {
  const [prediction, setPrediction] = useState<EngagementPrediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPostingTime, setSelectedPostingTime] = useState<string | null>(null);

  // Analyze content and predict engagement
  const analyzeEngagement = async () => {
    setIsAnalyzing(true);
    
    try {
      // Simulate AI engagement analysis
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock prediction based on various factors
      const mockPrediction: EngagementPrediction = {
        score: 87,
        confidence: 92,
        factors: {
          timeOptimal: 95, // Excellent timing
          contentQuality: 88, // High quality content
          audienceMatch: 82, // Good audience alignment
          trendingTopics: 75, // Some trending elements
          visualAppeal: 90 // Strong visual content
        },
        bestPostingTimes: [
          {
            time: '7:30 PM',
            score: 95,
            reason: 'Peak engagement time for your audience'
          },
          {
            time: '12:00 PM',
            score: 88,
            reason: 'Lunch break browsing window'
          },
          {
            time: '9:00 AM',
            score: 82,
            reason: 'Morning commute engagement spike'
          }
        ],
        recommendations: [
          'Consider posting during peak hours (7-8 PM) for maximum reach',
          'Add 2-3 more trending hashtags to boost discoverability',
          'Your visual content quality is excellent - leverage this strength',
          'Engagement typically increases 40% when posted on weekends',
          'Consider adding a call-to-action to increase interaction rates'
        ],
        estimatedMetrics: {
          views: { min: 2400, max: 4200, expected: 3200 },
          reactions: { min: 180, max: 420, expected: 280 },
          shares: { min: 25, max: 85, expected: 45 }
        }
      };

      setPrediction(mockPrediction);
      onPredictionUpdate?.(mockPrediction);
    } catch (error) {
      console.error('Error analyzing engagement:', error);
      toast.error('Failed to analyze engagement potential');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-analyze when content changes
  useEffect(() => {
    if (mediaFile || mediaUrl || caption) {
      analyzeEngagement();
    }
  }, [mediaFile, mediaUrl, caption, hashtags]);

  const handleTimeSelect = (time: string) => {
    setSelectedPostingTime(time);
    toast.success(`Optimal posting time selected: ${time}`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5" />
            AI Engagement Prediction
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            AI-powered analysis to predict and optimize your story's engagement potential
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAnalyzing ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Analyzing engagement potential...
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Considering timing, content quality, and audience behavior
                </p>
              </div>
            </div>
          ) : prediction ? (
            <>
              {/* Overall Score */}
              <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-purple-100 rounded-lg">
                <div className={`text-4xl font-bold mb-2 ${getScoreColor(prediction.score)}`}>
                  {prediction.score}%
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Predicted Engagement Score
                </p>
                <Badge variant="secondary" className="text-xs">
                  {prediction.confidence}% confidence
                </Badge>
              </div>

              {/* Engagement Factors */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Engagement Factors
                </h4>
                
                {Object.entries(prediction.factors).map(([factor, score]) => (
                  <div key={factor} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize font-medium">
                        {factor.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className={`font-bold ${getScoreColor(score)}`}>
                        {score}%
                      </span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                ))}
              </div>

              {/* Best Posting Times */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Optimal Posting Times
                </h4>
                
                <div className="space-y-2">
                  {prediction.bestPostingTimes.map((timeSlot, index) => (
                    <Card 
                      key={index}
                      className={`cursor-pointer transition-all ${
                        selectedPostingTime === timeSlot.time 
                          ? 'ring-2 ring-primary border-primary' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => handleTimeSelect(timeSlot.time)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getScoreBg(timeSlot.score)}`}>
                              <div className={`w-full h-full rounded-full ${
                                timeSlot.score >= 85 ? 'bg-green-500' :
                                timeSlot.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                              }`} />
                            </div>
                            <div>
                              <div className="font-medium">{timeSlot.time}</div>
                              <div className="text-xs text-muted-foreground">
                                {timeSlot.reason}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className={`font-bold ${getScoreColor(timeSlot.score)}`}>
                              {timeSlot.score}%
                            </div>
                            {selectedPostingTime === timeSlot.time && (
                              <Badge variant="default" className="text-xs mt-1">
                                Selected
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Estimated Metrics */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Predicted Performance
                </h4>
                
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(prediction.estimatedMetrics).map(([metric, values]) => (
                    <div key={metric} className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xl font-bold text-primary">
                        {values.expected.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize mb-1">
                        {metric}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {values.min.toLocaleString()} - {values.max.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Recommendations
                </h4>
                
                <div className="space-y-2">
                  {prediction.recommendations.map((recommendation, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      <p className="text-sm text-blue-800">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <Button onClick={analyzeEngagement} className="w-full">
              <TrendingUp className="w-4 h-4 mr-2" />
              Predict Engagement Performance
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}