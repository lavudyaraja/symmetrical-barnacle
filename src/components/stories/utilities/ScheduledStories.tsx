import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Users, 
  Lock,
  Unlock,
  Timer,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface ScheduledStory {
  id: string;
  content: string;
  mediaUrl?: string;
  mediaType: 'image' | 'video' | 'text';
  scheduledTime: Date;
  timezone: string;
  recipients?: string[]; // For private stories
  isPrivate?: boolean;
}

interface ScheduledStoriesProps {
  onSchedule: (story: ScheduledStory) => void;
  className?: string;
}

export function ScheduledStories({
  onSchedule,
  className = ''
}: ScheduledStoriesProps) {
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [timezone, setTimezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledStories, setScheduledStories] = useState<ScheduledStory[]>([]);

  // Schedule a story
  const scheduleStory = async () => {
    if (!scheduledTime) {
      toast.error('Please select a time to schedule');
      return;
    }

    setIsScheduling(true);
    
    try {
      // Simulate scheduling process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const scheduledStory: ScheduledStory = {
        id: `scheduled-${Date.now()}`,
        content: 'This is a scheduled story',
        mediaType: 'image',
        scheduledTime: new Date(scheduledTime),
        timezone
      };

      setScheduledStories(prev => [...prev, scheduledStory]);
      onSchedule(scheduledStory);
      
      toast.success('Story scheduled successfully!');
      setScheduledTime('');
    } catch (error) {
      console.error('Error scheduling story:', error);
      toast.error('Failed to schedule story');
    } finally {
      setIsScheduling(false);
    }
  };

  // Cancel scheduled story
  const cancelScheduledStory = (id: string) => {
    setScheduledStories(prev => prev.filter(story => story.id !== id));
    toast.success('Scheduled story cancelled');
  };

  // Format date for display
  const formatScheduledTime = (date: Date) => {
    return new Date(date).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5" />
            Scheduled Stories
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Plan your stories to post at the optimal time
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scheduling Controls */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Schedule Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Australia/Sydney">Sydney</option>
                </select>
              </div>
            </div>
            
            <Button
              onClick={scheduleStory}
              disabled={isScheduling || !scheduledTime}
              className="w-full"
            >
              {isScheduling ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Timer className="w-4 h-4 mr-2" />
                  Schedule Story
                </>
              )}
            </Button>
          </div>

          {/* Scheduled Stories List */}
          {scheduledStories.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Scheduled Stories ({scheduledStories.length})
              </h3>
              
              <div className="space-y-2">
                {scheduledStories.map((story) => (
                  <Card key={story.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Scheduled Story</p>
                          <p className="text-xs text-muted-foreground">
                            {formatScheduledTime(story.scheduledTime)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {story.timezone}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelScheduledStory(story.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}