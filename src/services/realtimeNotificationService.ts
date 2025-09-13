// Real-time notification service using WebSocket Edge Function
import { supabase } from '@/integrations/supabase/client';

interface NotificationData {
  type: string;
  content: string;
  related_id?: string;
  recipientId?: string;
}

class RealtimeNotificationService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: ((data: any) => void)[] = [];

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      const wsUrl = this.getWebSocketUrl();
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected for real-time notifications');
        this.reconnectAttempts = 0;
        
        // Subscribe to notifications
        this.send({
          action: 'subscribe',
          userId: this.getCurrentUserId()
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyListeners(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.reconnect();
    }
  }

  private getWebSocketUrl(): string {
    // Convert HTTP Supabase URL to WebSocket URL for the edge function
    const supabaseUrl = "https://dvewfbkftvkcdcnlqpjm.supabase.co";
    const wsUrl = supabaseUrl.replace('https://', 'wss://') + '/functions/v1/realtime-notifications';
    return wsUrl;
  }

  private getCurrentUserId(): string | null {
    // Get current user ID from Supabase auth
    return supabase.auth.getUser().then(({ data }) => data.user?.id || null).catch(() => null) as any;
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  private notifyListeners(data: any) {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  // Public methods
  public addListener(callback: (data: any) => void) {
    this.listeners.push(callback);
  }

  public removeListener(callback: (data: any) => void) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  public sendNotification(recipientId: string, type: string, content: string, relatedId?: string) {
    this.send({
      action: 'send_notification',
      recipientId,
      notificationType: type,
      content,
      relatedId
    });
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners = [];
  }
}

// Export singleton instance
export const notificationService = new RealtimeNotificationService();