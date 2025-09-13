import React from 'react';
import { Conversation, User } from './types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ConversationListProps {
  conversations: Conversation[];
  currentUser: User;
  onSelectConversation: (conversation: Conversation) => void;
  className?: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentUser,
  onSelectConversation,
  className
}) => {
  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== currentUser.id) || currentUser;
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessage) return 'No messages yet';
    
    switch (conversation.lastMessage.type) {
      case 'image':
        return '📷 Image';
      case 'emoji':
        return conversation.lastMessage.content;
      case 'gif':
        return '🎬 GIF';
      case 'voice':
        return '🎤 Voice message';
      default:
        return conversation.lastMessage.content;
    }
  };

  return (
    <div className={className}>
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Messages</h1>
      </div>
      
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
          <p className="text-muted-foreground">
            Start a conversation with someone to see it here
          </p>
        </div>
      ) : (
        <div className="overflow-y-auto">
          {conversations.map((conversation) => {
            const otherParticipant = getOtherParticipant(conversation);
            const lastMessage = conversation.lastMessage;
            
            return (
              <div
                key={conversation.id}
                className="flex items-center p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={otherParticipant.avatarUrl} />
                    <AvatarFallback>
                      <UserIcon className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  {otherParticipant.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                  )}
                </div>
                
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between">
                    <h3 className="font-medium truncate">{otherParticipant.displayName || otherParticipant.username}</h3>
                    {lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(lastMessage.timestamp), 'HH:mm')}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-sm text-muted-foreground truncate">
                      {getLastMessagePreview(conversation)}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

