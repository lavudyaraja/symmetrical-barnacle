import React, { useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Save, RotateCcw, Trash2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DraftData {
  content: string;
  imageFile?: File | null; // Can be image or video file
  imagePreview?: string | null; // Preview URL for image or video
  location?: string;
  timestamp: number;
  id: string;
}

interface PostDraftSaverProps {
  content: string;
  imageFile?: File | null; // Can be image or video file
  imagePreview?: string | null; // Preview URL for image or video
  location?: string;
  onRestoreDraft?: (draft: DraftData) => void;
  autoSaveInterval?: number; // in milliseconds
  maxDrafts?: number;
  disabled?: boolean;
  className?: string;
}

const PostDraftSaver: React.FC<PostDraftSaverProps> = ({
  content,
  imageFile,
  imagePreview,
  location = '',
  onRestoreDraft,
  autoSaveInterval = 3000, // 3 seconds
  maxDrafts = 5,
  disabled = false,
  className = ''
}) => {
  const { toast } = useToast();
  const lastSavedContentRef = useRef<string>('');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [drafts, setDrafts] = React.useState<DraftData[]>([]);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = React.useState(false);

  const generateDraftId = () => {
    return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const saveDraft = useCallback(async (isManual = false) => {
    if (disabled || !content.trim()) return;
    
    // Don't save if content hasn't changed
    if (content === lastSavedContentRef.current && !isManual) return;

    setIsAutoSaving(true);
    
    try {
      const draftData: DraftData = {
        content: content.trim(),
        imageFile,
        imagePreview,
        location,
        timestamp: Date.now(),
        id: generateDraftId()
      };

      // Get existing drafts from localStorage
      const existingDrafts = JSON.parse(
        localStorage.getItem('postDrafts') || '[]'
      ) as DraftData[];

      // Add new draft and limit to maxDrafts
      const updatedDrafts = [draftData, ...existingDrafts]
        .slice(0, maxDrafts)
        .filter((draft, index, arr) => 
          // Remove duplicates based on content
          arr.findIndex(d => d.content === draft.content) === index
        );

      localStorage.setItem('postDrafts', JSON.stringify(updatedDrafts));
      setDrafts(updatedDrafts);
      setLastSaved(new Date());
      lastSavedContentRef.current = content;

      if (isManual) {
        toast({
          title: "Draft saved",
          description: "Your post has been saved as a draft.",
        });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      if (isManual) {
        toast({
          title: "Save failed",
          description: "Failed to save draft. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsAutoSaving(false);
    }
  }, [content, imageFile, imagePreview, location, disabled, maxDrafts, toast]);

  const loadDrafts = useCallback(() => {
    try {
      const savedDrafts = JSON.parse(
        localStorage.getItem('postDrafts') || '[]'
      ) as DraftData[];
      setDrafts(savedDrafts);
    } catch (error) {
      console.error('Error loading drafts:', error);
      setDrafts([]);
    }
  }, []);

  const deleteDraft = useCallback((draftId: string) => {
    try {
      const updatedDrafts = drafts.filter(draft => draft.id !== draftId);
      localStorage.setItem('postDrafts', JSON.stringify(updatedDrafts));
      setDrafts(updatedDrafts);
      toast({
        title: "Draft deleted",
        description: "Draft has been removed.",
      });
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete draft.",
        variant: "destructive"
      });
    }
  }, [drafts, toast]);

  const restoreDraft = useCallback((draft: DraftData) => {
    onRestoreDraft?.(draft);
    toast({
      title: "Draft restored",
      description: "Your draft has been restored to the editor.",
    });
  }, [onRestoreDraft, toast]);

  const clearAllDrafts = useCallback(() => {
    try {
      localStorage.removeItem('postDrafts');
      setDrafts([]);
      toast({
        title: "All drafts cleared",
        description: "All saved drafts have been removed.",
      });
    } catch (error) {
      console.error('Error clearing drafts:', error);
    }
  }, [toast]);

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Auto-save functionality
  useEffect(() => {
    if (disabled || !content.trim()) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer
    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft(false);
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [content, saveDraft, autoSaveInterval, disabled]);

  // Load drafts on mount
  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Draft Status and Manual Save */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {lastSaved && (
            <Badge variant="outline" className="text-xs">
              <Clock size={12} className="mr-1" />
              Last saved: {lastSaved.toLocaleTimeString()}
            </Badge>
          )}
          {isAutoSaving && (
            <Badge variant="outline" className="text-xs animate-pulse">
              <Save size={12} className="mr-1 animate-spin" />
              Auto-saving...
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => saveDraft(true)}
            disabled={disabled || !content.trim() || isAutoSaving}
          >
            <Save size={14} className="mr-1" />
            Save Draft
          </Button>
        </div>
      </div>

      {/* Saved Drafts */}
      {drafts.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Saved Drafts ({drafts.length})</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllDrafts}
                className="text-xs h-6"
              >
                <Trash2 size={12} className="mr-1" />
                Clear All
              </Button>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-start justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate mb-1">
                      {draft.content.slice(0, 60)}
                      {draft.content.length > 60 ? '...' : ''}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatTimeAgo(draft.timestamp)}</span>
                      {draft.imagePreview && (
                        <Badge variant="outline" className="text-xs">
                          📷 Image
                        </Badge>
                      )}
                      {draft.location && (
                        <Badge variant="outline" className="text-xs">
                          📍 {draft.location}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => restoreDraft(draft)}
                      className="h-6 w-6 p-0"
                      title="Restore draft"
                    >
                      <RotateCcw size={12} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteDraft(draft.id)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      title="Delete draft"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PostDraftSaver;