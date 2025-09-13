import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Mic, 
  MicOff,
  Play,
  Pause,
  Square,
  Users,
  MessageCircle,
  Heart,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface LiveReaction {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  reaction: 'heart' | 'clap' | 'laugh' | 'wow' | 'fire';
  position: { x: number; y: number };
  timestamp: number;
}

interface LiveInteractiveStoryProps {
  storyId: string;
  onReaction: (reaction: LiveReaction) => void;
  onVoiceMessage?: (audioBlob: Blob) => void;
  className?: string;
}

export function LiveInteractiveStory({
  storyId,
  onReaction,
  onVoiceMessage,
  className = ''
}: LiveInteractiveStoryProps) {
  const [isLive, setIsLive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [viewers, setViewers] = useState(12); // Mock viewer count
  const [reactions, setReactions] = useState<LiveReaction[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start live story
  const startLiveStory = () => {
    setIsLive(true);
    toast.success('Live story started! Viewers can now interact.');
    
    // Simulate increasing viewers
    timerRef.current = setInterval(() => {
      setViewers(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);
  };

  // Stop live story
  const stopLiveStory = () => {
    setIsLive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    toast.success('Live story ended');
  };

  // Send reaction
  const sendReaction = (reactionType: LiveReaction['reaction']) => {
    if (!isLive) {
      toast.error('Story is not live');
      return;
    }

    const reaction: LiveReaction = {
      id: `reaction-${Date.now()}`,
      userId: 'current-user',
      username: 'You',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current',
      reaction: reactionType,
      position: {
        x: Math.random() * 80 + 10, // 10-90%
        y: Math.random() * 60 + 20  // 20-80%
      },
      timestamp: Date.now()
    };

    setReactions(prev => [...prev, reaction]);
    onReaction(reaction);
    
    // Auto-remove reaction after animation
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reaction.id));
    }, 3000);
  };

  // Start voice message recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        onVoiceMessage?.(audioBlob);
        setAudioChunks([]);
        toast.success('Voice reaction sent!');
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting voice recording:', error);
      toast.error('Failed to access microphone');
    }
  };

  // Stop voice message recording
  const stopVoiceRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  // Get reaction icon
  const getReactionIcon = (reaction: LiveReaction['reaction']) => {
    switch (reaction) {
      case 'heart': return <Heart className="w-6 h-6 text-red-500" />;
      case 'clap': return <span className="text-2xl">👏</span>;
      case 'laugh': return <span className="text-2xl">😂</span>;
      case 'wow': return <span className="text-2xl">😮</span>;
      case 'fire': return <span className="text-2xl">🔥</span>;
      default: return <Heart className="w-6 h-6 text-red-500" />;
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorder) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaRecorder]);

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="w-5 h-5" />
            Live Interactive Story
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Stream your story live with real-time viewer interactions
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Live Controls */}
          <div className="space-y-3">
            <Button
              onClick={isLive ? stopLiveStory : startLiveStory}
              className={`w-full ${
                isLive 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {isLive ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  End Live Story
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Go Live
                </>
              )}
            </Button>

            {isLive && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-medium text-red-700">LIVE</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Users className="w-4 h-4" />
                  <span>{viewers} viewers</span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Reactions */}
          {isLive && (
            <div className="space-y-3">
              <h3 className="font-medium">Send Reactions</h3>
              
              <div className="grid grid-cols-5 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendReaction('heart')}
                  className="h-12 flex flex-col gap-1"
                >
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className="text-xs">Heart</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendReaction('clap')}
                  className="h-12 flex flex-col gap-1"
                >
                  <span className="text-lg">👏</span>
                  <span className="text-xs">Clap</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendReaction('laugh')}
                  className="h-12 flex flex-col gap-1"
                >
                  <span className="text-lg">😂</span>
                  <span className="text-xs">Laugh</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendReaction('wow')}
                  className="h-12 flex flex-col gap-1"
                >
                  <span className="text-lg">😮</span>
                  <span className="text-xs">Wow</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendReaction('fire')}
                  className="h-12 flex flex-col gap-1"
                >
                  <span className="text-lg">🔥</span>
                  <span className="text-xs">Fire</span>
                </Button>
              </div>
            </div>
          )}

          {/* Voice Messages */}
          {isLive && (
            <div className="space-y-3">
              <h3 className="font-medium">Voice Messages</h3>
              
              <div className="flex gap-2">
                <Button
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  disabled={!isLive}
                  className={`flex-1 ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Record Voice
                    </>
                  )}
                </Button>
                
                {isRecording && (
                  <div className="flex items-center gap-2 px-3 bg-red-50 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm text-red-700">REC</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live Viewers */}
          {isLive && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Live Viewers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <img
                      key={i}
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=viewer${i}`}
                      alt={`Viewer ${i + 1}`}
                      className="w-8 h-8 rounded-full border-2 border-primary"
                    />
                  ))}
                  <span className="text-sm text-muted-foreground">
                    +{Math.max(0, viewers - 5)} more
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Floating Reactions Overlay (Visual Only) */}
      {isLive && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {reactions.map((reaction) => (
            <div
              key={reaction.id}
              className="absolute animate-bounce"
              style={{
                left: `${reaction.position.x}%`,
                top: `${reaction.position.y}%`,
                animationDuration: '2s'
              }}
            >
              {getReactionIcon(reaction.reaction)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}