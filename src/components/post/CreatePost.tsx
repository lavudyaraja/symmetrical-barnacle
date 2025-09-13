import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Image, MapPin, Smile, X, Copy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePostSubmissionGuard } from "@/hooks/post";
import {
  PostDraftSaver,
  MicroAnimations,
  ScaleOnHover
} from "@/components/ux-enhancements";

interface CreatePostProps {
  onPostCreated?: () => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user } = useAuth();
  const { canSubmit, recordSubmission } = usePostSubmissionGuard(5000);
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showDraftSaver, setShowDraftSaver] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);
  const lastSubmissionRef = useRef<{ content: string; timestamp: number } | null>(null);

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 50MB for videos, 10MB for images)
      const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`File size too large. Maximum ${file.type.startsWith('video/') ? '50MB for videos' : '10MB for images'}.`);
        return;
      }
      
      setMediaFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEmojiInsert = (emoji: string, position: number) => {
    const textBefore = content.slice(0, position);
    const textAfter = content.slice(position);
    const newContent = textBefore + emoji + textAfter;
    setContent(newContent);
    setCursorPosition(position + emoji.length);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleRestoreDraft = (draftData: any) => {
    setContent(draftData.content);
      if (draftData.mediaPreview) {
        setMediaPreview(draftData.mediaPreview);
      }
    if (draftData.location) {
      setLocation(draftData.location);
    }
    toast.success("Draft restored successfully!");
  };

  const handleSubmit = async () => {
    if (!content.trim() || !user || loading || isSubmittingRef.current) return;
    
    // Use the submission guard to prevent duplicates
    if (!canSubmit(content)) {
      console.log('Duplicate post submission prevented by guard');
      return;
    }
    
    // Prevent duplicate submissions with same content within 5 seconds
    const now = Date.now();
    if (lastSubmissionRef.current && 
        lastSubmissionRef.current.content === content.trim() && 
        now - lastSubmissionRef.current.timestamp < 5000) {
      console.log('Duplicate post submission prevented by ref check');
      return;
    }
    
    // Prevent double submission
    isSubmittingRef.current = true;
    setLoading(true);
    
    try {
      // First, analyze content for moderation
      const { data: moderationData, error: moderationError } = await supabase.functions.invoke('ai-content-analysis', {
        body: {
          content: content.trim(),
          contentType: 'post',
          contentId: 'pending' // Will be updated after post creation
        }
      });

      if (moderationError) {
        console.warn('Content moderation failed, proceeding with post:', moderationError);
      } else if (moderationData?.moderation_status === 'flagged') {
        toast.error("Content flagged for review. Please revise your post.");
        return;
      } else if (moderationData?.toxicity_score > 0.7) {
        toast.error("Content appears to contain inappropriate material. Please revise.");
        return;
      }

      let imageUrl = null;
      
      // Upload media file (image or video) if selected
      if (mediaFile) {
        console.log('Uploading media file:', { 
          name: mediaFile.name, 
          type: mediaFile.type, 
          size: mediaFile.size 
        });
        
        const fileExt = mediaFile.name.split('.').pop();
        const fileType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
        const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        console.log('Upload details:', { fileName, filePath, fileType });

        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, mediaFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        const { data } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);

        imageUrl = data.publicUrl;
        console.log('Upload successful, URL:', imageUrl);
      }

      // Try to insert post - handle both old and new schema
      let postData: any;
      try {
        const fullPayload = {
          content: content.trim(),
          user_id: user.id,
          image_url: imageUrl,
          created_at: new Date().toISOString(),
          ...(imageUrl && mediaFile ? { media_type: mediaFile.type.startsWith('video/') ? 'video' : 'image' } : {})
        } as any;
        
        console.log('Inserting post with payload:', fullPayload);

        const { data, error } = await supabase
          .from('posts')
          .insert(fullPayload)
          .select()
          .single();

        if (error) {
          console.error('Database insert error:', error);
          
          // If error is related to media_type column not existing, try without it
          if (error.message?.includes('media_type') || error.code === '42703') {
            console.log('Retrying without media_type column...');
            const fallbackPayload = {
              content: content.trim(),
              user_id: user.id,
              image_url: imageUrl,
              created_at: new Date().toISOString()
            };
            
            const { data: retryData, error: retryError } = await supabase
              .from('posts')
              .insert(fallbackPayload)
              .select()
              .single();
              
            if (retryError) {
              console.error('Retry also failed:', retryError);
              throw retryError;
            }
            
            console.log('Post created successfully on retry:', retryData);
            postData = retryData;
          } else {
            throw error;
          }
        } else {
          console.log('Post created successfully:', data);
          postData = data;
        }
      } catch (insertError) {
        console.error('Failed to insert post:', insertError);
        throw insertError;
      }

      // Update content moderation with actual post ID
      if (moderationData && postData) {
        await supabase.functions.invoke('ai-content-analysis', {
          body: {
            content: content.trim(),
            contentType: 'post',
            contentId: postData.id
          }
        });
      }

      // Record successful submission in both guards
      recordSubmission(content.trim());
      lastSubmissionRef.current = {
        content: content.trim(),
        timestamp: Date.now()
      };

      setContent("");
      setMediaFile(null);
      setMediaPreview(null);
      setLocation("");
      setCursorPosition(0);
      setShowDraftSaver(true);
      
      if (moderationData?.moderation_status === 'review') {
        toast.success("Post submitted for review due to content detection.");
      } else {
        toast.success("Post created successfully!");
      }
      
      onPostCreated?.();
    } catch (error) {
      console.error('Error creating post:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('storage')) {
        toast.error("Failed to upload media file. Please check file size and format.");
      } else if (error.message?.includes('posts')) {
        toast.error("Failed to save post to database. Please try again.");
      } else if (error.message?.includes('media_type')) {
        toast.error("Invalid media type. Please upload a supported image or video format.");
      } else {
        toast.error(`Failed to create post: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  if (!user) return null;

  return (
    <Card className="glass-card mb-6">
      <CardContent className="p-4 sm:p-6">
        <div className="flex space-x-2 sm:space-x-4">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <Textarea
              value={content}
              placeholder="What's happening?"
              className="min-h-[80px] sm:min-h-[100px] resize-none border-0 text-base sm:text-lg placeholder:text-muted-foreground"
              onChange={handleTextareaChange}
              onKeyDown={(e) => {
                // Prevent accidental submission on Enter
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  if (!loading && content.trim() && !isSubmittingRef.current) {
                    handleSubmit();
                  }
                }
              }}
              disabled={loading}
            />
            
            {/* Draft Saver */}
            {showDraftSaver && (
              <PostDraftSaver
                content={content}
                imageFile={mediaFile}
                imagePreview={mediaPreview}
                location={location}
                onRestoreDraft={handleRestoreDraft}
                autoSaveInterval={3000}
                maxDrafts={5}
                disabled={loading}
                className="mt-4"
              />
            )}
            
            {mediaPreview && (
              <div className="relative mt-4">
                {mediaFile?.type.startsWith('video/') ? (
                  <video
                    src={mediaPreview}
                    className="w-full max-h-64 sm:max-h-96 object-cover rounded-lg"
                    controls
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full max-h-64 sm:max-h-96 object-cover rounded-lg"
                  />
                )}
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeMedia}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            {location && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {location}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mt-4">
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaSelect}
                  className="hidden"
                  id="image-upload"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-primary hover:bg-primary/10 h-8 w-8 sm:h-10 sm:w-10"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  title="Add image or video"
                >
                  <Image className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                
                <Input
                  placeholder="Add location..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-24 sm:w-32 h-7 sm:h-8 text-xs"
                  disabled={loading}
                />
              </div>

              <ScaleOnHover>
                <Button
                  onClick={handleSubmit}
                  disabled={!content.trim() || loading || isSubmittingRef.current}
                  className="px-4 sm:px-6 text-sm sm:text-base"
                  type="button"
                >
                  {loading ? "Posting..." : "Post"}
                </Button>
              </ScaleOnHover>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}