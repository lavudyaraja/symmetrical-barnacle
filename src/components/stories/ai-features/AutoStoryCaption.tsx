import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, RefreshCw, Copy, Wand2, Hash, Heart, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface CaptionSuggestion {
  id: string;
  text: string;
  style: 'trendy' | 'casual' | 'professional' | 'funny' | 'inspirational';
  hashtags: string[];
  confidence: number;
}

interface AutoStoryCaptionProps {
  mediaFile?: File;
  mediaUrl?: string;
  mediaType: 'image' | 'video' | 'text';
  currentCaption?: string;
  onCaptionSelect: (caption: string, hashtags: string[]) => void;
  className?: string;
}

export function AutoStoryCaption({
  mediaFile,
  mediaUrl,
  mediaType,
  currentCaption = '',
  onCaptionSelect,
  className = ''
}: AutoStoryCaptionProps) {
  const [suggestions, setSuggestions] = useState<CaptionSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string>('trendy');
  const [customPrompt, setCustomPrompt] = useState('');

  // Generate captions based on media content
  const generateCaptions = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate AI analysis of media content
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockSuggestions: CaptionSuggestion[] = [
        {
          id: '1',
          text: 'Living my best life ✨',
          style: 'trendy',
          hashtags: ['#BestLife', '#VibeCheck', '#MainCharacter', '#GlowUp'],
          confidence: 92
        },
        {
          id: '2',
          text: 'Just another Tuesday but make it aesthetic 🌟',
          style: 'casual',
          hashtags: ['#Aesthetic', '#TuesdayVibes', '#Mood', '#SimpleJoys'],
          confidence: 87
        },
        {
          id: '3',
          text: 'Professional mood: Activated 💼',
          style: 'professional',
          hashtags: ['#WorkMode', '#Professional', '#Goals', '#Productivity'],
          confidence: 85
        },
        {
          id: '4',
          text: 'When you realize you\'re the main character in your own story 😎',
          style: 'funny',
          hashtags: ['#MainCharacter', '#PlotTwist', '#Reality', '#SelfLove'],
          confidence: 89
        },
        {
          id: '5',
          text: 'Every moment is a chance to start fresh 🌅',
          style: 'inspirational',
          hashtags: ['#NewBeginnings', '#Inspiration', '#Growth', '#Mindfulness'],
          confidence: 91
        }
      ];

      // Filter by selected style if specified
      const filteredSuggestions = selectedStyle === 'all' 
        ? mockSuggestions
        : mockSuggestions.filter(s => s.style === selectedStyle);

      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('Error generating captions:', error);
      toast.error('Failed to generate captions');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate on mount if media is provided
  useEffect(() => {
    if (mediaFile || mediaUrl) {
      generateCaptions();
    }
  }, [mediaFile, mediaUrl, selectedStyle]);

  const handleCaptionSelect = (suggestion: CaptionSuggestion) => {
    onCaptionSelect(suggestion.text, suggestion.hashtags);
    toast.success('Caption selected!');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const styleIcons = {
    trendy: Zap,
    casual: Heart,
    professional: Wand2,
    funny: '😄',
    inspirational: Sparkles
  };

  const styleColors = {
    trendy: 'bg-pink-100 text-pink-700 border-pink-200',
    casual: 'bg-blue-100 text-blue-700 border-blue-200',
    professional: 'bg-gray-100 text-gray-700 border-gray-200',
    funny: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    inspirational: 'bg-purple-100 text-purple-700 border-purple-200'
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5" />
            AI Story Captions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Style Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Caption Style</label>
            <div className="flex flex-wrap gap-2">
              {['trendy', 'casual', 'professional', 'funny', 'inspirational'].map((style) => (
                <Button
                  key={style}
                  variant={selectedStyle === style ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStyle(style)}
                  className="capitalize"
                >
                  {style}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom Context (Optional)</label>
            <Textarea
              placeholder="Add context for better captions (e.g., 'celebrating my promotion', 'weekend vibes')..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateCaptions}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating captions...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {suggestions.length > 0 ? 'Regenerate Captions' : 'Generate Smart Captions'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Caption Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            AI Caption Suggestions
          </h3>
          
          {suggestions.map((suggestion) => {
            const IconComponent = styleIcons[suggestion.style];
            
            return (
              <Card 
                key={suggestion.id} 
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary"
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Caption Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`${styleColors[suggestion.style]} capitalize`}
                        >
                          {typeof IconComponent === 'string' ? (
                            <span className="mr-1">{IconComponent}</span>
                          ) : (
                            <IconComponent className="w-3 h-3 mr-1" />
                          )}
                          {suggestion.style}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.confidence}% match
                        </Badge>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(suggestion.text)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Caption Text */}
                    <p className="text-sm leading-relaxed font-medium">
                      {suggestion.text}
                    </p>

                    {/* Hashtags */}
                    {suggestion.hashtags.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Hash className="w-3 h-3" />
                          Suggested Hashtags
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {suggestion.hashtags.map((hashtag, index) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {hashtag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Select Button */}
                    <Button
                      onClick={() => handleCaptionSelect(suggestion)}
                      className="w-full"
                      size="sm"
                    >
                      Use This Caption
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}