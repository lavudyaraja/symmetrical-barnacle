import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smile, TrendingUp, Heart, Sparkles } from 'lucide-react';

interface EmojiSuggestion {
  emoji: string;
  name: string;
  category: 'mood' | 'activity' | 'contextual' | 'trending';
  confidence: number;
}

interface EmojiRecommendationProps {
  text: string;
  onEmojiSelect?: (emoji: string) => void;
  onEmojiInsert?: (emoji: string, position: number) => void;
  position?: number; // Cursor position in the text
  className?: string;
  maxSuggestions?: number;
}

const EmojiRecommendation: React.FC<EmojiRecommendationProps> = ({
  text,
  onEmojiSelect,
  onEmojiInsert,
  position = 0,
  className = '',
  maxSuggestions = 8
}) => {
  const [suggestions, setSuggestions] = useState<EmojiSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Comprehensive emoji mapping for different contexts
  const emojiMappings = {
    // Emotion keywords
    happy: ['😊', '😄', '😃', '🙂', '😁', '😍', '🥰', '😘'],
    sad: ['😢', '😭', '😞', '😔', '😟', '😿', '💔', '😪'],
    angry: ['😠', '😡', '🤬', '😤', '👿', '💢', '😾', '🔥'],
    love: ['❤️', '💕', '💖', '💝', '😍', '🥰', '😘', '💋'],
    excited: ['🎉', '🥳', '🤩', '✨', '🎊', '⚡', '🚀', '💫'],
    tired: ['😴', '😪', '🥱', '😵', '🤤', '💤', '😑', '😌'],
    surprised: ['😮', '😯', '😲', '🤯', '😱', '🙀', '😵', '🤭'],
    
    // Activity keywords
    food: ['🍕', '🍔', '🍟', '🌮', '🍜', '🍰', '🍪', '☕'],
    travel: ['✈️', '🌍', '🗺️', '🧳', '📸', '🏖️', '🏔️', '🚗'],
    work: ['💼', '💻', '📊', '📈', '⏰', '📝', '🎯', '💡'],
    party: ['🎉', '🥳', '🍾', '🎊', '🎈', '🎂', '🕺', '💃'],
    fitness: ['💪', '🏃‍♀️', '🏋️‍♂️', '🧘‍♀️', '🚴‍♂️', '⚽', '🏀', '🔥'],
    music: ['🎵', '🎶', '🎸', '🎤', '🎧', '🎹', '🎺', '🥁'],
    nature: ['🌳', '🌸', '🌺', '🦋', '🐝', '🌞', '🌙', '⭐'],
    
    // Time-based
    morning: ['☀️', '🌅', '☕', '🥐', '🌄', '🐓', '⏰', '😴'],
    night: ['🌙', '⭐', '🌃', '💤', '🦉', '🌌', '✨', '😴'],
    weekend: ['🥳', '🎉', '🍻', '🏖️', '🛋️', '📺', '🎮', '😎'],
    
    // Common words
    good: ['👍', '✨', '💯', '🙌', '👏', '🎯', '💪', '🔥'],
    bad: ['👎', '😞', '💔', '😭', '😤', '🤦‍♀️', '😩', '💢'],
    new: ['✨', '🆕', '🎉', '🚀', '💫', '🌟', '🎊', '💥'],
    old: ['👴', '👵', '📜', '⏳', '🕰️', '📻', '📸', '💭'],
    big: ['🦣', '🐘', '🏗️', '🗻', '🌊', '💥', '🎯', '📏'],
    small: ['🐭', '🐣', '🍃', '💎', '⭐', '🔍', '📍', '💧']
  };

  // Trending emojis (simulated)
  const trendingEmojis = ['✨', '💯', '🔥', '💀', '😭', '🥰', '💅', '🤌'];

  const analyzeTextForEmojis = (inputText: string): EmojiSuggestion[] => {
    const text = inputText.toLowerCase();
    const suggestions: EmojiSuggestion[] = [];
    const usedEmojis = new Set<string>();

    // Analyze for contextual emojis
    Object.entries(emojiMappings).forEach(([keyword, emojis]) => {
      if (text.includes(keyword)) {
        emojis.slice(0, 3).forEach(emoji => {
          if (!usedEmojis.has(emoji)) {
            suggestions.push({
              emoji,
              name: keyword,
              category: 'contextual',
              confidence: 90
            });
            usedEmojis.add(emoji);
          }
        });
      }
    });

    // Add mood-based suggestions based on tone
    const moodSuggestions = getMoodEmojis(text);
    moodSuggestions.forEach(suggestion => {
      if (!usedEmojis.has(suggestion.emoji)) {
        suggestions.push(suggestion);
        usedEmojis.add(suggestion.emoji);
      }
    });

    // Add trending emojis if no specific matches
    if (suggestions.length < 4) {
      trendingEmojis.forEach(emoji => {
        if (!usedEmojis.has(emoji) && suggestions.length < 6) {
          suggestions.push({
            emoji,
            name: 'trending',
            category: 'trending',
            confidence: 70
          });
          usedEmojis.add(emoji);
        }
      });
    }

    // Add activity-based suggestions
    const activitySuggestions = getActivityEmojis(text);
    activitySuggestions.forEach(suggestion => {
      if (!usedEmojis.has(suggestion.emoji) && suggestions.length < maxSuggestions) {
        suggestions.push(suggestion);
        usedEmojis.add(suggestion.emoji);
      }
    });

    return suggestions.slice(0, maxSuggestions);
  };

  const getMoodEmojis = (text: string): EmojiSuggestion[] => {
    const moodIndicators = {
      positive: ['amazing', 'awesome', 'great', 'wonderful', 'perfect', 'best', 'love', 'fantastic'],
      negative: ['terrible', 'awful', 'worst', 'hate', 'bad', 'horrible', 'disgusting'],
      neutral: ['okay', 'fine', 'normal', 'regular', 'standard']
    };

    const positiveCount = moodIndicators.positive.filter(word => text.includes(word)).length;
    const negativeCount = moodIndicators.negative.filter(word => text.includes(word)).length;

    if (positiveCount > negativeCount) {
      return [
        { emoji: '😊', name: 'happy', category: 'mood', confidence: 85 },
        { emoji: '✨', name: 'sparkles', category: 'mood', confidence: 80 },
        { emoji: '💖', name: 'love', category: 'mood', confidence: 75 }
      ];
    } else if (negativeCount > positiveCount) {
      return [
        { emoji: '😔', name: 'sad', category: 'mood', confidence: 85 },
        { emoji: '💔', name: 'broken heart', category: 'mood', confidence: 80 }
      ];
    }

    return [
      { emoji: '🙂', name: 'neutral', category: 'mood', confidence: 70 }
    ];
  };

  const getActivityEmojis = (text: string): EmojiSuggestion[] => {
    const activities = [
      { keywords: ['eat', 'food', 'hungry', 'lunch', 'dinner'], emojis: ['🍽️', '🍕', '🍜'] },
      { keywords: ['sleep', 'tired', 'bed', 'night'], emojis: ['😴', '💤', '🌙'] },
      { keywords: ['work', 'office', 'meeting', 'project'], emojis: ['💼', '💻', '📊'] },
      { keywords: ['weekend', 'party', 'fun', 'celebrate'], emojis: ['🎉', '🥳', '🎊'] }
    ];

    const suggestions: EmojiSuggestion[] = [];
    activities.forEach(activity => {
      const matchCount = activity.keywords.filter(keyword => text.includes(keyword)).length;
      if (matchCount > 0) {
        activity.emojis.forEach(emoji => {
          suggestions.push({
            emoji,
            name: activity.keywords[0],
            category: 'activity',
            confidence: 80
          });
        });
      }
    });

    return suggestions;
  };

  const handleEmojiClick = (suggestion: EmojiSuggestion) => {
    // Add to recent emojis
    setRecentEmojis(prev => {
      const updated = [suggestion.emoji, ...prev.filter(e => e !== suggestion.emoji)];
      return updated.slice(0, 8);
    });

    if (onEmojiInsert && position !== undefined) {
      onEmojiInsert(suggestion.emoji, position);
    } else if (onEmojiSelect) {
      onEmojiSelect(suggestion.emoji);
    }

    setShowSuggestions(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mood':
        return <Heart size={12} />;
      case 'trending':
        return <TrendingUp size={12} />;
      case 'activity':
        return <Sparkles size={12} />;
      default:
        return <Smile size={12} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mood':
        return 'bg-pink-100 text-pink-700';
      case 'trending':
        return 'bg-green-100 text-green-700';
      case 'activity':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  useEffect(() => {
    if (text.trim()) {
      const newSuggestions = analyzeTextForEmojis(text);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [text, maxSuggestions]);

  // Load recent emojis from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentEmojis');
    if (stored) {
      try {
        setRecentEmojis(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading recent emojis:', error);
      }
    }
  }, []);

  // Save recent emojis to localStorage
  useEffect(() => {
    if (recentEmojis.length > 0) {
      localStorage.setItem('recentEmojis', JSON.stringify(recentEmojis));
    }
  }, [recentEmojis]);

  if (!text.trim() && recentEmojis.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className={`space-y-2 ${className}`}>
      {/* Recent Emojis */}
      {recentEmojis.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <Smile size={14} />
              <span className="text-xs font-medium text-muted-foreground">Recent</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {recentEmojis.map((emoji, index) => (
                <Button
                  key={`recent-${index}`}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-lg hover:bg-muted"
                  onClick={() => handleEmojiClick({ emoji, name: 'recent', category: 'mood', confidence: 100 })}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} />
              <span className="text-xs font-medium text-muted-foreground">AI Suggestions</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {suggestions.map((suggestion, index) => (
                <div key={`suggestion-${index}`} className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-full p-1 text-lg hover:bg-muted flex flex-col items-center justify-center"
                    onClick={() => handleEmojiClick(suggestion)}
                  >
                    <span className="text-xl">{suggestion.emoji}</span>
                  </Button>
                  <Badge
                    variant="outline"
                    className={`text-xs px-1 py-0 mt-1 ${getCategoryColor(suggestion.category)}`}
                  >
                    {getCategoryIcon(suggestion.category)}
                    <span className="ml-1">{suggestion.confidence}%</span>
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmojiRecommendation;