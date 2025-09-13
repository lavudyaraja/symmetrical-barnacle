import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Eye,
  Clock,
  Calendar,
  Sparkles,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface TimeCapsuleStory {
  id: string;
  content: string;
  mediaUrl?: string;
  mediaType: 'image' | 'video' | 'text';
  unlockDate: Date;
  createdAt: Date;
  isUnlocked: boolean;
}

interface StoryTimeCapsulesProps {
  onCreateCapsule: (capsule: TimeCapsuleStory) => void;
  className?: string;
}

export function StoryTimeCapsules({
  onCreateCapsule,
  className = ''
}: StoryTimeCapsulesProps) {
  const [unlockDate, setUnlockDate] = useState<string>('');
  const [timeCapsules, setTimeCapsules] = useState<TimeCapsuleStory[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Create a new time capsule
  const createCapsule = () => {
    if (!unlockDate) {
      toast.error('Please select an unlock date');
      return;
    }

    const unlockDateTime = new Date(unlockDate);
    if (unlockDateTime <= new Date()) {
      toast.error('Unlock date must be in the future');
      return;
    }

    const newCapsule: TimeCapsuleStory = {
      id: `capsule-${Date.now()}`,
      content: 'This story will unlock in the future!',
      mediaType: 'image',
      unlockDate: unlockDateTime,
      createdAt: new Date(),
      isUnlocked: false
    };

    setTimeCapsules(prev => [...prev, newCapsule]);
    onCreateCapsule(newCapsule);
    
    toast.success('Time capsule created successfully!');
    setUnlockDate('');
    setIsCreating(false);
  };

  // Calculate days until unlock
  const daysUntilUnlock = (unlockDate: Date) => {
    const today = new Date();
    const diffTime = unlockDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Format unlock date
  const formatUnlockDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5" />
            Story Time Capsules
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Create stories that unlock at a future date
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create Capsule Button */}
          <Button
            onClick={() => setIsCreating(true)}
            className="w-full"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Create Time Capsule
          </Button>

          {/* Create Capsule Form */}
          {isCreating && (
            <Card className="border-primary">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-medium">Create Story Time Capsule</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unlock Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <input
                      type="date"
                      value={unlockDate}
                      onChange={(e) => setUnlockDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select a future date when this story will become visible
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={createCapsule}
                    disabled={!unlockDate}
                    className="flex-1"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Capsule
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Time Capsules */}
          {timeCapsules.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Your Time Capsules
              </h3>
              
              <div className="space-y-3">
                {timeCapsules.map((capsule) => {
                  const daysLeft = daysUntilUnlock(capsule.unlockDate);
                  const isUnlocked = daysLeft <= 0;
                  
                  return (
                    <Card 
                      key={capsule.id} 
                      className={isUnlocked ? 'border-green-500' : ''}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              isUnlocked 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-primary/10 text-primary'
                            }`}>
                              {isUnlocked ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <Clock className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium">
                                {isUnlocked ? 'Unlocked!' : 'Locked'}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {isUnlocked 
                                  ? 'Ready to view' 
                                  : `${daysLeft} days remaining`}
                              </p>
                            </div>
                          </div>
                          
                          <Badge 
                            variant={isUnlocked ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Unlock Date: </span>
                            <span className="font-medium">
                              {formatUnlockDate(capsule.unlockDate)}
                            </span>
                          </div>
                          
                          <div className="text-sm">
                            <span className="text-muted-foreground">Created: </span>
                            <span>
                              {new Date(capsule.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        {isUnlocked ? (
                          <Button size="sm" className="w-full mt-3">
                            <Eye className="w-4 h-4 mr-2" />
                            View Story
                          </Button>
                        ) : (
                          <div className="w-full bg-muted rounded-full h-2 mt-3">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${Math.min(100, ((365 - daysLeft) / 365) * 100)}%` 
                              }}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {timeCapsules.length === 0 && !isCreating && (
            <div className="text-center py-6 bg-muted rounded-lg">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No time capsules created yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Create a time capsule to unlock a story in the future
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}