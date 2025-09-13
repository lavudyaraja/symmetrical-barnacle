import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Undo2, Trash2, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DeletedItem {
  id: string;
  type: 'post' | 'comment' | 'story';
  content: string;
  metadata?: {
    author?: string;
    timestamp?: string;
    imageUrl?: string;
    parentId?: string; // For comments
  };
  deletedAt: number;
}

interface UndoDeleteProps {
  item: DeletedItem;
  onUndo: (item: DeletedItem) => void;
  onConfirmDelete: (item: DeletedItem) => void;
  undoTimeLimit?: number; // in milliseconds
  autoHide?: boolean;
  showProgress?: boolean;
  className?: string;
}

const UndoDelete: React.FC<UndoDeleteProps> = ({
  item,
  onUndo,
  onConfirmDelete,
  undoTimeLimit = 10000, // 10 seconds
  autoHide = true,
  showProgress = true,
  className = ''
}) => {
  const [timeRemaining, setTimeRemaining] = useState(undoTimeLimit);
  const [isVisible, setIsVisible] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const progressPercentage = ((undoTimeLimit - timeRemaining) / undoTimeLimit) * 100;

  const handleUndo = async () => {
    setIsProcessing(true);
    try {
      await onUndo(item);
      setIsVisible(false);
      toast({
        title: "Restored successfully",
        description: `Your ${item.type} has been restored.`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Restore failed",
        description: `Failed to restore ${item.type}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsProcessing(true);
    try {
      await onConfirmDelete(item);
      setIsVisible(false);
    } catch (error) {
      toast({
        title: "Delete failed",
        description: `Failed to permanently delete ${item.type}.`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Auto-confirm delete when dismissed
    if (autoHide) {
      setTimeout(() => {
        onConfirmDelete(item);
      }, 500);
    }
  };

  const formatTimeRemaining = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  const getItemIcon = () => {
    switch (item.type) {
      case 'post':
        return '📝';
      case 'comment':
        return '💬';
      case 'story':
        return '📖';
      default:
        return '📄';
    }
  };

  const truncateContent = (content: string, maxLength = 60) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  };

  useEffect(() => {
    if (!autoHide) return;

    // Start countdown timer
    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          // Time's up - auto confirm delete
          clearInterval(intervalRef.current!);
          setIsVisible(false);
          setTimeout(() => {
            onConfirmDelete(item);
          }, 500);
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [autoHide, item, onConfirmDelete]);

  if (!isVisible) {
    return null;
  }

  return (
    <Card className={cn(
      "fixed bottom-4 right-4 z-50 w-96 shadow-lg border-l-4 border-l-orange-500",
      "animate-in slide-in-from-bottom-2 duration-300",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle size={16} className="text-orange-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getItemIcon()}</span>
              <h4 className="text-sm font-medium capitalize">
                {item.type} deleted
              </h4>
              {autoHide && (
                <Badge variant="outline" className="text-xs">
                  {formatTimeRemaining(timeRemaining)}
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">
              "{truncateContent(item.content)}"
            </p>
            
            {item.metadata?.author && (
              <p className="text-xs text-muted-foreground mb-2">
                by {item.metadata.author}
              </p>
            )}

            {showProgress && autoHide && (
              <Progress 
                value={progressPercentage} 
                className="h-1 mb-3"
              />
            )}
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleUndo}
                disabled={isProcessing}
                className="h-7 text-xs"
              >
                <Undo2 size={12} className="mr-1" />
                {isProcessing ? 'Restoring...' : 'Undo'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isProcessing}
                className="h-7 text-xs"
              >
                <CheckCircle size={12} className="mr-1" />
                Delete permanently
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                disabled={isProcessing}
                className="h-7 w-7 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Hook for managing multiple undo operations
export const useUndoDelete = () => {
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);

  const addDeletedItem = (item: Omit<DeletedItem, 'deletedAt'>) => {
    const deletedItem: DeletedItem = {
      ...item,
      deletedAt: Date.now()
    };
    setDeletedItems(prev => [...prev, deletedItem]);
    return deletedItem;
  };

  const removeDeletedItem = (itemId: string) => {
    setDeletedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const clearExpiredItems = (timeLimit = 10000) => {
    const now = Date.now();
    setDeletedItems(prev => 
      prev.filter(item => now - item.deletedAt < timeLimit)
    );
  };

  return {
    deletedItems,
    addDeletedItem,
    removeDeletedItem,
    clearExpiredItems
  };
};

// Component for rendering multiple undo notifications
interface UndoDeleteManagerProps {
  deletedItems: DeletedItem[];
  onUndo: (item: DeletedItem) => void;
  onConfirmDelete: (item: DeletedItem) => void;
  undoTimeLimit?: number;
  maxVisible?: number;
}

export const UndoDeleteManager: React.FC<UndoDeleteManagerProps> = ({
  deletedItems,
  onUndo,
  onConfirmDelete,
  undoTimeLimit = 10000,
  maxVisible = 3
}) => {
  // Show only the most recent items
  const visibleItems = deletedItems
    .sort((a, b) => b.deletedAt - a.deletedAt)
    .slice(0, maxVisible);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {visibleItems.map((item, index) => (
        <div
          key={item.id}
          style={{
            transform: `translateY(-${index * 10}px)`,
            zIndex: 50 - index
          }}
        >
          <UndoDelete
            item={item}
            onUndo={onUndo}
            onConfirmDelete={onConfirmDelete}
            undoTimeLimit={undoTimeLimit}
          />
        </div>
      ))}
      
      {deletedItems.length > maxVisible && (
        <Card className="w-96 bg-muted/50">
          <CardContent className="p-2 text-center">
            <p className="text-xs text-muted-foreground">
              +{deletedItems.length - maxVisible} more deleted items
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UndoDelete;