import React, { useState, useEffect, useRef } from 'react';
import { Message, User } from './types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { MessageActions } from './MessageActions';

interface MessageListProps {
  messages: Message[];
  currentUser: User;
  typingUsers: string[];
  onReply: (message: Message) => void;
  onReact: (message: Message, emoji: string) => void;
  onCopy: (message: Message) => void;
  onDelete: (message: Message) => void;
  onEdit: (message: Message) => void;
  onForward: (message: Message) => void;
  className?: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
  typingUsers,
  onReply,
  onReact,
  onCopy,
  onDelete,
  onEdit,
  onForward,
  className
}) => {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBubbleClick = (message: Message, e: React.MouseEvent) => {
    // Show actions on right-click or long-press
    if (e.type === 'contextmenu') {
      e.preventDefault();
      setSelectedMessage(message);
    }
  };

  const handleActionSelect = (action: string) => {
    if (!selectedMessage) return;
    
    switch (action) {
      case 'reply':
        onReply(selectedMessage);
        break;
      case 'copy':
        onCopy(selectedMessage);
        break;
      case 'delete':
        onDelete(selectedMessage);
        break;
      case 'edit':
        onEdit(selectedMessage);
        break;
      case 'forward':
        onForward(selectedMessage);
        break;
      default:
        break;
    }
    
    setSelectedMessage(null);
  };

  return (
    <div className={className}>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            onContextMenu={(e) => handleBubbleClick(message, e)}
          >
            <MessageBubble
              message={message}
              currentUser={currentUser}
              onReply={onReply}
              onReact={onReact}
            />
          </div>
        ))}
        
        {typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Actions Overlay */}
      {selectedMessage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedMessage(null)}
        >
          <div 
            className="bg-background rounded-lg shadow-xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageActions
              onReply={() => handleActionSelect('reply')}
              onReact={(emoji) => {
                onReact(selectedMessage, emoji);
                setSelectedMessage(null);
              }}
              onCopy={() => handleActionSelect('copy')}
              onDelete={() => handleActionSelect('delete')}
              onEdit={() => handleActionSelect('edit')}
              onForward={() => handleActionSelect('forward')}
              isCurrentUser={selectedMessage.senderId === currentUser.id}
            />
          </div>
        </div>
      )}
    </div>
  );
};