import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { Message, Conversation, User } from './types';

class MessagingService {
  private supabase: SupabaseClient;
  private channels: Map<string, RealtimeChannel> = new Map();

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Subscribe to a conversation channel
  subscribeToConversation(conversationId: string, onMessage: (message: Message) => void) {
    const channel = this.supabase.channel(`conversation:${conversationId}`);
    
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          onMessage(payload.new as Message);
        }
      )
      .subscribe();

    this.channels.set(conversationId, channel);
    return channel;
  }

  // Unsubscribe from a conversation channel
  unsubscribeFromConversation(conversationId: string) {
    const channel = this.channels.get(conversationId);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.channels.delete(conversationId);
    }
  }

  // Send a message
  async sendMessage(conversationId: string, senderId: string, content: string, type: 'text' | 'image' | 'emoji' | 'gif' | 'voice' = 'text') {
    const { data, error } = await this.supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        type,
        status: 'sent'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }

    return data as Message;
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, userId: string) {
    const { error } = await this.supabase
      .from('messages')
      .update({ status: 'seen' })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .neq('status', 'seen');

    if (error) {
      throw new Error(`Failed to mark messages as read: ${error.message}`);
    }
  }

  // Get conversations for a user
  async getUserConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(*),
        last_message:messages(*)
      `)
      .eq('conversation_participants.user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }

    return data as unknown as Conversation[];
  }

  // Get messages for a conversation
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return data as Message[];
  }

  // Create a new conversation
  async createConversation(participantIds: string[]): Promise<Conversation> {
    // Create conversation
    const { data: conversationData, error: conversationError } = await this.supabase
      .from('conversations')
      .insert({
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (conversationError) {
      throw new Error(`Failed to create conversation: ${conversationError.message}`);
    }

    // Add participants
    const participants = participantIds.map(userId => ({
      conversation_id: conversationData.id,
      user_id: userId
    }));

    const { error: participantsError } = await this.supabase
      .from('conversation_participants')
      .insert(participants);

    if (participantsError) {
      throw new Error(`Failed to add participants: ${participantsError.message}`);
    }

    return conversationData as unknown as Conversation;
  }

  // Update typing status
  async updateTypingStatus(conversationId: string, userId: string, isTyping: boolean) {
    // This would typically use a presence channel or a separate table
    // For simplicity, we'll just emit an event
    const channel = this.channels.get(conversationId);
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, isTyping }
      });
    }
  }

  // Add reaction to a message
  async addReaction(messageId: string, userId: string, emoji: string) {
    const { data, error } = await this.supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: userId,
        emoji,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add reaction: ${error.message}`);
    }

    return data;
  }

  // Remove reaction from a message
  async removeReaction(messageId: string, userId: string, emoji: string) {
    const { error } = await this.supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji);

    if (error) {
      throw new Error(`Failed to remove reaction: ${error.message}`);
    }
  }
}

export default MessagingService;