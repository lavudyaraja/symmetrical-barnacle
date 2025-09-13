import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Image, X, Camera, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateStoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStoryCreated?: () => void;
}

export function CreateStoryModal({ 
  open, 
  onOpenChange, 
  onStoryCreated 
}: CreateStoryModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
      
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

  const handleSubmit = async () => {
    if (!user || (!content.trim() && !mediaFile)) {
      toast.error("Please add content or media to your story");
      return;
    }
    
    setLoading(true);
    
    try {
      let mediaUrl = null;
      
      // Upload media if selected
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `story-${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `stories/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, mediaFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);

        mediaUrl = data.publicUrl;
      }

      // Create story
      const { error } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          content: content.trim() || null,
          media_url: mediaUrl,
          media_type: mediaType,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
        });

      if (error) throw error;

      toast.success("Story created successfully!");
      setContent("");
      setMediaFile(null);
      setMediaPreview(null);
      onOpenChange(false);
      onStoryCreated?.();
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error("Failed to create story");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Your Story</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Media Preview */}
          {mediaPreview ? (
            <div className="relative">
              {mediaType === 'image' ? (
                <img
                  src={mediaPreview}
                  alt="Story preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
              ) : (
                <video
                  src={mediaPreview}
                  className="w-full h-64 object-cover rounded-lg"
                  controls
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
          ) : (
            <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add a photo or video to your story
                  </p>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaSelect}
                    className="hidden"
                    id="story-media-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Text Content */}
          <div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add text to your story (optional)..."
              className="min-h-[80px] resize-none"
              maxLength={280}
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {content.length}/280
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || (!content.trim() && !mediaFile)}
              className="flex-1"
            >
              {loading ? "Creating..." : "Share Story"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}