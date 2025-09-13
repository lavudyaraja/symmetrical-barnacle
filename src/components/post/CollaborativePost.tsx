import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Send, Edit, Trash2, Crown, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface CollaborativePostProps {
  postId?: string;
  onComplete?: (post: any) => void;
}

interface Collaborator {
  id: string;
  username: string;
  avatar_url: string;
  display_name: string;
}

export function CollaborativePost({ postId, onComplete }: CollaborativePostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isCreateMode, setIsCreateMode] = useState(!postId);
  const [isLoading, setIsLoading] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState<any[]>([]);

  useEffect(() => {
    if (postId) {
      loadCollaborativePost();
      setupRealTimeUpdates();
    }
  }, [postId]);

  const loadCollaborativePost = async () => {
    if (!postId) return;

    try {
      const { data, error } = await supabase
        .from('collaborative_posts')
        .select(`
          *,
          profiles:creator_id(username, avatar_url, display_name)
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;

      setTitle(data.title);
      setDescription(data.description || "");
      setContent(data.content || "");
      
      // Load collaborator profiles
      if (data.collaborators && data.collaborators.length > 0) {
        const { data: collabProfiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, display_name')
          .in('id', data.collaborators);
        
        setCollaborators(collabProfiles || []);
      }
    } catch (error) {
      console.error('Error loading collaborative post:', error);
      toast({
        title: "Error",
        description: "Failed to load collaborative post",
        variant: "destructive"
      });
    }
  };

  const setupRealTimeUpdates = () => {
    if (!postId) return;

    const channel = supabase
      .channel(`collaborative_post_${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'collaborative_posts',
          filter: `id=eq.${postId}`
        },
        (payload) => {
          const update = {
            timestamp: new Date(),
            user: payload.new.updated_by || 'Unknown',
            change: 'Content updated'
          };
          setRealTimeUpdates(prev => [update, ...prev.slice(0, 4)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createCollaborativePost = async () => {
    if (!user || !title.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('collaborative_posts')
        .insert({
          title: title.trim(),
          description: description.trim(),
          creator_id: user.id,
          content: content.trim(),
          collaborators: collaborators.map(c => c.id),
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Collaborative post created successfully"
      });

      if (onComplete) {
        onComplete(data);
      }
      
      // Reset form
      setTitle("");
      setDescription("");
      setContent("");
      setCollaborators([]);
      
    } catch (error) {
      console.error('Error creating collaborative post:', error);
      toast({
        title: "Error",
        description: "Failed to create collaborative post",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateCollaborativePost = async () => {
    if (!postId || !user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('collaborative_posts')
        .update({
          title: title.trim(),
          description: description.trim(),
          content: content.trim(),
          collaborators: collaborators.map(c => c.id),
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post updated successfully"
      });
      
    } catch (error) {
      console.error('Error updating collaborative post:', error);
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inviteCollaborator = async () => {
    if (!inviteEmail.trim() || !user) return;

    try {
      // Find user by email or username
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, display_name')
        .or(`username.eq.${inviteEmail},email.eq.${inviteEmail}`)
        .single();

      if (!userProfile) {
        toast({
          title: "User not found",
          description: "No user found with that email or username",
          variant: "destructive"
        });
        return;
      }

      if (collaborators.some(c => c.id === userProfile.id)) {
        toast({
          title: "Already added",
          description: "This user is already a collaborator",
          variant: "destructive"
        });
        return;
      }

      setCollaborators(prev => [...prev, userProfile]);
      setInviteEmail("");
      
      toast({
        title: "Success",
        description: `${userProfile.username} added as collaborator`
      });
      
    } catch (error) {
      console.error('Error inviting collaborator:', error);
      toast({
        title: "Error",
        description: "Failed to invite collaborator",
        variant: "destructive"
      });
    }
  };

  const removeCollaborator = (collaboratorId: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== collaboratorId));
  };

  const publishPost = async () => {
    if (!postId || !user) return;

    try {
      // Convert collaborative post to regular post
      const { data: collabPost } = await supabase
        .from('collaborative_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (!collabPost) return;

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: `${collabPost.content}\n\n---\nCollaborated with: ${collaborators.map(c => `@${c.username}`).join(', ')}`,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update status to published
      await supabase
        .from('collaborative_posts')
        .update({ status: 'published' })
        .eq('id', postId);

      toast({
        title: "Success",
        description: "Collaborative post published to feed"
      });

      if (onComplete) {
        onComplete(null);
      }
      
    } catch (error) {
      console.error('Error publishing post:', error);
      toast({
        title: "Error",
        description: "Failed to publish post",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary" />
            <CardTitle>
              {isCreateMode ? "Create Collaborative Post" : "Collaborative Post"}
            </CardTitle>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {collaborators.length + 1} collaborators
            </Badge>
          </div>
          
          {!isCreateMode && (
            <div className="flex items-center space-x-2">
              <Button onClick={updateCollaborativePost} disabled={isLoading}>
                <Edit className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button onClick={publishPost} disabled={isLoading}>
                <Send className="w-4 h-4 mr-2" />
                Publish
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Post Details */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title..."
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the collaboration..."
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your collaborative post..."
              className="min-h-32 w-full"
            />
          </div>
        </div>

        {/* Collaborators */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Collaborators</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Collaborator</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter username or email..."
                  />
                  <Button onClick={inviteCollaborator} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Send Invite
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Creator */}
            {user && (
              <div className="flex items-center space-x-3 p-3 bg-primary/5 rounded-lg border">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback>{user.user_metadata?.display_name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{user.user_metadata?.display_name}</p>
                  <p className="text-sm text-muted-foreground">@{user.user_metadata?.username}</p>
                </div>
                <Crown className="w-4 h-4 text-yellow-500" />
              </div>
            )}
            
            {/* Collaborators */}
            {collaborators.map((collaborator) => (
              <div key={collaborator.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg border">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={collaborator.avatar_url} />
                  <AvatarFallback>{collaborator.display_name?.[0] || collaborator.username[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{collaborator.display_name}</p>
                  <p className="text-sm text-muted-foreground">@{collaborator.username}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCollaborator(collaborator.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Updates */}
        {realTimeUpdates.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Recent Updates</h4>
            <div className="space-y-1">
              {realTimeUpdates.map((update, index) => (
                <div key={index} className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                  <span className="font-medium">{update.user}</span> {update.change} • {update.timestamp.toLocaleTimeString()}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {isCreateMode && (
          <div className="flex justify-end">
            <Button 
              onClick={createCollaborativePost} 
              disabled={isLoading || !title.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              <Users className="w-4 h-4 mr-2" />
              {isLoading ? "Creating..." : "Create Collaboration"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}