import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square,
  Upload,
  FileAudio,
  Sparkles,
  RefreshCw,
  Wand2,
  Volume2,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface VoiceTranscription {
  text: string;
  confidence: number;
  language: string;
  duration: number;
  chunks: Array<{
    text: string;
    timestamp: number;
    confidence: number;
  }>;
}

interface GeneratedStoryContent {
  text: string;
  hashtags: string[];
  tone: string;
  style: string;
  backgroundSuggestions: Array<{
    type: 'color' | 'gradient' | 'image';
    value: string;
    description: string;
  }>;
  musicSuggestions: Array<{
    genre: string;
    mood: string;
    tempo: string;
    description: string;
  }>;
}

interface VoiceToStoryProps {
  onStoryGenerated: (story: GeneratedStoryContent, audio?: Blob) => void;
  maxDuration?: number; // in seconds
  className?: string;
}

export function VoiceToStory({
  onStoryGenerated,
  maxDuration = 60,
  className = ''
}: VoiceToStoryProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<VoiceTranscription | null>(null);
  const [generatedStory, setGeneratedStory] = useState<GeneratedStoryContent | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize media recorder
  const initializeRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        audioChunksRef.current = [];
        
        // Auto-transcribe after recording
        transcribeAudio(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Unable to access microphone. Please check permissions.');
    }
  };

  // Start recording
  const startRecording = async () => {
    if (!mediaRecorderRef.current) {
      await initializeRecorder();
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      setIsRecording(true);
      setRecordingTime(0);
      mediaRecorderRef.current.start();

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setAudioUrl(URL.createObjectURL(file));
      transcribeAudio(file);
    }
  };

  // Transcribe audio using AI
  const transcribeAudio = async (audio: Blob | File) => {
    setIsTranscribing(true);
    
    try {
      // Simulate AI transcription service
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock transcription result
      const mockTranscription: VoiceTranscription = {
        text: "Hey everyone! Just wanted to share this amazing sunset I'm watching right now. The colors are absolutely incredible today. I'm feeling so grateful for these beautiful moments in life. Sometimes you just have to stop and appreciate the little things that make life wonderful.",
        confidence: 94,
        language: 'en-US',
        duration: recordingTime || 15,
        chunks: [
          {
            text: "Hey everyone! Just wanted to share this amazing sunset I'm watching right now.",
            timestamp: 0,
            confidence: 96
          },
          {
            text: "The colors are absolutely incredible today.",
            timestamp: 4.2,
            confidence: 98
          },
          {
            text: "I'm feeling so grateful for these beautiful moments in life.",
            timestamp: 7.8,
            confidence: 92
          },
          {
            text: "Sometimes you just have to stop and appreciate the little things that make life wonderful.",
            timestamp: 11.5,
            confidence: 94
          }
        ]
      };

      setTranscription(mockTranscription);
      
      // Auto-generate story content
      generateStoryContent(mockTranscription);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast.error('Failed to transcribe audio');
    } finally {
      setIsTranscribing(false);
    }
  };

  // Generate story content from transcription
  const generateStoryContent = async (transcription: VoiceTranscription) => {
    setIsGenerating(true);
    
    try {
      // Simulate AI content generation
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Mock generated story content
      const mockStory: GeneratedStoryContent = {
        text: "Catching this breathtaking sunset and feeling incredibly grateful ✨ Sometimes the most beautiful moments happen when you least expect them. Taking a moment to appreciate life's simple pleasures 🌅",
        hashtags: ['#SunsetVibes', '#Grateful', '#NaturalBeauty', '#Mindfulness', '#GoldenHour'],
        tone: 'grateful',
        style: 'inspirational',
        backgroundSuggestions: [
          {
            type: 'gradient',
            value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
            description: 'Warm sunset gradient'
          },
          {
            type: 'color',
            value: '#FFE5B4',
            description: 'Soft peach tone'
          },
          {
            type: 'image',
            value: '/api/unsplash/sunset-background',
            description: 'Sunset landscape background'
          }
        ],
        musicSuggestions: [
          {
            genre: 'Ambient',
            mood: 'peaceful',
            tempo: 'slow',
            description: 'Peaceful ambient sounds for reflection'
          },
          {
            genre: 'Acoustic',
            mood: 'uplifting',
            tempo: 'medium',
            description: 'Gentle acoustic melody'
          }
        ]
      };

      setGeneratedStory(mockStory);
    } catch (error) {
      console.error('Error generating story content:', error);
      toast.error('Failed to generate story content');
    } finally {
      setIsGenerating(false);
    }
  };

  // Play/pause audio
  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsPaused(true);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  // Handle story generation completion
  const handleUseStory = () => {
    if (generatedStory) {
      onStoryGenerated(generatedStory, audioBlob || undefined);
      toast.success('Voice story created successfully!');
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mic className="w-5 h-5" />
            Voice-to-Story AI
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Speak your story and let AI generate engaging content with visuals
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recording Controls */}
          <div className="space-y-4">
            {/* Record Button */}
            <div className="flex justify-center">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                size="lg"
                className={`w-24 h-24 rounded-full ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {isRecording ? (
                  <Square className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </Button>
            </div>

            {/* Recording Status */}
            {isRecording && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Recording...</span>
                  <span className="text-sm text-muted-foreground">
                    {formatTime(recordingTime)} / {formatTime(maxDuration)}
                  </span>
                </div>
                <Progress value={(recordingTime / maxDuration) * 100} className="h-2" />
              </div>
            )}

            {/* Upload Alternative */}
            <div className="flex items-center gap-2">
              <div className="flex-1 border-t" />
              <span className="text-xs text-muted-foreground px-2">OR</span>
              <div className="flex-1 border-t" />
            </div>

            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Audio File
              </Button>
            </div>
          </div>

          {/* Audio Playback */}
          {audioUrl && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={togglePlayback}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <div className="flex items-center gap-2">
                      <FileAudio className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Recorded Audio</span>
                    </div>
                  </div>
                  
                  <Badge variant="secondary">
                    {formatTime(recordingTime || 0)}
                  </Badge>
                </div>
                
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => {
                    setIsPlaying(false);
                    setIsPaused(false);
                  }}
                  className="hidden"
                />
              </CardContent>
            </Card>
          )}

          {/* Transcription Results */}
          {isTranscribing && (
            <Card>
              <CardContent className="p-6 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Transcribing your voice using AI...
                </p>
              </CardContent>
            </Card>
          )}

          {transcription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Voice Transcription</span>
                  <Badge variant="secondary">
                    {transcription.confidence}% accuracy
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={transcription.text}
                  readOnly
                  className="min-h-[100px] bg-muted"
                />
                <div className="mt-2 text-xs text-muted-foreground">
                  Language: {transcription.language} • Duration: {formatTime(transcription.duration)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Story Generation */}
          {isGenerating && (
            <Card>
              <CardContent className="p-6 text-center">
                <Sparkles className="w-8 h-8 animate-pulse mx-auto mb-4 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Generating story content and visual suggestions...
                </p>
              </CardContent>
            </Card>
          )}

          {generatedStory && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wand2 className="w-4 h-4" />
                  Generated Story Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Story Text */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Story Text</label>
                  <Textarea
                    value={generatedStory.text}
                    readOnly
                    className="min-h-[80px] bg-muted"
                  />
                </div>

                {/* Hashtags */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Suggested Hashtags</label>
                  <div className="flex flex-wrap gap-1">
                    {generatedStory.hashtags.map((hashtag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {hashtag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Style Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Tone</label>
                    <p className="text-sm text-muted-foreground capitalize">{generatedStory.tone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Style</label>
                    <p className="text-sm text-muted-foreground capitalize">{generatedStory.style}</p>
                  </div>
                </div>

                {/* Background Suggestions */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Background Suggestions</label>
                  <div className="space-y-2">
                    {generatedStory.backgroundSuggestions.map((bg, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{bg.description}</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {bg.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Use Story Button */}
                <Button onClick={handleUseStory} className="w-full">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Story with AI Content
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}