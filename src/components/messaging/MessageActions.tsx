import React from 'react';
import { 
  Reply, 
  Smile, 
  MoreHorizontal,
  Copy,
  Trash2,
  Edit,
  Forward
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MessageActionsProps {
  onReply: () => void;
  onReact: (emoji: string) => void;
  onCopy: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onForward: () => void;
  isCurrentUser: boolean;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  onReply,
  onReact,
  onCopy,
  onDelete,
  onEdit,
  onForward,
  isCurrentUser
}) => {
  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '👏'];

  return (
    <div className="flex items-center space-x-1 p-1 bg-background border rounded-lg shadow-lg">
      <Button
        variant="ghost"
        size="sm"
        onClick={onReply}
        className="h-8 w-8 p-0"
      >
        <Reply className="h-4 w-4" />
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="grid grid-cols-3 gap-1 w-32 p-2">
          {commonEmojis.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-lg"
              onClick={() => onReact(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={onCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </DropdownMenuItem>
          {isCurrentUser && (
            <>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem onClick={onForward}>
            <Forward className="h-4 w-4 mr-2" />
            Forward
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

