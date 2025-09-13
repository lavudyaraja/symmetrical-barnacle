import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

interface MessageStatusProps {
  status: 'sending' | 'sent' | 'delivered' | 'seen';
}

export const MessageStatus: React.FC<MessageStatusProps> = ({ status }) => {
  const renderStatusIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <div className="w-3 h-3 border-t-2 border-primary border-solid rounded-full animate-spin" />
        );
      case 'sent':
        return <Check className="w-3 h-3" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3" />;
      case 'seen':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center">
      {renderStatusIcon()}
    </div>
  );
};

