import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Lock,
  Eye,
  Clock,
  Calendar,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface PrivateStoryCircle {
  id: string;
  name: string;
  members: Array<{
    id: string;
    username: string;
    avatarUrl: string;
  }>;
  stories: Array<{
    id: string;
    content: string;
    mediaUrl?: string;
    createdAt: Date;
  }>;
  createdAt: Date;
}

interface PrivateStoryCirclesProps {
  onCreateCircle: (circle: PrivateStoryCircle) => void;
  onAddStory: (circleId: string, story: any) => void;
  className?: string;
}

export function PrivateStoryCircles({
  onCreateCircle,
  onAddStory,
  className = ''
}: PrivateStoryCirclesProps) {
  const [circles, setCircles] = useState<PrivateStoryCircle[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [circleName, setCircleName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showMemberSelector, setShowMemberSelector] = useState(false);

  // Mock list of friends
  const friends = [
    { id: '1', username: 'alex_jones', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex' },
    { id: '2', username: 'sarah_m', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah' },
    { id: '3', username: 'mike_t', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike' },
    { id: '4', username: 'emma_l', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma' },
    { id: '5', username: 'david_k', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david' },
    { id: '6', username: 'lisa_p', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa' },
    { id: '7', username: 'james_r', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james' },
    { id: '8', username: 'anna_s', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anna' }
  ];

  // Create a new private circle
  const createCircle = () => {
    if (!circleName.trim()) {
      toast.error('Please enter a circle name');
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    const newCircle: PrivateStoryCircle = {
      id: `circle-${Date.now()}`,
      name: circleName,
      members: friends.filter(friend => selectedMembers.includes(friend.id)),
      stories: [],
      createdAt: new Date()
    };

    setCircles(prev => [...prev, newCircle]);
    onCreateCircle(newCircle);
    
    // Reset form
    setCircleName('');
    setSelectedMembers([]);
    setIsCreating(false);
    
    toast.success(`Private circle "${circleName}" created!`);
  };

  // Toggle member selection
  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Delete a circle
  const deleteCircle = (circleId: string) => {
    setCircles(prev => prev.filter(circle => circle.id !== circleId));
    toast.success('Private circle deleted');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="w-5 h-5" />
            Private Story Circles
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Share stories only with selected groups of friends
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create Circle Button */}
          <Button
            onClick={() => setIsCreating(true)}
            className="w-full"
          >
            <Users className="w-4 h-4 mr-2" />
            Create New Circle
          </Button>

          {/* Create Circle Form */}
          {isCreating && (
            <Card className="border-primary">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Create Private Circle</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCreating(false);
                      setCircleName('');
                      setSelectedMembers([]);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Circle Name</label>
                  <input
                    type="text"
                    value={circleName}
                    onChange={(e) => setCircleName(e.target.value)}
                    placeholder="e.g., Family, Best Friends, Work Colleagues"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Select Members</label>
                    <Badge variant="secondary">
                      {selectedMembers.length} selected
                    </Badge>
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                    {friends.map((friend) => (
                      <div
                        key={friend.id}
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer ${
                          selectedMembers.includes(friend.id)
                            ? 'bg-primary/10 border border-primary'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleMember(friend.id)}
                      >
                        <img
                          src={friend.avatarUrl}
                          alt={friend.username}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="text-sm">@{friend.username}</span>
                        {selectedMembers.includes(friend.id) && (
                          <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button
                  onClick={createCircle}
                  disabled={!circleName.trim() || selectedMembers.length === 0}
                  className="w-full"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Create Private Circle
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Existing Circles */}
          {circles.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Your Private Circles
              </h3>
              
              <div className="space-y-3">
                {circles.map((circle) => (
                  <Card key={circle.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Lock className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">{circle.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {circle.members.length} members
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {circle.stories.length} stories
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCircle(circle.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Member Avatars */}
                      <div className="flex -space-x-2 mb-3">
                        {circle.members.slice(0, 5).map((member) => (
                          <img
                            key={member.id}
                            src={member.avatarUrl}
                            alt={member.username}
                            className="w-8 h-8 rounded-full border-2 border-background"
                            title={member.username}
                          />
                        ))}
                        {circle.members.length > 5 && (
                          <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                            +{circle.members.length - 5}
                          </div>
                        )}
                      </div>
                      
                      <Button size="sm" className="w-full">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Add Story to Circle
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {circles.length === 0 && !isCreating && (
            <div className="text-center py-6 bg-muted rounded-lg">
              <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No private circles created yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Create a circle to share exclusive stories with select friends
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}