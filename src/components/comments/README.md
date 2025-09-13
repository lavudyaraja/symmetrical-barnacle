# Comments Components

This folder contains all comment-related components for post interactions.

## Structure

### Components
- **`Comments.tsx`** - Main comments component with full comment management

### Usage

```tsx
import { Comments } from '@/components/comments';
```

## Features

### Comment Management
- **View Comments**: Display all comments for a post
- **Add Comments**: Create new comments with rich text support
- **Reply System**: Nested replies and comment threads
- **Real-time Updates**: Live comment updates across users
- **Like Comments**: Like/unlike individual comments

### Comment Features
- **User Profiles**: Display commenter avatars and usernames
- **Timestamps**: Relative time display (e.g., "2h ago")
- **Edit/Delete**: Comment owners can edit or delete their comments
- **Rich Content**: Support for emoji and formatted text
- **Pagination**: Load more comments as needed

### Integration

The Comments component is typically used within:
- Post components for inline commenting
- Modal dialogs for focused comment viewing
- Comment notification systems

## Props Interface

```tsx
interface CommentsProps {
  postId: string;        // ID of the post to show comments for
  isOpen: boolean;       // Whether comments modal/section is open
  onClose: () => void;   // Callback when comments are closed
}
```