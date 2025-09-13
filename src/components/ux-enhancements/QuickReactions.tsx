import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, ThumbsUp, Laugh, Angry, Frown, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Reaction {
  id: string;
  emoji: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  count: number;
  userReacted: boolean;
}

interface QuickReactionsProps {
  postId: string;
  initialReactions?: Reaction[];
  onReactionAdd?: (postId: string, reactionId: string) => void;
  onReactionRemove?: (postId: string, reactionId: string) => void;
  longPressDelay?: number;
  className?: string;
  showCounts?: boolean;
  maxDisplayReactions?: number;
}

const defaultReactions: Omit<Reaction, 'count' | 'userReacted'>[] = [
  {
    id: 'like',
    emoji: '👍',
    name: 'Like',
    icon: ThumbsUp,
    color: 'text-blue-500'
  },
  {
    id: 'love',
    emoji: '❤️',
    name: 'Love',
    icon: Heart,
    color: 'text-red-500'
  },
  {
    id: 'laugh',
    emoji: '😂',
    name: 'Laugh',
    icon: Laugh,
    color: 'text-yellow-500'
  },
  {
    id: 'wow',
    emoji: '😮',
    name: 'Wow',
    icon: Eye,
    color: 'text-purple-500'
  },
  {
    id: 'sad',
    emoji: '😢',
    name: 'Sad',
    icon: Frown,
    color: 'text-blue-400'
  },
  {
    id: 'angry',
    emoji: '😠',
    name: 'Angry',
    icon: Angry,
    color: 'text-red-600'
  }
];

const QuickReactions: React.FC<QuickReactionsProps> = ({
  postId,
  initialReactions = [],
  onReactionAdd,
  onReactionRemove,
  longPressDelay = 500,
  className = '',
  showCounts = true,
  maxDisplayReactions = 3
}) => {
  const [reactions, setReactions] = useState<Reaction[]>(() => {
    // Merge initial reactions with defaults
    return defaultReactions.map(defaultReaction => {
      const existingReaction = initialReactions.find(r => r.id === defaultReaction.id);
      return {
        ...defaultReaction,
        count: existingReaction?.count || 0,
        userReacted: existingReaction?.userReacted || false
      };
    });
  });

  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });
  
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const getPrimaryReaction = () => {
    const userReaction = reactions.find(r => r.userReacted);
    if (userReaction) return userReaction;
    
    const mostPopular = reactions
      .filter(r => r.count > 0)
      .sort((a, b) => b.count - a.count)[0];
    
    return mostPopular || reactions[0]; // Default to 'like'
  };

  const getTotalReactions = () => {
    return reactions.reduce((total, reaction) => total + reaction.count, 0);
  };

  const getTopReactions = () => {
    return reactions
      .filter(r => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, maxDisplayReactions);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLongPress(false);
    
    // Get button position for picker placement
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPickerPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
    }
    
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPress(true);
      setShowReactionPicker(true);
    }, longPressDelay);
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    
    if (!isLongPress) {
      // Quick click - toggle primary reaction
      handleQuickReaction();
    }
  };

  const handleMouseLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const handleQuickReaction = () => {
    const primaryReaction = getPrimaryReaction();
    
    if (primaryReaction.userReacted) {
      // Remove reaction
      handleReactionToggle(primaryReaction.id);
    } else {
      // Add like reaction (default)
      handleReactionToggle('like');
    }
  };

  const handleReactionToggle = (reactionId: string) => {
    setReactions(prev => 
      prev.map(reaction => {
        if (reaction.id === reactionId) {
          const newUserReacted = !reaction.userReacted;
          const newCount = newUserReacted 
            ? reaction.count + 1 
            : Math.max(0, reaction.count - 1);
          
          // Call external handlers
          if (newUserReacted) {
            onReactionAdd?.(postId, reactionId);
          } else {
            onReactionRemove?.(postId, reactionId);
          }
          
          return {
            ...reaction,
            userReacted: newUserReacted,
            count: newCount
          };
        } else if (reaction.userReacted) {
          // Remove other user reactions (only one reaction per user)
          onReactionRemove?.(postId, reaction.id);
          return {
            ...reaction,
            userReacted: false,
            count: Math.max(0, reaction.count - 1)
          };
        }
        return reaction;
      })
    );
    
    setShowReactionPicker(false);
  };

  const handleReactionPickerClose = () => {
    setShowReactionPicker(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showReactionPicker && buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        handleReactionPickerClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [showReactionPicker]);

  const primaryReaction = getPrimaryReaction();
  const topReactions = getTopReactions();
  const totalReactions = getTotalReactions();

  return (
    <div className={cn("relative", className)}>
      {/* Main Reaction Button */}
      <div className="flex items-center gap-2">
        <Button
          ref={buttonRef}
          variant={primaryReaction.userReacted ? "default" : "ghost"}
          size="sm"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className={cn(
            "select-none transition-all duration-200",
            primaryReaction.userReacted && primaryReaction.color,
            "hover:scale-105 active:scale-95"
          )}
        >
          <primaryReaction.icon size={16} className="mr-1" />
          <span className="text-sm">{primaryReaction.name}</span>
          {showCounts && totalReactions > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {totalReactions}
            </Badge>
          )}
        </Button>

        {/* Reaction Summary */}
        {showCounts && topReactions.length > 0 && (
          <div className="flex items-center gap-1">
            {topReactions.map((reaction, index) => (
              <div key={reaction.id} className="flex items-center">
                <span className="text-lg">{reaction.emoji}</span>
                <span className="text-xs text-muted-foreground ml-1">
                  {reaction.count}
                </span>
                {index < topReactions.length - 1 && (
                  <span className="text-muted-foreground mx-1">•</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reaction Picker */}
      {showReactionPicker && (
        <Card 
          className="absolute z-50 shadow-lg border-2"
          style={{
            left: `${pickerPosition.x - 160}px`, // Center the picker
            top: `${pickerPosition.y - 80}px`,   // Position above button
          }}
        >
          <CardContent className="p-2">
            <div className="flex items-center gap-1">
              {reactions.map((reaction) => (
                <Button
                  key={reaction.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReactionToggle(reaction.id)}
                  className={cn(
                    "flex flex-col items-center p-2 h-auto hover:scale-110 transition-transform",
                    reaction.userReacted && "bg-primary/10"
                  )}
                  title={reaction.name}
                >
                  <span className="text-xl mb-1">{reaction.emoji}</span>
                  <span className="text-xs text-muted-foreground">
                    {reaction.name}
                  </span>
                  {reaction.count > 0 && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {reaction.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
            
            <div className="text-center mt-2">
              <p className="text-xs text-muted-foreground">
                Long press like button for quick access
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuickReactions;