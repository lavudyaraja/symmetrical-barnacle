import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, X, Check, Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DetectedFriend {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface AutoTagFriendsProps {
  imageFile?: File;
  imageUrl?: string;
  onTagsChange?: (taggedFriends: DetectedFriend[]) => void;
  className?: string;
}

const AutoTagFriends: React.FC<AutoTagFriendsProps> = ({
  imageFile,
  imageUrl,
  onTagsChange,
  className = ''
}) => {
  const [detectedFriends, setDetectedFriends] = useState<DetectedFriend[]>([]);
  const [taggedFriends, setTaggedFriends] = useState<DetectedFriend[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch user's friends list
  const fetchFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get friends from follows table (mutual follows)
      const { data: friendsData, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          profiles!follows_following_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('follower_id', user.id);

      if (error) {
        console.error('Error fetching friends:', error);
        return;
      }

      setFriends(friendsData?.map(item => item.profiles) || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  // Simulate AI face detection and friend recognition
  const detectFriendsInImage = async (image: File | string): Promise<DetectedFriend[]> => {
    // This is a simulation of AI face detection
    // In a real implementation, you would:
    // 1. Send the image to an AI service (Azure Face API, AWS Rekognition, etc.)
    // 2. Get face detection results with bounding boxes
    // 3. Match detected faces with your friends database using face embeddings
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time

    // Simulate detected friends (randomly select from friends list)
    const simulatedDetections: DetectedFriend[] = [];
    
    if (friends.length > 0) {
      // Randomly detect 1-3 friends
      const numDetections = Math.floor(Math.random() * 3) + 1;
      const shuffledFriends = [...friends].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < Math.min(numDetections, shuffledFriends.length); i++) {
        const friend = shuffledFriends[i];
        simulatedDetections.push({
          id: friend.id,
          username: friend.username,
          full_name: friend.full_name,
          avatar_url: friend.avatar_url,
          confidence: Math.round((Math.random() * 30 + 70)), // 70-100% confidence
          boundingBox: {
            x: Math.random() * 60 + 10, // 10-70% from left
            y: Math.random() * 40 + 10, // 10-50% from top
            width: Math.random() * 15 + 15, // 15-30% width
            height: Math.random() * 20 + 20, // 20-40% height
          }
        });
      }
    }

    return simulatedDetections;
  };

  const handleImageAnalysis = async () => {
    if (!imageFile && !imageUrl) return;
    
    setIsAnalyzing(true);
    try {
      const detected = await detectFriendsInImage(imageFile || imageUrl!);
      setDetectedFriends(detected);
      setShowSuggestions(detected.length > 0);
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTagFriend = (friend: DetectedFriend) => {
    const updatedTags = [...taggedFriends, friend];
    setTaggedFriends(updatedTags);
    onTagsChange?.(updatedTags);
    
    // Remove from suggestions
    setDetectedFriends(prev => prev.filter(f => f.id !== friend.id));
  };

  const handleRemoveTag = (friendId: string) => {
    const updatedTags = taggedFriends.filter(f => f.id !== friendId);
    setTaggedFriends(updatedTags);
    onTagsChange?.(updatedTags);
  };

  const handleDismissSuggestion = (friendId: string) => {
    setDetectedFriends(prev => prev.filter(f => f.id !== friendId));
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  useEffect(() => {
    if ((imageFile || imageUrl) && friends.length > 0) {
      handleImageAnalysis();
    }
  }, [imageFile, imageUrl, friends]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Tagged Friends Display */}
      {taggedFriends.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {taggedFriends.map(friend => (
            <Badge
              key={friend.id}
              variant="secondary"
              className="flex items-center gap-1 py-1 px-2"
            >
              <Avatar className="w-4 h-4">
                <AvatarImage src={friend.avatar_url} />
                <AvatarFallback className="text-xs">
                  {friend.full_name?.charAt(0) || friend.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">@{friend.username}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleRemoveTag(friend.id)}
              >
                <X size={10} />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Analysis Status */}
      {isAnalyzing && (
        <Card className="border-dashed">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              <Camera size={16} />
              <span>Analyzing image for friends...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Friend Suggestions */}
      {showSuggestions && detectedFriends.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users size={16} />
              Found friends in your photo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {detectedFriends.map(friend => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-2 rounded-lg border bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={friend.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {friend.full_name?.charAt(0) || friend.username.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{friend.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{friend.username}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {friend.confidence}% match
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTagFriend(friend)}
                    className="h-8 w-8 p-0"
                  >
                    <Check size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDismissSuggestion(friend.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Manual Tag Button */}
      {(imageFile || imageUrl) && !isAnalyzing && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // This could open a manual friend selection dialog
            // For now, we'll just retrigger the analysis
            handleImageAnalysis();
          }}
          className="w-full"
        >
          <Users size={16} className="mr-2" />
          {detectedFriends.length > 0 || taggedFriends.length > 0 ? 'Re-analyze Image' : 'Detect Friends'}
        </Button>
      )}
    </div>
  );
};

export default AutoTagFriends;