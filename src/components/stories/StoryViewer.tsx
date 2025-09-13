import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Heart, Send, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Story {
  id: string;
  user_id: string;
  content: string;
  media_url: string;
  media_type: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

interface StoryViewerProps {
  stories: Story[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function StoryViewer({ stories, currentIndex, onClose, onNext, onPrevious }: StoryViewerProps) {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const progressRef = useRef<NodeJS.Timeout>();
  
  const currentStory = stories[currentIndex];
  const STORY_DURATION = 5000; // 5 seconds

  useEffect(() => {
    if (isPlaying) {
      const startTime = Date.now();
      progressRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progressPercent = (elapsed / STORY_DURATION) * 100;
        
        if (progressPercent >= 100) {
          setProgress(100);
          setTimeout(() => {
            if (currentIndex < stories.length - 1) {
              onNext();
            } else {
              onClose();
            }
          }, 100);
        } else {
          setProgress(progressPercent);
        }
      }, 50);
    }

    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
    };
  }, [currentIndex, isPlaying, stories.length, onNext, onClose]);

  useEffect(() => {
    setProgress(0);
    setIsPlaying(true);
  }, [currentIndex]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    try {
      await supabase.from('messages').insert({
        sender_id: user.id,
        recipient_id: currentStory.user_id,
        content: `Replied to your story: ${message}`,
      });

      setMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    } else if (e.key === 'ArrowLeft') {
      onPrevious();
    } else if (e.key === 'ArrowRight') {
      onNext();
    } else if (e.key === 'Escape') {
      onClose();
    } else if (e.key === ' ') {
      e.preventDefault();
      togglePlayPause();
    }
  };

  if (!currentStory) return null;

  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      tabIndex={0}
      onKeyDown={handleKeyPress}
    >
      {/* Story Progress Bars */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex space-x-1">
          {stories.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{ 
                  width: index < currentIndex ? '100%' : 
                         index === currentIndex ? `${progress}%` : '0%' 
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Story Header */}
      <div className="absolute top-8 left-4 right-4 z-10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10 ring-2 ring-white">
            <AvatarImage src={currentStory.profiles.avatar_url} />
            <AvatarFallback>{currentStory.profiles.username[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-semibold">{currentStory.profiles.username}</p>
            <p className="text-white/70 text-sm">
              {new Date(currentStory.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={togglePlayPause}
            className="text-white hover:bg-white/20"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Areas */}
      <div className="absolute inset-0 flex">
        <div 
          className="flex-1 flex items-center justify-start pl-4 cursor-pointer"
          onClick={onPrevious}
        >
          {currentIndex > 0 && (
            <ChevronLeft className="w-8 h-8 text-white/70 hover:text-white transition-colors" />
          )}
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="relative max-w-md w-full mx-4">
            {currentStory.media_type === 'image' ? (
              <img
                src={currentStory.media_url}
                alt="Story"
                className="w-full h-auto max-h-[80vh] object-cover rounded-xl"
              />
            ) : (
              <video
                src={currentStory.media_url}
                className="w-full h-auto max-h-[80vh] object-cover rounded-xl"
                autoPlay
                muted
                loop
              />
            )}
            
            {currentStory.content && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/50 rounded-lg p-3">
                <p className="text-white text-center">{currentStory.content}</p>
              </div>
            )}
          </div>
        </div>
        
        <div 
          className="flex-1 flex items-center justify-end pr-4 cursor-pointer"
          onClick={onNext}
        >
          {currentIndex < stories.length - 1 && (
            <ChevronRight className="w-8 h-8 text-white/70 hover:text-white transition-colors" />
          )}
        </div>
      </div>

      {/* Reply Input */}
      {currentStory.user_id !== user?.id && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex items-center space-x-2 bg-black/50 rounded-full p-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send message..."
              className="flex-1 bg-transparent border-none text-white placeholder:text-white/70 focus-visible:ring-0"
              onKeyPress={handleKeyPress}
            />
            <Button
              size="sm"
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="rounded-full bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}