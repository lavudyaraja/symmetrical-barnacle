import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const ClearPostsAdmin = () => {
  const { user } = useAuth();
  const [isClearing, setIsClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const clearAllPosts = async () => {
    if (!user || !confirmClear) return;
    
    setIsClearing(true);
    
    try {
      // Clear data in the correct order (respecting foreign key constraints)
      
      // 1. Delete bookmarks
      const { error: bookmarksError } = await supabase
        .from('bookmarks')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (bookmarksError) throw bookmarksError;
      
      // 2. Delete likes
      const { error: likesError } = await supabase
        .from('likes')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (likesError) throw likesError;
      
      // 3. Delete comments
      const { error: commentsError } = await supabase
        .from('comments')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (commentsError) throw commentsError;
      
      // 4. Delete posts
      const { error: postsError } = await supabase
        .from('posts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (postsError) throw postsError;
      
      // 5. Delete stories
      const { error: storiesError } = await supabase
        .from('stories')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (storiesError) throw storiesError;
      
      // 6. Clear trending hashtags
      const { error: hashtagsError } = await supabase
        .from('trending_hashtags')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (hashtagsError) throw hashtagsError;
      
      toast.success('All posts and related data cleared successfully!');
      setConfirmClear(false);
      
      // Refresh the page to update the UI
      window.location.reload();
      
    } catch (error) {
      console.error('Error clearing posts:', error);
      toast.error('Failed to clear posts. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  if (!user) return null;

  return (
    <Card className="w-full max-w-md mx-auto mb-6 border-red-200 bg-red-50/50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          <span>Admin: Clear All Posts</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-red-600">
          This will permanently delete all existing posts, comments, likes, bookmarks, stories, and trending data. 
          Only newly created posts will remain.
        </p>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="confirmClear"
            checked={confirmClear}
            onChange={(e) => setConfirmClear(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="confirmClear" className="text-sm text-red-700">
            I understand this action cannot be undone
          </label>
        </div>
        
        <Button
          onClick={clearAllPosts}
          disabled={!confirmClear || isClearing}
          variant="destructive"
          className="w-full"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {isClearing ? 'Clearing...' : 'Clear All Posts'}
        </Button>
      </CardContent>
    </Card>
  );
};