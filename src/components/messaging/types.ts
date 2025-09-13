export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'emoji' | 'gif' | 'voice';
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'seen';
  replyTo?: Message; // For message replies
  reactions?: Reaction[]; // For emoji reactions
}

export interface Reaction {
  userId: string;
  emoji: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isMuted: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}