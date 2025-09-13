# Post Components

This folder contains all post-related components organized in a modular structure.

## Structure

### Core Components
- **`Post.tsx`** - Main post component that combines all sub-components
- **`EnhancedPost.tsx`** - Advanced post component with additional features and analytics
- **`PostHeader.tsx`** - Post header with user info, time, and dropdown menu
- **`PostContent.tsx`** - Post content and image display
- **`PostActions.tsx`** - Like, comment, share, and bookmark buttons
- **`PostModals.tsx`** - All modal dialogs (share, image preview, delete confirmation)

### Related Components
- **`CreatePost.tsx`** - Form component for creating new posts
- **`CollaborativePost.tsx`** - Component for collaborative post creation
- **`ClearPostsAdmin.tsx`** - Admin component for clearing all posts

### Utilities
- **`types.ts`** - TypeScript interfaces for post-related types
- **`utils.ts`** - Utility functions for post operations
- **`index.ts`** - Export barrel for easy imports

## Usage

### Basic Post
```tsx
import { Post } from '@/components/post/Post';

<Post
  id="post-123"
  username="john_doe"
  avatar="/avatar.jpg"
  timeAgo="2023-12-01T10:00:00Z"
  content="Hello world!"
  likes={42}
  comments={5}
/>
```

### Enhanced Post
```tsx
import { EnhancedPost } from '@/components/post/EnhancedPost';

<EnhancedPost
  id="post-123"
  username="john_doe"
  avatar="/avatar.jpg"
  timeAgo="2023-12-01T10:00:00Z"
  content="Hello world!"
  likes={42}
  comments={5}
  // Enhanced features
  viewCount={1250}
  shareCount={23}
  location="New York, NY"
  tags={["tech", "innovation", "coding"]}
  isPinned={true}
  isVerified={true}
  engagement={{
    impressions: 5000,
    clickThroughRate: 3.2,
    avgTimeSpent: 45
  }}
  theme="elevated"
  priority="featured"
  showAnalytics={true}
/>
```

### Multiple Imports
```tsx
import { Post, EnhancedPost, CreatePost } from '@/components/post';
```

## Features

### Standard Post Features
- **Like & Bookmark**: User interactions with real-time updates
- **Comments**: Threaded comment system
- **Share**: Multi-platform sharing options
- **Image Support**: Image preview with lightbox modal
- **User Actions**: Edit, delete, copy functionality
- **Responsive Design**: Mobile-first responsive layout

### Enhanced Post Features
- **Analytics Dashboard**: View impressions, CTR, and engagement metrics
- **Visual Indicators**: Pinned, promoted, and verified badges
- **Advanced Theming**: Multiple visual themes (default, minimal, elevated, compact)
- **Priority Levels**: Visual priority indicators (low, normal, high, featured)
- **Location Display**: Geographic location information
- **Tag System**: Hashtag-style tags with click functionality
- **View Metrics**: View count and share count display
- **Report System**: Content moderation and reporting
- **Reading Progress**: Progress bar for long content
- **Expandable Content**: Collapsible/expandable post view

## Component Breakdown

1. **PostHeader**: Handles user avatar, username, timestamp, and dropdown menu
2. **PostContent**: Displays post text and images with preview functionality
3. **PostActions**: Manages all user interactions (like, comment, share, bookmark)
4. **PostModals**: Contains all modal dialogs for enhanced user experience
5. **Post**: Basic orchestrating component for standard posts
6. **EnhancedPost**: Advanced component with analytics and premium features

## Enhanced Post Props

```tsx
interface EnhancedPostProps extends PostProps {
  // Metrics
  viewCount?: number;
  shareCount?: number;
  
  // Content Enhancement
  location?: string;
  tags?: string[];
  
  // Status Indicators
  isPinned?: boolean;
  isPromoted?: boolean;
  isVerified?: boolean;
  
  // Analytics
  engagement?: {
    impressions: number;
    clickThroughRate: number;
    avgTimeSpent: number;
  };
  
  // Features
  allowComments?: boolean;
  showAnalytics?: boolean;
  
  // Visual
  theme?: 'default' | 'minimal' | 'elevated' | 'compact';
  priority?: 'low' | 'normal' | 'high' | 'featured';
}
```

## Themes

- **Default**: Standard glass-card styling
- **Minimal**: Clean, borderless design
- **Elevated**: Enhanced shadow and gradient effects
- **Compact**: Reduced padding for dense layouts

## Priority Levels

- **Featured**: Ring border with gradient background
- **High**: Left border accent
- **Normal**: Standard appearance
- **Low**: Reduced opacity

This organization makes the codebase more maintainable and allows for better testing and development workflows while providing both basic and advanced post functionality.