import React from 'react';
import { ArrowLeft, Phone, Video, MoreVertical, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserType } from './types';

interface ConversationHeaderProps {
  participant: UserType;
  onBack: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onMenu?: () => void;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  participant,
  onBack,
  onCall,
  onVideoCall,
  onMenu
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-10 w-10 p-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-10 w-10">
          <AvatarImage src={participant.avatarUrl} />
          <AvatarFallback>
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        
        <div>
          <h2 className="font-semibold">{participant.displayName || participant.username}</h2>
          <p className="text-xs text-muted-foreground">
            {participant.isOnline ? 'Online' : `Last seen ${participant.lastSeen}`}
          </p>
        </div>
      </div>
      
      <div className="flex space-x-1">
        {onCall && (
          <Button variant="ghost" size="sm" onClick={onCall} className="h-10 w-10 p-0">
            <Phone className="h-4 w-4" />
          </Button>
        )}
        
        {onVideoCall && (
          <Button variant="ghost" size="sm" onClick={onVideoCall} className="h-10 w-10 p-0">
            <Video className="h-4 w-4" />
          </Button>
        )}
        
        {onMenu && (
          <Button variant="ghost" size="sm" onClick={onMenu} className="h-10 w-10 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

