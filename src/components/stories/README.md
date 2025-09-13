# Stories Components

This folder contains all story-related components for the application.

## Structure

### Components
- **`StoriesSimple.tsx`** - Main stories display component with circular avatars
- **`CreateStoryModal.tsx`** - Modal component for creating new stories
- **`StoryViewer.tsx`** - Full-screen story viewer with swipe navigation

### Usage

```tsx
import { StoriesSimple, CreateStoryModal, StoryViewer } from '@/components/stories';
```

## Features

- **Story Creation**: Upload images/videos with text overlays
- **Story Viewing**: Full-screen viewing experience with touch/swipe navigation
- **Story Management**: Create, view, and manage user stories
- **Real-time Updates**: Stories update in real-time across users
- **Expiration**: Stories automatically expire after 24 hours

## Story Flow

1. User taps "+" in stories section to create new story
2. `CreateStoryModal` opens for story creation
3. User can upload media and add text
4. Story appears in `StoriesSimple` component
5. Tapping a story opens `StoryViewer` for full-screen viewing