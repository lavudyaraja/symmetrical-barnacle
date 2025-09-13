# AI Features for Stories

This directory contains various AI-powered components designed to enhance the story creation experience.

## Components

### 1. AIEngagementPrediction
Predicts how well a story will perform based on content analysis.
- Analyzes media content, captions, and hashtags
- Provides engagement score and recommendations
- Suggests optimal posting times

### 2. AIRemixMode
Transforms stories into different creative versions.
- Multiple remix styles (Meme, Cinematic, Infographic, Artistic)
- AI-powered content transformation
- One-click remix application

### 3. AISmartSuggestions
Provides intelligent suggestions for enhancing stories.
- Sticker recommendations
- Music track suggestions
- GIF and effect recommendations
- Context-aware suggestions

### 4. AIStoryMoodFilters
Applies AI-analyzed filters based on content mood.
- Mood detection from media content
- Time-of-day appropriate filters
- Energy-level based enhancements
- Auto-apply option

### 5. AIStorySummary
Generates summaries and insights from story sequences.
- TL;DR summaries
- Highlight extraction
- Engagement analytics
- Timeline recaps

### 6. AutoStoryCaption
Automatically generates captions for stories.
- Multiple caption styles (Trendy, Casual, Professional, Funny, Inspirational)
- Hashtag suggestions
- Confidence scoring
- Custom context support

### 7. MultiViewStories
Enables recording from multiple cameras simultaneously.
- Multi-camera recording support
- Position-based media organization
- File upload alternative
- Simultaneous preview

### 8. VoiceToStory
Converts voice recordings to story content.
- Voice-to-text transcription
- AI-powered content generation
- Background and music suggestions
- Audio playback controls

## Usage

All components are exported from the `index.ts` file for easy importing:

```tsx
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
```

Each component is designed to be self-contained and can be used independently or together to create a rich, AI-enhanced story creation experience.