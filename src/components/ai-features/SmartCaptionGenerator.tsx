import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, RefreshCw, Copy, Check, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CaptionSuggestion {
  id: string;
  text: string;
  style: 'casual' | 'professional' | 'creative' | 'funny' | 'inspiring';
  hashtags: string[];
}

interface SmartCaptionGeneratorProps {
  imageFile?: File;
  imageUrl?: string;
  context?: string; // Additional context about the image
  onCaptionSelect?: (caption: string) => void;
  className?: string;
}

const SmartCaptionGenerator: React.FC<SmartCaptionGeneratorProps> = ({
  imageFile,
  imageUrl,
  context = '',
  onCaptionSelect,
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<CaptionSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCaption, setSelectedCaption] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const { toast } = useToast();

  // Simulate AI image analysis and caption generation
  const analyzeImageAndGenerateCaptions = async (
    image: File | string,
    prompt?: string
  ): Promise<CaptionSuggestion[]> => {
    // This simulates AI analysis. In a real implementation, you would:
    // 1. Send the image to an AI vision service (OpenAI GPT-4 Vision, Google Vision AI, etc.)
    // 2. Analyze the image content, objects, people, setting, mood
    // 3. Generate contextual captions based on the analysis

    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time

    // Sample caption templates based on common social media patterns
    const captionTemplates = {
      casual: [
        "Just another day living my best life ✨",
        "Good vibes only 🌈",
        "Making memories that matter 💫",
        "Simple moments, big smiles 😊",
        "Here's to the little things in life 🌟"
      ],
      professional: [
        "Grateful for this incredible opportunity to grow and learn.",
        "Excited to share this milestone with my amazing community.",
        "Behind the scenes of building something meaningful.",
        "Celebrating progress, one step at a time.",
        "Honored to be part of this inspiring journey."
      ],
      creative: [
        "Where imagination meets reality ✨🎨",
        "Creating magic in the mundane 🪄",
        "Art is everywhere if you know how to look 👁️",
        "Painting life with bold strokes 🎭",
        "Finding beauty in unexpected places 🌸"
      ],
      funny: [
        "Plot twist: I have no idea what I'm doing 😂",
        "Current mood: Pretending to be an adult 🤷‍♀️",
        "Instructions unclear, ended up here somehow 🤔",
        "When life gives you lemons, take a selfie 🍋",
        "Professional overthinker at your service 🧠"
      ],
      inspiring: [
        "Every ending is a new beginning 🌅",
        "Growth happens outside your comfort zone 🌱",
        "Be the energy you want to attract ⚡",
        "Your only limit is your mindset 💭",
        "Believe in the magic of new beginnings ✨"
      ]
    };

    // Generate hashtag suggestions based on context
    const generateHashtags = (style: string): string[] => {
      const hashtagSets = {
        casual: ['#vibes', '#goodtimes', '#blessed', '#grateful', '#mood'],
        professional: ['#growth', '#opportunity', '#grateful', '#team', '#success'],
        creative: ['#art', '#creativity', '#inspiration', '#design', '#aesthetic'],
        funny: ['#mood', '#relatable', '#funny', '#life', '#random'],
        inspiring: ['#motivation', '#inspiration', '#growth', '#mindset', '#believe']
      };
      
      return hashtagSets[style as keyof typeof hashtagSets] || hashtagSets.casual;
    };

    // Select random captions from each style
    const suggestions: CaptionSuggestion[] = [];
    const styles = Object.keys(captionTemplates) as Array<keyof typeof captionTemplates>;
    
    // Generate 2-3 suggestions with different styles
    const selectedStyles = styles.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    selectedStyles.forEach((style, index) => {
      const templates = captionTemplates[style];
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
      
      // Customize based on prompt if provided
      let captionText = randomTemplate;
      if (prompt && prompt.trim()) {
        captionText = `${prompt} ${randomTemplate}`;
      }
      
      suggestions.push({
        id: `caption-${index}`,
        text: captionText,
        style,
        hashtags: generateHashtags(style)
      });
    });

    return suggestions;
  };

  const generateCaptions = async () => {
    if (!imageFile && !imageUrl) {
      toast({
        title: "No image provided",
        description: "Please upload an image to generate captions.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const newSuggestions = await analyzeImageAndGenerateCaptions(
        imageFile || imageUrl!,
        customPrompt
      );
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error generating captions:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate captions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCaptionSelect = (caption: CaptionSuggestion) => {
    const fullCaption = `${caption.text}\n\n${caption.hashtags.join(' ')}`;
    setSelectedCaption(fullCaption);
    onCaptionSelect?.(fullCaption);
  };

  const handleCopyCaption = async (caption: CaptionSuggestion) => {
    const fullCaption = `${caption.text}\n\n${caption.hashtags.join(' ')}`;
    try {
      await navigator.clipboard.writeText(fullCaption);
      toast({
        title: "Copied to clipboard",
        description: "Caption has been copied to your clipboard.",
      });
    } catch (error) {
      console.error('Failed to copy caption:', error);
    }
  };

  const getStyleColor = (style: string) => {
    const colors = {
      casual: 'bg-blue-100 text-blue-800',
      professional: 'bg-purple-100 text-purple-800',
      creative: 'bg-pink-100 text-pink-800',
      funny: 'bg-yellow-100 text-yellow-800',
      inspiring: 'bg-green-100 text-green-800'
    };
    return colors[style as keyof typeof colors] || colors.casual;
  };

  const getStyleIcon = (style: string) => {
    switch (style) {
      case 'creative':
        return '🎨';
      case 'funny':
        return '😄';
      case 'inspiring':
        return '✨';
      case 'professional':
        return '💼';
      default:
        return '📝';
    }
  };

  useEffect(() => {
    if (imageFile || imageUrl) {
      generateCaptions();
    }
  }, [imageFile, imageUrl]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Custom Prompt Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Custom Context (optional)</label>
        <Textarea
          placeholder="Add context about your image (e.g., 'celebrating my birthday', 'vacation in Paris', 'new project launch')..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          className="min-h-[60px]"
        />
      </div>

      {/* Generate Button */}
      <Button
        onClick={generateCaptions}
        disabled={isGenerating || (!imageFile && !imageUrl)}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <RefreshCw size={16} className="mr-2 animate-spin" />
            Generating captions...
          </>
        ) : (
          <>
            <Sparkles size={16} className="mr-2" />
            {suggestions.length > 0 ? 'Regenerate Captions' : 'Generate Smart Captions'}
          </>
        )}
      </Button>

      {/* Caption Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Wand2 size={16} />
            AI Caption Suggestions
          </h3>
          
          {suggestions.map(suggestion => (
            <Card key={suggestion.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge className={getStyleColor(suggestion.style)}>
                    {getStyleIcon(suggestion.style)} {suggestion.style}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyCaption(suggestion)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCaptionSelect(suggestion)}
                      className="h-8 w-8 p-0"
                    >
                      <Check size={14} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">{suggestion.text}</p>
                <div className="flex flex-wrap gap-1">
                  {suggestion.hashtags.map(hashtag => (
                    <span key={hashtag} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {hashtag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Selected Caption Preview */}
      {selectedCaption && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-800 flex items-center gap-2">
              <Check size={16} />
              Selected Caption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700 whitespace-pre-wrap">{selectedCaption}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmartCaptionGenerator;