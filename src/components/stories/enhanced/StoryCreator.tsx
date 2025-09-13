import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Video, 
  Type, 
  Sticker, 
  Palette, 
  Music, 
  Hash,
  AtSign,
  Clock,
  Save,
  Send,
  X,
  Sparkles,
  Mic,
  Filter,
  Globe
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StoryCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated?: () => void;
}

interface StoryDraft {
  id: string;
  content: string;
  mediaFile?: File | null;
  mediaPreview?: string | null;
  mediaType?: 'image' | 'video' | 'text';
  textOverlays: TextOverlay[];
  stickers: StickerElement[];
  filters: FilterConfig;
  music?: MusicTrack;
  poll?: PollData;
  timestamp: number;
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  rotation: number;
}

interface StickerElement {
  id: string;
  type: 'emoji' | 'gif' | 'location' | 'mention' | 'hashtag';
  content: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface FilterConfig {
  name: string;
  intensity: number;
  effects: string[];
}

interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  url: string;
  startTime: number;
  duration: number;
}

interface PollData {
  question: string;
  options: string[];
  allowMultiple: boolean;
}

export function StoryCreator({ isOpen, onClose, onStoryCreated }: StoryCreatorProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'media' | 'edit' | 'settings'>('media');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'text'>('text');
  const [textContent, setTextContent] = useState('');
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [stickers, setStickers] = useState<StickerElement[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterConfig>({
    name: 'none',
    intensity: 0,
    effects: []
  });
  const [music, setMusic] = useState<MusicTrack | null>(null);
  const [poll, setPoll] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save draft functionality
  const saveAsDraft = useCallback(async () => {
    if (!autoSaveEnabled || (!mediaFile && !textContent.trim())) return;
    
    try {
      const draft: StoryDraft = {
        id: `draft_${Date.now()}`,
        content: textContent,
        mediaFile,
        mediaPreview,
        mediaType,
        textOverlays,
        stickers,
        filters: selectedFilter,
        music: music || undefined,
        poll: poll || undefined,
        timestamp: Date.now()
      };

      // Save to localStorage
      const existingDrafts = JSON.parse(localStorage.getItem('storyDrafts') || '[]');
      const updatedDrafts = [draft, ...existingDrafts.slice(0, 4)]; // Keep last 5 drafts
      localStorage.setItem('storyDrafts', JSON.stringify(updatedDrafts));
      
      console.log('Story draft auto-saved');
    } catch (error) {
      console.error('Failed to save story draft:', error);
    }
  }, [autoSaveEnabled, mediaFile, textContent, mediaPreview, mediaType, textOverlays, stickers, selectedFilter, music, poll]);

  // Auto-save effect
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveAsDraft();
    }, 2000); // Auto-save every 2 seconds

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [saveAsDraft]);

  const handleMediaSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Media file selected:', file.name, file.type, file.size);

    // Validate file size and type
    const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for video, 10MB for image
    if (file.size > maxSize) {
      toast.error(`File too large. Max ${file.type.startsWith('video/') ? '100MB for videos' : '10MB for images'}`);
      return;
    }

    // For videos, check duration
    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 60) {
          toast.error('Video must be 60 seconds or less');
          return;
        }
        
        setMediaFile(file);
        setMediaType('video');
        const reader = new FileReader();
        reader.onload = (e) => {
          setMediaPreview(e.target?.result as string);
          setCurrentStep('edit');
        };
        reader.readAsDataURL(file);
      };
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        toast.error('Invalid video file');
      };
      video.src = URL.createObjectURL(file);
    } else if (file.type.startsWith('image/')) {
      setMediaFile(file);
      setMediaType('image');
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string);
        setCurrentStep('edit');
      };
      reader.readAsDataURL(file);
    } else {
      toast.error('Please select a valid image or video file');
    }
  }, []);

  const generateAISuggestions = useCallback(async () => {
    if (!mediaFile && !textContent) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-story-suggestions', {
        body: {
          content: textContent,
          mediaType,
          hasMedia: !!mediaFile
        }
      });

      if (error) throw error;
      setAiSuggestions(data);
      toast.success('AI suggestions generated!');
    } catch (error) {
      console.error('AI suggestions failed:', error);
      toast.error('Failed to generate AI suggestions');
    } finally {
      setLoading(false);
    }
  }, [mediaFile, textContent, mediaType]);

  const addTextOverlay = useCallback(() => {
    const newOverlay: TextOverlay = {
      id: `text_${Date.now()}`,
      text: 'Your text here',
      x: 25, // Position as percentage
      y: 25,
      fontSize: 24,
      color: '#ffffff',
      fontFamily: 'Arial',
      rotation: 0
    };
    setTextOverlays(prev => [...prev, newOverlay]);
    toast.success('Text overlay added! Click to edit');
  }, []);

  const updateTextOverlay = useCallback((id: string, updates: Partial<TextOverlay>) => {
    setTextOverlays(prev => prev.map(overlay => 
      overlay.id === id ? { ...overlay, ...updates } : overlay
    ));
  }, []);

  const removeTextOverlay = useCallback((id: string) => {
    setTextOverlays(prev => prev.filter(overlay => overlay.id !== id));
  }, []);

  const removeSticker = useCallback((id: string) => {
    setStickers(prev => prev.filter(sticker => sticker.id !== id));
  }, []);

  const addSticker = useCallback((type: StickerElement['type'], content: string) => {
    const newSticker: StickerElement = {
      id: `sticker_${Date.now()}`,
      type,
      content,
      x: Math.random() * 200 + 50, // Keep within bounds
      y: Math.random() * 200 + 50,
      scale: 1,
      rotation: 0
    };
    setStickers(prev => [...prev, newSticker]);
    toast.success(`${type === 'emoji' ? 'Emoji' : type === 'location' ? 'Location' : 'Sticker'} added!`);
  }, []);

  const addLocation = useCallback(() => {
    // Simple location picker - in a real app you'd use a proper location API
    const locations = [
      '📍 New York, NY',
      '📍 Los Angeles, CA', 
      '📍 Chicago, IL',
      '📍 Miami, FL',
      '📍 San Francisco, CA'
    ];
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    addSticker('location', randomLocation);
  }, [addSticker]);

  const addEmoji = useCallback(() => {
    const emojis = ['😀', '😍', '🥳', '😎', '🔥', '💯', '❤️', '🌟', '✨', '🎉'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    addSticker('emoji', randomEmoji);
  }, [addSticker]);

  const createPoll = useCallback(() => {
    setPoll({
      question: '',
      options: ['Option 1', 'Option 2'],
      allowMultiple: false
    });
  }, []);

  const publishStory = useCallback(async () => {
    if (!user) {
      toast.error('You must be logged in to create a story');
      return;
    }
    
    // Validate that we have some content
    if (!mediaFile && !textContent.trim()) {
      toast.error('Please add some content to your story');
      return;
    }
    
    setLoading(true);
    console.log('Starting story publication...', { mediaFile, textContent, mediaType });
    
    try {
      let mediaUrl = null;
      
      // Upload media if present
      if (mediaFile) {
        console.log('Uploading media file...', mediaFile.name, mediaFile.type, mediaFile.size);
        
        const fileExt = mediaFile.name.split('.').pop() || 'jpg';
        const fileName = `story-${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `stories/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, mediaFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        console.log('Upload successful:', uploadData);

        const { data: urlData } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);

        mediaUrl = urlData.publicUrl;
        console.log('Media URL:', mediaUrl);
      }

      // Start with the exact same approach as the working CreateStoryModal
      const storyData = {
        user_id: user.id,
        content: textContent.trim() || null,
        media_url: mediaUrl,
        media_type: mediaType || (mediaFile ? (mediaFile.type.startsWith('video/') ? 'video' : 'image') : 'text'),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      };

      console.log('Inserting story data exactly like CreateStoryModal:', storyData);

      // Use the exact same insert method as CreateStoryModal
      const { error: insertError } = await supabase
        .from('stories')
        .insert(storyData);

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(`Database error: ${insertError.message}`);
      }

      console.log('Story created successfully!');
      toast.success('Story published successfully!');
      
      // Clear form
      setMediaFile(null);
      setMediaPreview(null);
      setTextContent('');
      setTextOverlays([]);
      setStickers([]);
      setSelectedFilter({ name: 'none', intensity: 0, effects: [] });
      setMusic(null);
      setPoll(null);
      setScheduledTime(null);
      
      onStoryCreated?.();
      onClose();
      
    } catch (error) {
      console.error('Failed to publish story:', error);
      
      let errorMessage = 'Failed to publish story';
      
      if (error instanceof Error) {
        if (error.message.includes('Upload failed')) {
          errorMessage = 'File upload failed. Please check your file and try again.';
        } else if (error.message.includes('not found')) {
          errorMessage = 'Database table not found. Please contact support.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Permission denied. Please check your account permissions.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, mediaFile, textContent, mediaType, onStoryCreated, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Create Story</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={generateAISuggestions} disabled={loading}>
              <Sparkles className="w-4 h-4 mr-2" />
              AI Assist
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={async () => {
                try {
                  const { data, error } = await supabase.from('stories').select('*').limit(1);
                  if (error) {
                    toast.error(`DB Error: ${error.message}`);
                  } else {
                    toast.success('Database connection OK');
                  }
                } catch (e) {
                  toast.error('Connection failed');
                }
              }}
            >
              Test DB
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center gap-2 p-2 border-b">
          {['media', 'edit', 'settings'].map((step) => (
            <Badge 
              key={step}
              variant={currentStep === step ? 'default' : 'outline'}
              className="capitalize cursor-pointer"
              onClick={() => setCurrentStep(step as any)}
            >
              {step}
            </Badge>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Canvas/Preview */}
          <div className="flex-1 bg-gray-100 flex items-center justify-center relative">
            {mediaPreview ? (
              <div className="relative w-80 h-96 bg-black rounded-lg overflow-hidden">
                {mediaType === 'video' ? (
                  <video
                    ref={videoRef}
                    src={mediaPreview}
                    className="w-full h-full object-cover"
                    controls
                    muted
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Story preview"
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Text Overlays */}
                {textOverlays.map((overlay) => (
                  <div
                    key={overlay.id}
                    className="absolute cursor-pointer hover:ring-2 hover:ring-white"
                    style={{
                      left: `${overlay.x}%`,
                      top: `${overlay.y}%`,
                      fontSize: `${overlay.fontSize}px`,
                      color: overlay.color,
                      fontFamily: overlay.fontFamily,
                      transform: `rotate(${overlay.rotation}deg)`,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                    }}
                    onClick={() => {
                      const newText = prompt('Edit text:', overlay.text);
                      if (newText !== null) {
                        updateTextOverlay(overlay.id, { text: newText });
                      }
                    }}
                    onDoubleClick={() => removeTextOverlay(overlay.id)}
                    title="Click to edit, double-click to remove"
                  >
                    {overlay.text}
                  </div>
                ))}

                {/* Stickers */}
                {stickers.map((sticker) => (
                  <div
                    key={sticker.id}
                    className="absolute cursor-pointer hover:scale-110 transition-transform"
                    style={{
                      left: `${sticker.x}px`,
                      top: `${sticker.y}px`,
                      transform: `scale(${sticker.scale}) rotate(${sticker.rotation}deg)`,
                      fontSize: sticker.type === 'emoji' ? '32px' : '16px'
                    }}
                    onDoubleClick={() => removeSticker(sticker.id)}
                    title="Double-click to remove"
                  >
                    {sticker.content}
                  </div>
                ))}
              </div>
            ) : mediaType === 'text' ? (
              <div className="relative w-80 h-96 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg overflow-hidden flex items-center justify-center p-6">
                <div className="text-center">
                  <h3 className="text-white text-2xl font-bold mb-4">Text Story</h3>
                  {textContent ? (
                    <p className="text-white text-lg leading-relaxed">{textContent}</p>
                  ) : (
                    <p className="text-white/70 text-base">Add your text content...</p>
                  )}
                </div>
                
                {/* Text Overlays for text stories */}
                {textOverlays.map((overlay) => (
                  <div
                    key={overlay.id}
                    className="absolute cursor-pointer hover:ring-2 hover:ring-white"
                    style={{
                      left: `${overlay.x}%`,
                      top: `${overlay.y}%`,
                      fontSize: `${overlay.fontSize}px`,
                      color: overlay.color,
                      fontFamily: overlay.fontFamily,
                      transform: `rotate(${overlay.rotation}deg)`,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                    }}
                    onClick={() => {
                      const newText = prompt('Edit text:', overlay.text);
                      if (newText !== null) {
                        updateTextOverlay(overlay.id, { text: newText });
                      }
                    }}
                    onDoubleClick={() => removeTextOverlay(overlay.id)}
                    title="Click to edit, double-click to remove"
                  >
                    {overlay.text}
                  </div>
                ))}

                {/* Stickers for text stories */}
                {stickers.map((sticker) => (
                  <div
                    key={sticker.id}
                    className="absolute cursor-pointer hover:scale-110 transition-transform"
                    style={{
                      left: `${sticker.x}px`,
                      top: `${sticker.y}px`,
                      transform: `scale(${sticker.scale}) rotate(${sticker.rotation}deg)`,
                      fontSize: sticker.type === 'emoji' ? '32px' : '16px'
                    }}
                    onDoubleClick={() => removeSticker(sticker.id)}
                    title="Double-click to remove"
                  >
                    {sticker.content}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">📱</div>
                <p className="text-muted-foreground">Choose media or create text story</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l bg-card overflow-y-auto">
            {currentStep === 'media' && (
              <div className="p-4 space-y-4">
                <h3 className="font-semibold">Add Media</h3>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaSelect}
                  className="hidden"
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-6 h-6 mb-2" />
                    Photo
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Video className="w-6 h-6 mb-2" />
                    Video
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={() => {
                      setMediaType('text');
                      setCurrentStep('edit');
                    }}
                  >
                    <Type className="w-6 h-6 mb-2" />
                    Text
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={() => {
                      // Voice to story feature
                      toast.info('Voice to story coming soon!');
                    }}
                  >
                    <Mic className="w-6 h-6 mb-2" />
                    Voice
                  </Button>
                </div>

                {mediaType === 'text' && (
                  <Textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="min-h-[120px]"
                  />
                )}
              </div>
            )}

            {currentStep === 'edit' && (
              <div className="p-4 space-y-4">
                <h3 className="font-semibold">Edit Story</h3>
                
                {/* Text Tools */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Text & Stickers</h4>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={addTextOverlay}>
                      <Type className="w-4 h-4 mr-1" />
                      Add Text
                    </Button>
                    <Button size="sm" variant="outline" onClick={addEmoji}>
                      <Sticker className="w-4 h-4 mr-1" />
                      Emoji
                    </Button>
                    <Button size="sm" variant="outline" onClick={addLocation}>
                      <Globe className="w-4 h-4 mr-1" />
                      Location
                    </Button>
                  </div>
                  {(textOverlays.length > 0 || stickers.length > 0) && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Click text to edit, double-click to remove
                    </p>
                  )}
                </div>

                {/* Filters */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Filters</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {['none', 'vintage', 'dramatic', 'bright', 'moody', 'warm'].map((filter) => (
                      <Button
                        key={filter}
                        size="sm"
                        variant={selectedFilter.name === filter ? 'default' : 'outline'}
                        onClick={() => setSelectedFilter({ name: filter, intensity: 1, effects: [] })}
                        className="text-xs"
                      >
                        {filter}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Interactive Elements */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Interactive</h4>
                  <div className="space-y-2">
                    <Button size="sm" variant="outline" onClick={createPoll} className="w-full">
                      📊 Add Poll
                    </Button>
                    <Button size="sm" variant="outline" className="w-full">
                      🎵 Add Music
                    </Button>
                    <Button size="sm" variant="outline" className="w-full">
                      🏷️ Add Quiz
                    </Button>
                  </div>
                </div>

                {/* Poll Configuration */}
                {poll && (
                  <Card>
                    <CardContent className="p-3">
                      <h5 className="font-medium mb-2">Poll Question</h5>
                      <Input
                        value={poll.question}
                        onChange={(e) => setPoll({ ...poll, question: e.target.value })}
                        placeholder="Ask something..."
                        className="mb-2"
                      />
                      {poll.options.map((option, index) => (
                        <Input
                          key={index}
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...poll.options];
                            newOptions[index] = e.target.value;
                            setPoll({ ...poll, options: newOptions });
                          }}
                          placeholder={`Option ${index + 1}`}
                          className="mb-1"
                        />
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {currentStep === 'settings' && (
              <div className="p-4 space-y-4">
                <h3 className="font-semibold">Story Settings</h3>
                
                <div>
                  <label className="text-sm font-medium">Schedule Story</label>
                  <Input
                    type="datetime-local"
                    onChange={(e) => setScheduledTime(e.target.value ? new Date(e.target.value) : null)}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto-save drafts</span>
                  <Button
                    variant={autoSaveEnabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                  >
                    {autoSaveEnabled ? 'ON' : 'OFF'}
                  </Button>
                </div>

                {/* AI Suggestions */}
                {aiSuggestions && (
                  <Card>
                    <CardContent className="p-3">
                      <h4 className="font-medium mb-2">AI Suggestions</h4>
                      {aiSuggestions.hashtags && (
                        <div className="mb-2">
                          <p className="text-xs text-muted-foreground mb-1">Hashtags:</p>
                          <div className="flex flex-wrap gap-1">
                            {aiSuggestions.hashtags.map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-xs cursor-pointer">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {aiSuggestions.bestTime && (
                        <p className="text-xs text-muted-foreground">
                          Best posting time: {aiSuggestions.bestTime}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveAsDraft}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={publishStory} disabled={loading || (!mediaFile && !textContent.trim())}>
              {loading ? (
                'Publishing...'
              ) : scheduledTime ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Schedule
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Publish
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}