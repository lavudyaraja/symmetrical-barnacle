import React from 'react';
import { Message, User } from './types';
import { MessageStatus } from './MessageStatus.tsx';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  currentUser: User;
  onReply?: (message: Message) => void;
  onReact?: (message: Message, emoji: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  currentUser,
  onReply,
  onReact
}) => {
  const isCurrentUser = message.senderId === currentUser.id;
  
  const handleReply = () => {
    if (onReply) {
      onReply(message);
    }
  };

  const handleReact = (emoji: string) => {
    if (onReact) {
      onReact(message, emoji);
    }
  };

  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="relative">
            <img 
              src={message.content} 
              alt="Shared image" 
              className="max-w-xs max-h-64 rounded-lg object-cover"
            />
          </div>
        );
      case 'emoji':
        return (
          <div className="text-4xl p-2">
            {message.content}
          </div>
        );
      case 'gif':
        return (
          <div className="relative">
            <img 
              src={message.content} 
              alt="Shared GIF" 
              className="max-w-xs max-h-64 rounded-lg object-cover"
            />
          </div>
        );
      case 'voice':
        return (
          <div className="flex items-center gap-2 bg-muted p-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-foreground" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-2.21-.895-4.21-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 12a5.983 5.983 0 01-.757 2.829 1 1 0 11-1.415-1.414A3.987 3.987 0 0013 12a3.987 3.987 0 00-.172-1.172 1 1 0 010-1.414zM12 10a1 1 0 011 1 1 1 0 01-1 1 1 1 0 01-1-1 1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm">Voice message</span>
          </div>
        );
      default:
        return <p className="whitespace-pre-wrap">{message.content}</p>;
    }
  };

  return (
    <div className={cn(
      "flex mb-4",
      isCurrentUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-2xl px-4 py-2 relative",
        isCurrentUser 
          ? "bg-primary text-primary-foreground rounded-br-none" 
          : "bg-muted rounded-bl-none"
      )}>
        {/* Reply indicator */}
        {message.replyTo && (
          <div className="border-l-2 border-primary pl-2 mb-1">
            <p className="text-xs opacity-70 truncate">
              {message.replyTo.content.substring(0, 30)}...
            </p>
          </div>
        )}
        
        {renderContent()}
        
        <div className="flex items-center justify-end mt-1">
          <span className="text-xs opacity-70 mr-2">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isCurrentUser && <MessageStatus status={message.status} />}
        </div>
        
        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((reaction, index) => (
              <span 
                key={index} 
                className="text-xs bg-background/80 rounded-full px-1.5 py-0.5"
              >
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

