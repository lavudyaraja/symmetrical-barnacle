import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Palette, 
  Sparkles, 
  Sun, 
  Moon, 
  Heart, 
  Smile, 
  Frown, 
  Zap,
  Camera,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface MoodAnalysis {
  primary_mood: string;
  mood_confidence: number;
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
  energy_level: 'low' | 'medium' | 'high';
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
}

interface FilterSuggestion {
  id: string;
  name: string;
  category: 'mood' | 'time' | 'energy' | 'aesthetic';
  intensity: number;
  icon: React.ReactNode;
  description: string;
  cssFilter: string;
  reason: string;
}

interface AIStoryMoodFiltersProps {
  mediaFile?: File;
  mediaUrl?: string;
  mediaType: 'image' | 'video' | 'text';
  onFilterApply: (filter: FilterSuggestion, intensity: number) => void;
  className?: string;
}

export function AIStoryMoodFilters({
  mediaFile,
  mediaUrl,
  mediaType,
  onFilterApply,
  className = ''
}: AIStoryMoodFiltersProps) {
  const [moodAnalysis, setMoodAnalysis] = useState<MoodAnalysis | null>(null);
  const [filterSuggestions, setFilterSuggestions] = useState<FilterSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterSuggestion | null>(null);
  const [filterIntensity, setFilterIntensity] = useState([70]);
  const [autoApply, setAutoApply] = useState(false);

  // Analyze media content for mood detection
  const analyzeMoodContent = async () => {
    setIsAnalyzing(true);
    
    try {
      // Simulate AI mood detection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock mood analysis results
      const mockAnalysis: MoodAnalysis = {
        primary_mood: 'happy',
        mood_confidence: 87,
        emotions: {
          joy: 75,
          sadness: 10,
          anger: 5,
          fear: 5,
          surprise: 15,
          disgust: 2
        },
        energy_level: 'high',
        time_of_day: 'afternoon'
      };

      setMoodAnalysis(mockAnalysis);
      generateFilterSuggestions(mockAnalysis);
    } catch (error) {
      console.error('Error analyzing mood:', error);
      toast.error('Failed to analyze mood');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate filter suggestions based on mood analysis
  const generateFilterSuggestions = (analysis: MoodAnalysis) => {
    const suggestions: FilterSuggestion[] = [];

    // Mood-based filters
    if (analysis.primary_mood === 'happy') {
      suggestions.push({
        id: 'warm-glow',
        name: 'Warm Glow',
        category: 'mood',
        intensity: 80,
        icon: <Sun className="w-4 h-4" />,
        description: 'Enhances the joyful mood with warm tones',
        cssFilter: 'sepia(0.3) saturate(1.2) brightness(1.1) contrast(1.05)',
        reason: 'Perfect for your happy mood!'
      });
    }

    if (analysis.emotions.joy > 60) {
      suggestions.push({
        id: 'vibrant-pop',
        name: 'Vibrant Pop',
        category: 'mood',
        intensity: 75,
        icon: <Sparkles className="w-4 h-4" />,
        description: 'Boosts colors to match your energy',
        cssFilter: 'saturate(1.4) contrast(1.1) brightness(1.05)',
        reason: 'Matches your vibrant energy!'
      });
    }

    // Energy-based filters
    if (analysis.energy_level === 'high') {
      suggestions.push({
        id: 'electric-blue',
        name: 'Electric Blue',
        category: 'energy',
        intensity: 65,
        icon: <Zap className="w-4 h-4" />,
        description: 'Cool blue tones for high energy moments',
        cssFilter: 'hue-rotate(15deg) saturate(1.3) brightness(1.1)',
        reason: 'Perfect for high-energy vibes!'
      });
    }

    // Time-based filters
    if (analysis.time_of_day === 'evening') {
      suggestions.push({
        id: 'golden-hour',
        name: 'Golden Hour',
        category: 'time',
        intensity: 70,
        icon: <Moon className="w-4 h-4" />,
        description: 'Warm evening light simulation',
        cssFilter: 'sepia(0.4) saturate(1.1) contrast(1.1) brightness(1.2)',
        reason: 'Captures that perfect evening light!'
      });
    }

    // Aesthetic filters
    suggestions.push({
      id: 'film-vintage',
      name: 'Film Vintage',
      category: 'aesthetic',
      intensity: 60,
      icon: <Camera className="w-4 h-4" />,
      description: 'Classic film photography look',
      cssFilter: 'sepia(0.2) contrast(1.2) brightness(0.9) saturate(0.8)',
      reason: 'Gives a timeless aesthetic!'
    });

    setFilterSuggestions(suggestions);
  };

  // Auto-analyze on media change
  useEffect(() => {
    if (mediaFile || mediaUrl) {
      analyzeMoodContent();
    }
  }, [mediaFile, mediaUrl]);

  // Auto-apply best filter if enabled
  useEffect(() => {
    if (autoApply && filterSuggestions.length > 0 && !selectedFilter) {
      const bestFilter = filterSuggestions[0]; // Highest intensity/confidence
      setSelectedFilter(bestFilter);
      onFilterApply(bestFilter, filterIntensity[0]);
    }
  }, [autoApply, filterSuggestions, selectedFilter]);

  const handleFilterSelect = (filter: FilterSuggestion) => {
    setSelectedFilter(filter);
    onFilterApply(filter, filterIntensity[0]);
    toast.success(`Applied ${filter.name} filter`);
  };

  const handleIntensityChange = (value: number[]) => {
    setFilterIntensity(value);
    if (selectedFilter) {
      onFilterApply(selectedFilter, value[0]);
    }
  };

  const getMoodIcon = (mood: string) => {
    const icons = {
      happy: <Smile className="w-4 h-4 text-yellow-500" />,
      sad: <Frown className="w-4 h-4 text-blue-500" />,
      excited: <Zap className="w-4 h-4 text-orange-500" />,
      calm: <Heart className="w-4 h-4 text-green-500" />,
      default: <Sparkles className="w-4 h-4 text-purple-500" />
    };
    return icons[mood] || icons.default;
  };

  const categoryColors = {
    mood: 'bg-pink-100 text-pink-700 border-pink-200',
    time: 'bg-orange-100 text-orange-700 border-orange-200',
    energy: 'bg-blue-100 text-blue-700 border-blue-200',
    aesthetic: 'bg-purple-100 text-purple-700 border-purple-200'
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              AI Mood Filters
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Auto-apply</span>
              <Switch
                checked={autoApply}
                onCheckedChange={setAutoApply}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mood Analysis Section */}
          {isAnalyzing ? (
            <div className="flex items-center justify-center p-6">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Analyzing mood and content...</p>
              </div>
            </div>
          ) : moodAnalysis ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  {getMoodIcon(moodAnalysis.primary_mood)}
                  <span className="font-medium capitalize">{moodAnalysis.primary_mood}</span>
                </div>
                <Badge variant="secondary">
                  {moodAnalysis.mood_confidence}% confidence
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Energy:</span>
                  <span className="capitalize font-medium">{moodAnalysis.energy_level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="capitalize font-medium">{moodAnalysis.time_of_day}</span>
                </div>
              </div>
            </div>
          ) : (
            <Button onClick={analyzeMoodContent} className="w-full">
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze Mood & Suggest Filters
            </Button>
          )}

          {/* Filter Intensity Control */}
          {selectedFilter && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter Intensity</label>
              <div className="px-3">
                <Slider
                  value={filterIntensity}
                  onValueChange={handleIntensityChange}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Subtle</span>
                  <span>{filterIntensity[0]}%</span>
                  <span>Intense</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter Suggestions */}
      {filterSuggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Filter Suggestions
          </h3>
          
          {filterSuggestions.map((filter) => (
            <Card 
              key={filter.id} 
              className={`cursor-pointer transition-all ${
                selectedFilter?.id === filter.id 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleFilterSelect(filter)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {filter.icon}
                      <div>
                        <h4 className="font-medium">{filter.name}</h4>
                        <p className="text-xs text-muted-foreground">{filter.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`${categoryColors[filter.category]} text-xs`}
                      >
                        {filter.category}
                      </Badge>
                      {selectedFilter?.id === filter.id && (
                        <Badge variant="default" className="text-xs">
                          Applied
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground italic">{filter.reason}</span>
                    <span className="font-medium">{filter.intensity}% intensity</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}