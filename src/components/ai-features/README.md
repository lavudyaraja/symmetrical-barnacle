# AI Features Components

This directory contains AI-powered components that enhance the social media experience with intelligent features for content creation and interaction.

## Components Overview

### 🎭 PostToneAnalyzer
Analyzes the emotional tone of post content before publishing and provides suggestions for improvement.

**Features:**
- Real-time sentiment analysis (happy, neutral, angry, sad, excited)
- Confidence scoring for tone detection
- Contextual suggestions for tone improvement
- Visual indicators with icons and color coding

**Usage:**
```tsx
import { PostToneAnalyzer } from '@/components/ai-features';

<PostToneAnalyzer
  content={postText}
  onToneChange={(analysis) => console.log(analysis)}
  showSuggestions={true}
/>
```

**Props:**
- `content`: The text content to analyze
- `onToneChange`: Callback when tone analysis changes
- `showSuggestions`: Whether to show improvement suggestions
- `className`: Additional CSS classes

---

### 👥 AutoTagFriends
AI-powered friend detection in photos with automatic tagging suggestions.

**Features:**
- Simulated face detection in uploaded images
- Friend recognition from your contacts list
- Confidence scoring for detected matches
- Interactive tagging interface with approval/dismiss options

**Usage:**
```tsx
import { AutoTagFriends } from '@/components/ai-features';

<AutoTagFriends
  imageFile={uploadedFile}
  onTagsChange={(taggedFriends) => setTags(taggedFriends)}
/>
```

**Props:**
- `imageFile`: The uploaded image file
- `imageUrl`: URL of the image (alternative to file)
- `onTagsChange`: Callback when tagged friends change
- `className`: Additional CSS classes

---

### ✨ SmartCaptionGenerator
AI-powered caption generation with multiple style options for images and videos.

**Features:**
- Multiple caption styles (casual, professional, creative, funny, inspiring)
- Contextual hashtag suggestions
- Custom prompt support for personalized captions
- Copy and select functionality

**Usage:**
```tsx
import { SmartCaptionGenerator } from '@/components/ai-features';

<SmartCaptionGenerator
  imageFile={uploadedFile}
  context="celebrating my birthday"
  onCaptionSelect={(caption) => setPostContent(caption)}
/>
```

**Props:**
- `imageFile`: The uploaded image file
- `imageUrl`: URL of the image (alternative to file)
- `context`: Additional context about the image
- `onCaptionSelect`: Callback when a caption is selected
- `className`: Additional CSS classes

---

### 😊 EmojiRecommendation
Real-time emoji suggestions based on text content with smart contextual analysis.

**Features:**
- Context-aware emoji suggestions
- Recent emoji tracking
- Multiple categories (mood, activity, contextual, trending)
- Confidence scoring for suggestions
- Real-time analysis as user types

**Usage:**
```tsx
import { EmojiRecommendation } from '@/components/ai-features';

<EmojiRecommendation
  text={currentText}
  onEmojiSelect={(emoji) => insertEmoji(emoji)}
  position={cursorPosition}
  maxSuggestions={8}
/>
```

**Props:**
- `text`: The current text content
- `onEmojiSelect`: Callback when emoji is selected
- `onEmojiInsert`: Callback for inserting emoji at specific position
- `position`: Cursor position in text
- `maxSuggestions`: Maximum number of suggestions to show
- `className`: Additional CSS classes

## Integration Examples

### Basic Integration in CreatePost Component

```tsx
import React, { useState } from 'react';
import {
  PostToneAnalyzer,
  AutoTagFriends,
  SmartCaptionGenerator,
  EmojiRecommendation
} from '@/components/ai-features';

const CreatePost = () => {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [taggedFriends, setTaggedFriends] = useState([]);

  return (
    <div className="space-y-4">
      {/* Post Content Input */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
      />

      {/* AI Features */}
      <PostToneAnalyzer content={content} />
      
      {imageFile && (
        <>
          <AutoTagFriends
            imageFile={imageFile}
            onTagsChange={setTaggedFriends}
          />
          <SmartCaptionGenerator
            imageFile={imageFile}
            onCaptionSelect={setContent}
          />
        </>
      )}

      <EmojiRecommendation
        text={content}
        onEmojiSelect={(emoji) => setContent(content + emoji)}
      />
    </div>
  );
};
```

### Advanced Integration with Custom Hooks

```tsx
import { usePostCreation } from '@/hooks/usePostCreation';

const AdvancedCreatePost = () => {
  const {
    content,
    setContent,
    imageFile,
    tone,
    taggedFriends,
    handleImageUpload,
    handleFriendTag,
    handleCaptionGeneration
  } = usePostCreation();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Your existing post creation UI */}
      
      {/* AI Features Panel */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <h3 className="font-semibold">AI Assistance</h3>
        
        <PostToneAnalyzer
          content={content}
          onToneChange={(analysis) => console.log('Tone:', analysis)}
        />
        
        {imageFile && (
          <div className="grid grid-cols-1 gap-4">
            <AutoTagFriends
              imageFile={imageFile}
              onTagsChange={handleFriendTag}
            />
            <SmartCaptionGenerator
              imageFile={imageFile}
              onCaptionSelect={handleCaptionGeneration}
            />
          </div>
        )}
        
        <EmojiRecommendation
          text={content}
          onEmojiSelect={(emoji) => setContent(prev => prev + emoji)}
        />
      </div>
    </div>
  );
};
```

## Technical Implementation Notes

### AI Service Integration
The components currently use simulated AI responses for demonstration. In production, you would integrate with:

- **Tone Analysis**: OpenAI GPT API, Azure Text Analytics, or AWS Comprehend
- **Face Detection**: Azure Face API, AWS Rekognition, or Google Vision AI
- **Caption Generation**: OpenAI GPT-4 Vision, Google Gemini, or custom trained models
- **Emoji Suggestions**: Rule-based analysis with optional ML enhancement

### Performance Considerations

1. **Debouncing**: Text analysis is debounced to avoid excessive API calls
2. **Caching**: Recent emojis and analysis results are cached locally
3. **Lazy Loading**: Components only activate when needed
4. **Error Handling**: Graceful fallbacks when AI services are unavailable

### Data Privacy

- No text content is stored permanently
- Image analysis is performed client-side when possible
- User preferences and recent emojis are stored locally
- All AI processing respects user privacy settings

## Customization

### Styling
All components accept `className` props and use Tailwind CSS classes. You can customize:

```tsx
<PostToneAnalyzer
  className="custom-tone-analyzer"
  // ... other props
/>
```

### Behavior
Components expose callback functions for custom behavior:

```tsx
<EmojiRecommendation
  onEmojiSelect={(emoji) => {
    // Custom emoji insertion logic
    insertEmojiAtCursor(emoji, textareaRef.current);
  }}
/>
```

## Future Enhancements

- [ ] Real AI service integration
- [ ] Voice tone analysis for audio posts
- [ ] Multilingual support
- [ ] Advanced emotion detection
- [ ] Collaborative filtering for recommendations
- [ ] A/B testing for suggestion effectiveness

## Dependencies

- React 18+
- Tailwind CSS
- Lucide React (icons)
- Supabase (for friend data)
- shadcn/ui components

## Contributing

When adding new AI features:

1. Follow the existing component structure
2. Include TypeScript interfaces
3. Add comprehensive documentation
4. Implement error handling
5. Consider performance implications
6. Add usage examples