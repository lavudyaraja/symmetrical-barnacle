import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Smile, Meh, Frown, AlertTriangle } from 'lucide-react';

export interface ToneAnalysis {
  tone: 'happy' | 'neutral' | 'angry' | 'sad' | 'excited';
  confidence: number;
  suggestions?: string[];
}

interface PostToneAnalyzerProps {
  content: string;
  onToneChange?: (analysis: ToneAnalysis) => void;
  showSuggestions?: boolean;
  className?: string;
}

const PostToneAnalyzer: React.FC<PostToneAnalyzerProps> = ({
  content,
  onToneChange,
  showSuggestions = true,
  className = ''
}) => {
  const [analysis, setAnalysis] = useState<ToneAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Simple tone analysis based on keywords and patterns
  const analyzeTone = (text: string): ToneAnalysis => {
    if (!text.trim()) {
      return { tone: 'neutral', confidence: 0 };
    }

    const cleanText = text.toLowerCase();
    
    // Define keyword patterns for different tones
    const patterns = {
      happy: ['😊', '😄', '😃', '🎉', '✨', 'happy', 'great', 'awesome', 'amazing', 'love', 'excited', 'wonderful', 'fantastic', 'brilliant', 'perfect', 'celebration', 'joy', 'blessed', 'grateful'],
      angry: ['😠', '😡', '🤬', 'angry', 'mad', 'furious', 'hate', 'stupid', 'annoying', 'terrible', 'awful', 'worst', 'disgusting', 'ridiculous', 'outrageous', 'frustrated'],
      sad: ['😢', '😭', '😞', '💔', 'sad', 'depressed', 'disappointed', 'hurt', 'broken', 'crying', 'upset', 'devastated', 'heartbroken', 'lonely', 'sorry'],
      excited: ['🚀', '🔥', '💯', '⚡', 'excited', 'thrilled', 'pumped', 'hyped', 'can\'t wait', 'amazing', 'incredible', 'unbelievable', 'mind-blown', 'epic']
    };

    // Count matches for each tone
    const scores = {
      happy: 0,
      angry: 0,
      sad: 0,
      excited: 0,
      neutral: 1 // Default baseline
    };

    // Check for pattern matches
    Object.entries(patterns).forEach(([tone, keywords]) => {
      keywords.forEach(keyword => {
        const matches = (cleanText.match(new RegExp(keyword, 'g')) || []).length;
        scores[tone as keyof typeof scores] += matches;
      });
    });

    // Check for exclamation marks (excitement indicator)
    const exclamationCount = (text.match(/!/g) || []).length;
    if (exclamationCount > 2) {
      scores.excited += exclamationCount * 0.5;
    }

    // Check for all caps (potentially angry or excited)
    const capsWords = text.match(/\b[A-Z]{2,}\b/g) || [];
    if (capsWords.length > 0) {
      scores.angry += capsWords.length * 0.3;
      scores.excited += capsWords.length * 0.2;
    }

    // Determine dominant tone
    const maxScore = Math.max(...Object.values(scores));
    const dominantTone = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as keyof typeof scores;
    
    // Calculate confidence (0-100)
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const confidence = Math.min(Math.round((maxScore / totalScore) * 100), 100);

    // Generate suggestions based on tone
    const suggestions = generateSuggestions(dominantTone, confidence);

    return {
      tone: dominantTone,
      confidence,
      suggestions
    };
  };

  const generateSuggestions = (tone: string, confidence: number): string[] => {
    const suggestions: Record<string, string[]> = {
      angry: [
        "Consider softening your language to maintain positive engagement",
        "Try adding a constructive solution or alternative perspective",
        "Take a moment to cool down before posting"
      ],
      sad: [
        "Consider reaching out to friends for support",
        "Adding a hopeful note might help others relate better",
        "Sometimes sharing struggles can bring people together"
      ],
      neutral: [
        "Add some personality with emojis or personal touches",
        "Consider what emotion you want to convey to your audience",
        "A question might encourage more engagement"
      ],
      happy: [
        "Your positive energy is contagious! 🌟",
        "Consider adding details to share your joy with others",
        "This might inspire others - great post!"
      ],
      excited: [
        "Your enthusiasm shines through! ✨",
        "Consider sharing what makes this so exciting",
        "Your energy might motivate others!"
      ]
    };

    return suggestions[tone] || [];
  };

  const getToneIcon = (tone: string) => {
    const iconProps = { size: 16, className: "inline" };
    
    switch (tone) {
      case 'happy':
        return <Smile {...iconProps} className="text-green-500" />;
      case 'excited':
        return <Smile {...iconProps} className="text-yellow-500" />;
      case 'angry':
        return <Frown {...iconProps} className="text-red-500" />;
      case 'sad':
        return <Frown {...iconProps} className="text-blue-500" />;
      default:
        return <Meh {...iconProps} className="text-gray-500" />;
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'happy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'excited':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'angry':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'sad':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  useEffect(() => {
    if (!content.trim()) {
      setAnalysis(null);
      return;
    }

    setIsAnalyzing(true);
    
    // Debounce analysis
    const timer = setTimeout(() => {
      const result = analyzeTone(content);
      setAnalysis(result);
      setIsAnalyzing(false);
      onToneChange?.(result);
    }, 500);

    return () => clearTimeout(timer);
  }, [content, onToneChange]);

  if (!content.trim()) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        {isAnalyzing ? (
          <Badge variant="outline" className="animate-pulse">
            Analyzing tone...
          </Badge>
        ) : analysis && (
          <Badge className={getToneColor(analysis.tone)}>
            {getToneIcon(analysis.tone)}
            <span className="ml-1 capitalize">{analysis.tone}</span>
            <span className="ml-1 text-xs">({analysis.confidence}%)</span>
          </Badge>
        )}
      </div>

      {showSuggestions && analysis && analysis.suggestions && analysis.suggestions.length > 0 && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Tone Suggestions:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-blue-400">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PostToneAnalyzer;