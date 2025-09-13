import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Brain } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  read: boolean;
}

interface RealTimeMessagingProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
}

export const RealTimeMessaging: React.FC<RealTimeMessagingProps> = ({
  recipientId,
  recipientName,
  recipientAvatar
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (data && !error) {
        setMessages(data);
        scrollToBottom();
      }
    };

    fetchMessages();

    // Set up real-time subscription for messages
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (
            (newMessage.sender_id === user.id && newMessage.recipient_id === recipientId) ||
            (newMessage.sender_id === recipientId && newMessage.recipient_id === user.id)
          ) {
            setMessages(prev => [...prev, newMessage]);
            scrollToBottom();
            
            // Generate smart replies for incoming messages
            if (newMessage.sender_id === recipientId) {
              generateSmartReplies(newMessage.content);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, recipientId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateSmartReplies = async (lastMessage: string) => {
    try {
      const conversation = messages.slice(-3).map(m => m.content).join('\n') + '\n' + lastMessage;
      
      const { data, error } = await supabase.functions.invoke('ai-smart-replies', {
        body: { conversation }
      });

      if (data && !error) {
        setSmartReplies(data.replies || []);
      }
    } catch (error) {
      console.error('Error generating smart replies:', error);
    }
  };

  const sendMessage = async (content: string = newMessage) => {
    if (!content.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: content.trim(),
          sender_id: user.id,
          recipient_id: recipientId
        });

      if (!error) {
        setNewMessage('');
        setSmartReplies([]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className="flex flex-col h-[600px] backdrop-blur-sm bg-card/80 border-0 shadow-xl">
      <CardHeader className="border-b">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={recipientAvatar} />
            <AvatarFallback>{recipientName[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{recipientName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {isTyping ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender_id === user?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Smart Replies */}
        {smartReplies.length > 0 && (
          <div className="px-4 py-2 border-t bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">Smart Replies</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {smartReplies.map((reply, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => sendMessage(reply)}
                >
                  {reply}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="pr-12"
              />
            </div>
            <Button onClick={() => sendMessage()} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};