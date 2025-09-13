import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Music, 
  Sticker, 
  Image, 
  Sparkles,
  RefreshCw,
  Wand2,
  Heart,
  Smile,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface ContentAnalysis {
  text?: string;
  mediaFile?: File;
  mediaUrl?: string;
  mediaType: 'image' | 'video' | 'text';
  caption?: string;
  hashtags?: string[];
  existingStickers?: string[];
  existingMusic?: string;
}

interface SmartSuggestion {
  id: string;
  type: 'sticker' | 'music' | 'gif' | 'effect' | 'text';
  category: string;
  title: string;
  description: string;
  confidence: number;
  previewUrl?: string;
  icon: React.ReactNode;
  reason: string;
  applyAction: () => void;
}

interface AISmartSuggestionsProps {
  content: ContentAnalysis;
  onSuggestionApply: (suggestion: SmartSuggestion) => void;
  className?: string;
}

export function AISmartSuggestions({
  content,
  onSuggestionApply,
  className = ''
}: AISmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Analyze content and generate smart suggestions
  const analyzeContent = async () => {
    setIsAnalyzing(true);
    
    try {
      // Simulate AI content analysis
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Mock suggestions based on content analysis
      const mockSuggestions: SmartSuggestion[] = [
        // Stickers
        {
          id: 'sticker-1',
          type: 'sticker',
          category: 'emotions',
          title: 'Happy Face',
          description: 'Express joy and happiness',
          confidence: 92,
          previewUrl: '/api/stickers/happy-face',
          icon: <Smile className="w-4 h-4" />,
          reason: 'Matches the positive tone in your content',
          applyAction: () => onSuggestionApply(mockSuggestions[0])
        },
        {
          id: 'sticker-2',
          type: 'sticker',
          category: 'reactions',
          title: 'Heart Eyes',
          description: 'Show love and appreciation',
          confidence: 88,
          previewUrl: '/api/stickers/heart-eyes',
          icon: <Heart className="w-4 h-4" />,
          reason: 'Perfect for expressing admiration',
          applyAction: () => onSuggestionApply(mockSuggestions[1])
        },
        // Music
        {
          id: 'music-1',
          type: 'music',
          category: 'mood',
          title: 'Chill Vibes',
          description: 'Relaxed and uplifting melody',
          confidence: 95,
          previewUrl: '/api/music/chill-vibes',
          icon: <Music className="w-4 h-4" />,
          reason: 'Complements your content\'s peaceful mood',
          applyAction: () => onSuggestionApply(mockSuggestions[2])
        },
        {
          id: 'music-2',
          type: 'music',
          category: 'energy',
          title: 'Upbeat Pop',
          description: 'Energetic and catchy tune',
          confidence: 87,
          previewUrl: '/api/music/upbeat-pop',
          icon: <Zap className="w-4 h-4" />,
          reason: 'Boosts the energy level of your content',
          applyAction: () => onSuggestionApply(mockSuggestions[3])
        },
        // GIFs
        {
          id: 'gif-1',
          type: 'gif',
          category: 'reactions',
          title: 'Celebration',
          description: 'Confetti and party animation',
          confidence: 90,
          previewUrl: '/api/gifs/celebration',
          icon: <Sparkles className="w-4 h-4" />,
          reason: 'Perfect for celebrating achievements',
          applyAction: () => onSuggestionApply(mockSuggestions[4])
        },
        // Text effects
        {
          id: 'effect-1',
          type: 'effect',
          category: 'text',
          title: 'Typewriter',
          description: 'Classic typing animation',
          confidence: 85,
          icon: <Wand2 className="w-4 h-4" />,
          reason: 'Adds retro charm to text content',
          applyAction: () => onSuggestionApply(mockSuggestions[5])
        }
      ];

      // Filter by selected category
      const filteredSuggestions = selectedCategory === 'all' 
        ? mockSuggestions 
        : mockSuggestions.filter(s => s.category === selectedCategory);

      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.error('Failed to generate smart suggestions');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-analyze when content changes
  useEffect(() => {
    if (content.text || content.mediaFile || content.mediaUrl) {
      analyzeContent();
    }
  }, [content]);

  const typeIcons = {
    sticker: Sticker,
    music: Music,
    gif: Image,
    effect: Wand2,
    text: Sparkles
  };

  const typeColors = {
    sticker: 'bg-pink-100 text-pink-700 border-pink-200',
    music: 'bg-purple-100 text-purple-700 border-purple-200',
    gif: 'bg-blue-100 text-blue-700 border-blue-200',
    effect: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    text: 'bg-green-100 text-green-700 border-green-200'
  };

  const categoryColors = {
    emotions: 'bg-red-100 text-red-700 border-red-200',
    reactions: 'bg-orange-100 text-orange-700 border-orange-200',
    mood: 'bg-blue-100 text-blue-700 border-blue-200',
    energy: 'bg-green-100 text-green-700 border-green-200',
    text: 'bg-purple-100 text-purple-700 border-purple-200'
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5" />
            AI Smart Suggestions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            AI-powered recommendations to enhance your story content
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Suggestion Categories</label>
            <div className="flex flex-wrap gap-2">
              {['all', 'emotions', 'reactions', 'mood', 'energy', 'text'].map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Analyze Button */}
          <Button
            onClick={analyzeContent}
            disabled={isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analyzing content...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Get Smart Suggestions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            AI Recommendations ({suggestions.length})
          </h3>
          
          <div className="space-y-3">
            {suggestions.map((suggestion) => {
              const TypeIcon = typeIcons[suggestion.type];
              
              return (
                <Card 
                  key={suggestion.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Suggestion Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            {suggestion.icon}
                          </div>
                          <div>
                            <h4 className="font-medium">{suggestion.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {suggestion.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`${typeColors[suggestion.type]} text-xs capitalize`}
                          >
                            <TypeIcon className="w-3 h-3 mr-1" />
                            {suggestion.type}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`${categoryColors[suggestion.category]} text-xs capitalize`}
                          >
                            {suggestion.category}
                          </Badge>
                        </div>
                      </div>

                      {/* Confidence and Reason */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">AI Confidence</span>
                          <Badge variant="secondary" className="text-xs">
                            {suggestion.confidence}% match
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                          <Sparkles className="w-3 h-3 text-blue-500" />
                          <span className="text-blue-800">{suggestion.reason}</span>
                        </div>
                      </div>

                      {/* Preview (if available) */}
                      {suggestion.previewUrl && (
                        <div className="rounded-lg overflow-hidden border bg-muted">
                          <img 
                            src={suggestion.previewUrl} 
                            alt={suggestion.title}
                            className="w-full h-24 object-cover"
                          />
                        </div>
                      )}

                      {/* Apply Button */}
                      <Button
                        onClick={suggestion.applyAction}
                        className="w-full"
                        size="sm"
                      >
                        Apply {suggestion.type === 'music' ? 'Track' : 
                               suggestion.type === 'sticker' ? 'Sticker' : 
                               suggestion.type === 'gif' ? 'GIF' : 'Effect'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}