import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shuffle, 
  Sparkles,
  RefreshCw,
  Wand2,
  Image,
  Film,
  Palette,
  Type,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';

interface StoryContent {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'text';
  caption: string;
  hashtags: string[];
  stickers?: string[];
  filters?: string[];
  music?: string;
}

interface RemixStyle {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  transformations: {
    visual: string[];
    text: string[];
    effects: string[];
  };
  previewUrl?: string;
}

interface AIRemixModeProps {
  originalStory: StoryContent;
  onRemixComplete: (remixedStory: StoryContent) => void;
  className?: string;
}

export function AIRemixMode({
  originalStory,
  onRemixComplete,
  className = ''
}: AIRemixModeProps) {
  const [isRemixing, setIsRemixing] = useState(false);
  const [remixedStories, setRemixedStories] = useState<StoryContent[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  // Available remix styles
  const remixStyles: RemixStyle[] = [
    {
      id: 'meme',
      name: 'Meme Version',
      description: 'Transform into a viral meme format',
      icon: <Sparkles className="w-4 h-4" />,
      transformations: {
        visual: ['Add meme templates', 'Enhance contrast', 'Add bold text overlays'],
        text: ['Convert to meme speak', 'Add punchlines', 'Include trending phrases'],
        effects: ['Add impact font', 'Bold outlines', 'Comic-style effects']
      },
      previewUrl: '/api/remix-previews/meme'
    },
    {
      id: 'cinematic',
      name: 'Cinematic Version',
      description: 'Professional movie-style presentation',
      icon: <Film className="w-4 h-4" />,
      transformations: {
        visual: ['Apply film grain', 'Adjust color grading', 'Add cinematic borders'],
        text: ['Convert to screenplay format', 'Add dramatic language', 'Include scene descriptions'],
        effects: ['Add film transitions', 'Subtle zoom effects', 'Depth of field']
      },
      previewUrl: '/api/remix-previews/cinematic'
    },
    {
      id: 'infographic',
      name: 'Infographic Style',
      description: 'Data-driven visual presentation',
      icon: <Palette className="w-4 h-4" />,
      transformations: {
        visual: ['Add charts and graphs', 'Apply clean layouts', 'Use infographic templates'],
        text: ['Convert to bullet points', 'Add statistics', 'Include data visualizations'],
        effects: ['Add geometric shapes', 'Clean typography', 'Minimalist design']
      },
      previewUrl: '/api/remix-previews/infographic'
    },
    {
      id: 'artistic',
      name: 'Artistic Version',
      description: 'Creative and abstract interpretation',
      icon: <Palette className="w-4 h-4" />,
      transformations: {
        visual: ['Apply artistic filters', 'Add brush strokes', 'Use abstract overlays'],
        text: ['Convert to poetic language', 'Add metaphorical expressions', 'Include artistic descriptions'],
        effects: ['Add watercolor effects', 'Dynamic brush strokes', 'Abstract animations']
      },
      previewUrl: '/api/remix-previews/artistic'
    }
  ];

  // Generate AI remixes
  const generateRemixes = async (styleId: string) => {
    setIsRemixing(true);
    setSelectedStyle(styleId);
    
    try {
      // Simulate AI remix generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock remixed stories based on style
      const style = remixStyles.find(s => s.id === styleId);
      if (!style) return;

      const mockRemixedStory: StoryContent = {
        id: `remix-${styleId}-${Date.now()}`,
        mediaUrl: `/api/remix/${styleId}/${originalStory.id}`,
        mediaType: originalStory.mediaType,
        caption: `Remixed in ${style.name} style! ${originalStory.caption}`,
        hashtags: [...originalStory.hashtags, `#${style.name}Style`, '#AIVibes'],
        stickers: styleId === 'meme' ? ['😂', '🔥'] : originalStory.stickers,
        filters: ['remix-' + styleId],
        music: originalStory.music || (styleId === 'cinematic' ? 'cinematic-score' : 'upbeat')
      };

      setRemixedStories([mockRemixedStory]);
    } catch (error) {
      console.error('Error generating remixes:', error);
      toast.error('Failed to generate remixes');
    } finally {
      setIsRemixing(false);
    }
  };

  // Handle remix selection
  const handleUseRemix = (remixedStory: StoryContent) => {
    onRemixComplete(remixedStory);
    toast.success('Remixed story created successfully!');
  };

  // Copy original story
  const copyOriginal = () => {
    const copiedStory = {
      ...originalStory,
      id: `copy-${Date.now()}`
    };
    onRemixComplete(copiedStory);
    toast.success('Original story copied!');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shuffle className="w-5 h-5" />
            AI Remix Mode
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Transform your story into different creative versions with AI
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Remix Styles */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              Remix Styles
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {remixStyles.map((style) => (
                <Card 
                  key={style.id}
                  className={`cursor-pointer transition-all ${
                    selectedStyle === style.id 
                      ? 'ring-2 ring-primary border-primary' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => generateRemixes(style.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {style.icon}
                        </div>
                        <div>
                          <h4 className="font-medium">{style.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {style.description}
                          </p>
                        </div>
                      </div>
                      
                      {selectedStyle === style.id && isRemixing && (
                        <div className="flex items-center justify-center p-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground ml-2">
                            Generating {style.name}...
                          </span>
                        </div>
                      )}
                      
                      {style.previewUrl && (
                        <div className="rounded-lg overflow-hidden border bg-muted">
                          <img 
                            src={style.previewUrl} 
                            alt={style.name}
                            className="w-full h-20 object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Copy Original Button */}
          <Button 
            variant="outline" 
            onClick={copyOriginal}
            className="w-full"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Original Story
          </Button>
        </CardContent>
      </Card>

      {/* Generated Remixes */}
      {remixedStories.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Generated Remixes
          </h3>
          
          <div className="space-y-3">
            {remixedStories.map((remixedStory) => (
              <Card key={remixedStory.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Media Preview */}
                  <div className="relative">
                    {remixedStory.mediaType === 'image' ? (
                      <img
                        src={remixedStory.mediaUrl}
                        alt="Remixed story"
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center">
                        <Film className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    <Badge className="absolute top-2 right-2">
                      Remix
                    </Badge>
                  </div>
                  
                  {/* Story Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-sm font-medium">{remixedStory.caption}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {remixedStory.hashtags.map((hashtag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {hashtag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleUseRemix(remixedStory)}
                      className="w-full"
                    >
                      Use This Remix
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}