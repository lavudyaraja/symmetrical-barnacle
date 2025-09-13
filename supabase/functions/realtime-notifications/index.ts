// @ts-ignore - Deno imports work in runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Declare Deno global for TypeScript
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  socket.onopen = () => {
    console.log("WebSocket connection opened for notifications");
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      const { userId, action, type } = data;

      // Handle different notification actions
      switch (action) {
        case 'subscribe':
          // Subscribe user to notifications
          console.log(`User ${userId} subscribed to notifications`);
          break;
        
        case 'send_notification':
          // Send notification to specific user
          const { recipientId, notificationType, content, relatedId } = data;
          
          const { error } = await supabase
            .from('notifications')
            .insert({
              user_id: recipientId,
              type: notificationType,
              content: content,
              related_id: relatedId
            });

          if (error) {
            console.error('Error creating notification:', error);
          } else {
            // Broadcast notification
            socket.send(JSON.stringify({
              type: 'notification',
              userId: recipientId,
              data: {
                type: notificationType,
                content: content,
                related_id: relatedId,
                created_at: new Date().toISOString()
              }
            }));
          }
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  };

  socket.onclose = () => {
    console.log("WebSocket connection closed");
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  return response;
});