import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { StoryViewer } from "./StoryViewer";
import { CreateStoryModal } from "./CreateStoryModal";
import { supabase } from "@/integrations/supabase/client";

interface StoriesSimpleProps {
  onCreateStory?: () => void;
}

export function StoriesSimple({ onCreateStory }: StoriesSimpleProps) {
  const { user } = useAuth();
  const [stories, setStories] = useState<any[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles!stories_user_id_fkey(username, avatar_url)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const handleCreateStory = () => {
    if (onCreateStory) {
      onCreateStory();
    } else {
      setShowCreateModal(true);
    }
  };

  const handleStoryCreated = () => {
    fetchStories();
  };

  const openStoryViewer = (index: number) => {
    setCurrentStoryIndex(index);
  };

  const closeStoryViewer = () => {
    setCurrentStoryIndex(null);
  };

  const nextStory = () => {
    if (currentStoryIndex !== null && currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    }
  };

  const previousStory = () => {
    if (currentStoryIndex !== null && currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  return (
    <div className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-4 mb-4 sm:mb-6 px-1">
      {/* Add Story Button */}
      {user && (
        <div className="flex-shrink-0">
          <Button
            onClick={handleCreateStory}
            variant="outline"
            className="h-16 w-12 sm:h-20 sm:w-16 flex flex-col items-center justify-center space-y-1 rounded-xl border-2 border-dashed text-xs"
          >
            <div className="relative">
              <Avatar className="h-8 w-8 sm:h-12 sm:w-12">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="text-xs sm:text-sm">
                  {user.user_metadata?.display_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 bg-primary rounded-full p-0.5 sm:p-1">
                <Plus className="h-2 w-2 sm:h-3 sm:w-3 text-primary-foreground" />
              </div>
            </div>
            <span className="text-xs hidden sm:block">Your Story</span>
            <span className="text-xs sm:hidden">Add</span>
          </Button>
        </div>
      )}

      {/* Stories */}
      {stories.map((story, index) => (
        <div key={story.id} className="flex-shrink-0">
          <Button
            variant="ghost"
            className="h-16 w-12 sm:h-20 sm:w-16 flex flex-col items-center justify-center space-y-1 rounded-xl p-1 sm:p-2"
            onClick={() => openStoryViewer(index)}
          >
            <div className="relative">
              <Avatar className="h-8 w-8 sm:h-12 sm:w-12 ring-1 sm:ring-2 ring-primary ring-offset-1 sm:ring-offset-2">
                <AvatarImage src={story.media_url} />
                <AvatarFallback className="text-xs sm:text-sm">
                  {story.profiles.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="text-xs truncate w-full text-center hidden sm:block">
              {story.profiles.username}
            </span>
          </Button>
        </div>
      ))}
      
      {/* Story Viewer */}
      {currentStoryIndex !== null && (
        <StoryViewer
          stories={stories}
          currentIndex={currentStoryIndex}
          onClose={closeStoryViewer}
          onNext={nextStory}
          onPrevious={previousStory}
        />
      )}

      {/* Create Story Modal */}
      <CreateStoryModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onStoryCreated={handleStoryCreated}
      />
    </div>
  );
}