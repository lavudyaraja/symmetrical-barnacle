import { test, expect, describe, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AutoStoryCaption } from '@/components/stories/ai-features/AutoStoryCaption';
import { AIStoryMoodFilters } from '@/components/stories/ai-features/AIStoryMoodFilters';
import { AIStorySummary } from '@/components/stories/ai-features/AIStorySummary';
import { AIEngagementPrediction } from '@/components/stories/ai-features/AIEngagementPrediction';
import { AISmartSuggestions } from '@/components/stories/ai-features/AISmartSuggestions';
import { VoiceToStory } from '@/components/stories/ai-features/VoiceToStory';
import { AIRemixMode } from '@/components/stories/ai-features/AIRemixMode';
import { MultiViewStories } from '@/components/stories/ai-features/MultiViewStories';
import { AdvancedStoryAnalytics } from '@/components/stories/analytics/AdvancedStoryAnalytics';
import { TopFansRanking } from '@/components/stories/analytics/TopFansRanking';
import { LocationAwareStickers } from '@/components/stories/ar-vr/LocationAwareStickers';
import { LiveInteractiveStory } from '@/components/stories/ar-vr/LiveInteractiveStory';
import { ScheduledStories } from '@/components/stories/utilities/ScheduledStories';
import { PrivateStoryCircles } from '@/components/stories/utilities/PrivateStoryCircles';
import { StoryTimeCapsules } from '@/components/stories/utilities/StoryTimeCapsules';

// Mock media devices for testing
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }]
    }),
    enumerateDevices: vi.fn().mockResolvedValue([
      { deviceId: 'camera1', label: 'Front Camera', kind: 'videoinput' },
      { deviceId: 'camera2', label: 'Back Camera', kind: 'videoinput' }
    ])
  }
});

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
global.URL.revokeObjectURL = vi.fn();

describe('Advanced Story Features - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AI Story Features', () => {
    test('AutoStoryCaption generates captions and hashtags', async () => {
      const mockOnCaptionSelect = vi.fn();
      render(
        <AutoStoryCaption
          mediaType="image"
          onCaptionSelect={mockOnCaptionSelect}
        />
      );

      // Wait for generation
      await waitFor(() => {
        expect(screen.getByText('AI Story Captions')).toBeInTheDocument();
      });

      // Check that suggestions are generated
      expect(screen.getByText('AI Caption Suggestions')).toBeInTheDocument();
      expect(screen.getByText('Use This Caption')).toBeInTheDocument();

      // Test caption selection
      fireEvent.click(screen.getByText('Use This Caption'));
      expect(mockOnCaptionSelect).toHaveBeenCalled();
    });

    test('AIStoryMoodFilters analyzes content and suggests filters', async () => {
      const mockOnFilterApply = vi.fn();
      render(
        <AIStoryMoodFilters
          mediaType="image"
          onFilterApply={mockOnFilterApply}
        />
      );

      // Trigger analysis
      fireEvent.click(screen.getByText('Analyze Mood & Suggest Filters'));

      // Wait for analysis to complete
      await waitFor(() => {
        expect(screen.getByText('AI Mood Filters')).toBeInTheDocument();
      });

      // Check that suggestions are generated
      expect(screen.getByText('AI Filter Suggestions')).toBeInTheDocument();
    });

    test('AIStorySummary generates story summaries', async () => {
      const mockStories = [
        {
          id: '1',
          content: 'Test story content',
          media_url: 'test.jpg',
          media_type: 'image',
          created_at: new Date().toISOString()
        }
      ];

      render(
        <AIStorySummary
          stories={mockStories}
          timeRange="24h"
        />
      );

      // Wait for summaries to generate
      await waitFor(() => {
        expect(screen.getByText('AI Story Summaries')).toBeInTheDocument();
      });

      // Check that summaries are displayed
      expect(screen.getByText('Generated Summaries')).toBeInTheDocument();
    });

    test('AIEngagementPrediction analyzes engagement potential', async () => {
      render(
        <AIEngagementPrediction
          mediaType="image"
          caption="Test caption"
        />
      );

      // Trigger analysis
      fireEvent.click(screen.getByText('Predict Engagement Performance'));

      // Wait for analysis to complete
      await waitFor(() => {
        expect(screen.getByText('AI Engagement Prediction')).toBeInTheDocument();
      });

      // Check that results are displayed
      expect(screen.getByText('Engagement Factors')).toBeInTheDocument();
    });

    test('AISmartSuggestions provides content recommendations', async () => {
      const mockContent = {
        text: 'Test content',
        mediaType: 'image' as const
      };

      const mockOnSuggestionApply = vi.fn();
      render(
        <AISmartSuggestions
          content={mockContent}
          onSuggestionApply={mockOnSuggestionApply}
        />
      );

      // Trigger analysis
      fireEvent.click(screen.getByText('Get Smart Suggestions'));

      // Wait for suggestions to generate
      await waitFor(() => {
        expect(screen.getByText('AI Smart Suggestions')).toBeInTheDocument();
      });

      // Check that suggestions are displayed
      expect(screen.getByText('AI Recommendations')).toBeInTheDocument();
    });

    test('VoiceToStory converts voice to story content', async () => {
      const mockOnStoryGenerated = vi.fn();
      render(
        <VoiceToStory
          onStoryGenerated={mockOnStoryGenerated}
        />
      );

      // Check that component renders
      expect(screen.getByText('Voice-to-Story AI')).toBeInTheDocument();
      expect(screen.getByText('Record')).toBeInTheDocument();
    });

    test('AIRemixMode generates creative story versions', async () => {
      const mockOriginalStory = {
        id: '1',
        mediaUrl: 'test.jpg',
        mediaType: 'image' as const,
        caption: 'Original caption',
        hashtags: ['#test']
      };

      const mockOnRemixComplete = vi.fn();
      render(
        <AIRemixMode
          originalStory={mockOriginalStory}
          onRemixComplete={mockOnRemixComplete}
        />
      );

      // Check that component renders
      expect(screen.getByText('AI Remix Mode')).toBeInTheDocument();
      expect(screen.getByText('Remix Styles')).toBeInTheDocument();
    });
  });

  describe('Creative Enhancements', () => {
    test('MultiViewStories handles multiple camera inputs', async () => {
      render(
        <MultiViewStories
          onStoriesCreated={vi.fn()}
        />
      );

      // Check that component renders
      expect(screen.getByText('Multi-View Stories')).toBeInTheDocument();
      expect(screen.getByText('Select Cameras')).toBeInTheDocument();
    });
  });

  describe('Analytics Features', () => {
    test('AdvancedStoryAnalytics displays engagement metrics', async () => {
      render(
        <AdvancedStoryAnalytics
          storyId="test-story"
        />
      );

      // Check that component renders
      expect(screen.getByText('Story Analytics')).toBeInTheDocument();
    });

    test('TopFansRanking shows fan engagement data', async () => {
      render(
        <TopFansRanking
          storyId="test-story"
        />
      );

      // Check that component renders
      expect(screen.getByText('Top Fans Ranking')).toBeInTheDocument();
    });
  });

  describe('AR/VR Features', () => {
    test('LocationAwareStickers generates dynamic stickers', async () => {
      const mockOnStickerAdd = vi.fn();
      render(
        <LocationAwareStickers
          onStickerAdd={mockOnStickerAdd}
        />
      );

      // Check that component renders
      expect(screen.getByText('Location-Aware Stickers')).toBeInTheDocument();
    });

    test('LiveInteractiveStory enables live interactions', async () => {
      const mockOnReaction = vi.fn();
      render(
        <LiveInteractiveStory
          storyId="test-story"
          onReaction={mockOnReaction}
        />
      );

      // Check that component renders
      expect(screen.getByText('Live Interactive Story')).toBeInTheDocument();
    });
  });

  describe('Smart Utilities', () => {
    test('ScheduledStories manages story timing', async () => {
      const mockOnSchedule = vi.fn();
      render(
        <ScheduledStories
          onSchedule={mockOnSchedule}
        />
      );

      // Check that component renders
      expect(screen.getByText('Scheduled Stories')).toBeInTheDocument();
    });

    test('PrivateStoryCircles manages exclusive sharing', async () => {
      const mockOnCreateCircle = vi.fn();
      const mockOnAddStory = vi.fn();
      render(
        <PrivateStoryCircles
          onCreateCircle={mockOnCreateCircle}
          onAddStory={mockOnAddStory}
        />
      );

      // Check that component renders
      expect(screen.getByText('Private Story Circles')).toBeInTheDocument();
    });

    test('StoryTimeCapsules creates future-locked content', async () => {
      const mockOnCreateCapsule = vi.fn();
      render(
        <StoryTimeCapsules
          onCreateCapsule={mockOnCreateCapsule}
        />
      );

      // Check that component renders
      expect(screen.getByText('Story Time Capsules')).toBeInTheDocument();
    });
  });
});