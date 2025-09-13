import React, { useState } from 'react';
import { 
  AIEngagementPrediction,
  AIRemixMode,
  AISmartSuggestions,
  AIStoryMoodFilters,
  AIStorySummary,
  AutoStoryCaption,
  MultiViewStories,
  VoiceToStory
} from '@/components/stories/ai-features';

const AIDemo = () => {
  const [activeTab, setActiveTab] = useState('engagement');
  
  // Mock data for components that need it
  const mockStoryContent = {
    id: 'story-1',
    mediaUrl: 'https://picsum.photos/400/600',
    mediaType: 'image' as const,
    caption: 'Beautiful sunset at the beach',
    hashtags: ['#sunset', '#beach', '#vacation']
  };

  const mockStories = [
    {
      id: 'story-1',
      content: 'Morning coffee with friends',
      media_url: 'https://picsum.photos/400/600',
      media_type: 'image',
      created_at: new Date().toISOString(),
      views_count: 120
    },
    {
      id: 'story-2',
      content: 'Work meeting in the afternoon',
      media_url: 'https://picsum.photos/401/600',
      media_type: 'image',
      created_at: new Date().toISOString(),
      views_count: 85
    }
  ];

  const handleRemixComplete = (remixedStory: any) => {
    console.log('Remix completed:', remixedStory);
  };

  const handleSuggestionApply = (suggestion: any) => {
    console.log('Suggestion applied:', suggestion);
  };

  const handleFilterApply = (filter: any, intensity: number) => {
    console.log('Filter applied:', filter, 'with intensity:', intensity);
  };

  const handleCaptionSelect = (caption: string, hashtags: string[]) => {
    console.log('Caption selected:', caption, 'with hashtags:', hashtags);
  };

  const handleStoriesCreated = (stories: any[]) => {
    console.log('Stories created:', stories);
  };

  const handleStoryGenerated = (story: any, audio?: Blob) => {
    console.log('Story generated:', story, 'with audio:', audio);
  };

  const renderComponent = () => {
    switch (activeTab) {
      case 'engagement':
        return (
          <AIEngagementPrediction
            mediaUrl={mockStoryContent.mediaUrl}
            mediaType={mockStoryContent.mediaType}
            caption={mockStoryContent.caption}
            hashtags={mockStoryContent.hashtags}
          />
        );
      case 'remix':
        return (
          <AIRemixMode
            originalStory={mockStoryContent}
            onRemixComplete={handleRemixComplete}
          />
        );
      case 'suggestions':
        return (
          <AISmartSuggestions
            content={{
              text: mockStoryContent.caption,
              mediaUrl: mockStoryContent.mediaUrl,
              mediaType: mockStoryContent.mediaType,
              caption: mockStoryContent.caption,
              hashtags: mockStoryContent.hashtags
            }}
            onSuggestionApply={handleSuggestionApply}
          />
        );
      case 'mood':
        return (
          <AIStoryMoodFilters
            mediaUrl={mockStoryContent.mediaUrl}
            mediaType={mockStoryContent.mediaType}
            onFilterApply={handleFilterApply}
          />
        );
      case 'summary':
        return (
          <AIStorySummary
            stories={mockStories}
            timeRange="24h"
          />
        );
      case 'caption':
        return (
          <AutoStoryCaption
            mediaUrl={mockStoryContent.mediaUrl}
            mediaType={mockStoryContent.mediaType}
            currentCaption={mockStoryContent.caption}
            onCaptionSelect={handleCaptionSelect}
          />
        );
      case 'multiview':
        return (
          <MultiViewStories
            onStoriesCreated={handleStoriesCreated}
          />
        );
      case 'voice':
        return (
          <VoiceToStory
            onStoryGenerated={handleStoryGenerated}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">AI Features Demo</h1>
      
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'engagement', label: 'Engagement Prediction' },
            { id: 'remix', label: 'AI Remix Mode' },
            { id: 'suggestions', label: 'Smart Suggestions' },
            { id: 'mood', label: 'Mood Filters' },
            { id: 'summary', label: 'Story Summary' },
            { id: 'caption', label: 'Auto Caption' },
            { id: 'multiview', label: 'Multi-View Stories' },
            { id: 'voice', label: 'Voice to Story' }
          ].map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border rounded-lg p-6 min-h-[500px]">
        {renderComponent()}
      </div>
    </div>
  );
};

export default AIDemo;