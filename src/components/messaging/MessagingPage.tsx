import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Conversation, Message, User } from './types';
import MessagingService from './MessagingService';
import { ConversationList } from './ConversationList';
import { ConversationHeader } from './ConversationHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Button } from '@/components/ui/button';
import { Search, X, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

const messagingService = new MessagingService(supabase);

export const MessagingPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<{ id: string; content: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Mock current user data
  const currentUser: User = {
    id: authUser?.id || '',
    username: authUser?.email?.split('@')[0] || 'user',
    displayName: authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || 'User',
    avatarUrl: authUser?.user_metadata?.avatar_url || '',
    isOnline: true
  };

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!authUser) return;
    
    try {
      setIsLoading(true);
      const userConversations = await messagingService.getUserConversations(authUser.id);
      setConversations(userConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const conversationMessages = await messagingService.getConversationMessages(conversationId);
      setMessages(conversationMessages);
      
      // Mark messages as read
      if (authUser) {
        await messagingService.markMessagesAsRead(conversationId, authUser.id);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [authUser]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    } else {
      setMessages([]);
    }
  }, [selectedConversation, fetchMessages]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToConversations = () => {
    setSelectedConversation(null);
  };

  const handleSendMessage = async (content: string, type: 'text' | 'image' | 'emoji' | 'gif' | 'voice' = 'text') => {
    if (!selectedConversation || !authUser) return;
    
    try {
      const newMessage = await messagingService.sendMessage(
        selectedConversation.id,
        authUser.id,
        content,
        type
      );
      
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = async (isTyping: boolean) => {
    if (!selectedConversation || !authUser) return;
    
    try {
      await messagingService.updateTypingStatus(
        selectedConversation.id,
        authUser.id,
        isTyping
      );
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo({ id: message.id, content: message.content });
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleReact = async (message: Message, emoji: string) => {
    try {
      await messagingService.addReaction(message.id, currentUser.id, emoji);
      // In a real app, you would update the message with the new reaction
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleCopy = (message: Message) => {
    navigator.clipboard.writeText(message.content);
  };

  const handleDelete = async (message: Message) => {
    // In a real app, you would delete the message from the database
    setMessages(prev => prev.filter(m => m.id !== message.id));
  };

  const handleEdit = (message: Message) => {
    // In a real app, you would show an edit input
    console.log('Edit message:', message);
  };

  const handleForward = (message: Message) => {
    // In a real app, you would show a forward dialog
    console.log('Forward message:', message);
  };

  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = conv.participants.find(p => p.id !== currentUser.id);
    return otherParticipant?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
           otherParticipant?.displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background">
      {/* Conversation List Sidebar */}
      <div className={`border-r ${selectedConversation ? 'hidden md:block' : 'w-full md:w-1/3'}`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Messages</h1>
            <Button variant="ghost" size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <ConversationList
          conversations={filteredConversations}
          currentUser={currentUser}
          onSelectConversation={handleSelectConversation}
          className="h-[calc(100vh-140px)]"
        />
      </div>
      
      {/* Message View */}
      <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
        {selectedConversation ? (
          <>
            <ConversationHeader
              participant={selectedConversation.participants.find(p => p.id !== currentUser.id) || currentUser}
              onBack={handleBackToConversations}
            />
            
            <MessageList
              messages={messages}
              currentUser={currentUser}
              typingUsers={typingUsers}
              onReply={handleReply}
              onReact={handleReact}
              onCopy={handleCopy}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onForward={handleForward}
              className="flex-1"
            />
            
            <MessageInput
              onSend={handleSendMessage}
              onTyping={handleTyping}
              replyingTo={replyingTo}
              onCancelReply={handleCancelReply}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
            <p className="text-muted-foreground">
              Choose a conversation from the list to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

