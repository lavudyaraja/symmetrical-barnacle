import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bookmark, Folder, Plus, Edit, Trash2, Star, FolderOpen, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface BookmarkFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  postCount: number;
  isDefault?: boolean;
  createdAt: string;
}

interface BookmarkedPost {
  id: string;
  title: string;
  content: string;
  author: string;
  imageUrl?: string;
  folderId: string;
  bookmarkedAt: string;
  tags?: string[];
}

interface BookmarkFoldersProps {
  userId: string;
  initialFolders?: BookmarkFolder[];
  initialBookmarks?: BookmarkedPost[];
  onFolderCreate?: (folder: Omit<BookmarkFolder, 'id' | 'createdAt'>) => void;
  onFolderUpdate?: (folderId: string, updates: Partial<BookmarkFolder>) => void;
  onFolderDelete?: (folderId: string) => void;
  onPostMove?: (postId: string, fromFolderId: string, toFolderId: string) => void;
  className?: string;
}

const defaultColors = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 
  'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
];

const defaultIcons = ['📁', '⭐', '💼', '📚', '🎯', '💡', '🎨', '🔖'];

const BookmarkFolders: React.FC<BookmarkFoldersProps> = ({
  userId,
  initialFolders = [],
  initialBookmarks = [],
  onFolderCreate,
  onFolderUpdate,
  onFolderDelete,
  onPostMove,
  className = ''
}) => {
  const [folders, setFolders] = useState<BookmarkFolder[]>(() => {
    // Ensure there's always a default "All Bookmarks" folder
    const defaultFolder: BookmarkFolder = {
      id: 'default',
      name: 'All Bookmarks',
      description: 'All your saved posts',
      color: 'bg-gray-500',
      icon: '📌',
      postCount: initialBookmarks.length,
      isDefault: true,
      createdAt: new Date().toISOString()
    };
    
    return initialFolders.length > 0 ? initialFolders : [defaultFolder];
  });
  
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>(initialBookmarks);
  const [selectedFolder, setSelectedFolder] = useState<string>('default');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<BookmarkFolder | null>(null);
  const [newFolderData, setNewFolderData] = useState({
    name: '',
    description: '',
    color: defaultColors[0],
    icon: defaultIcons[0]
  });

  const { toast } = useToast();

  const updateFolderPostCounts = () => {
    setFolders(prev => prev.map(folder => ({
      ...folder,
      postCount: folder.isDefault 
        ? bookmarks.length 
        : bookmarks.filter(b => b.folderId === folder.id).length
    })));
  };

  const handleCreateFolder = () => {
    if (!newFolderData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a folder name.",
        variant: "destructive"
      });
      return;
    }

    const newFolder: BookmarkFolder = {
      id: `folder_${Date.now()}`,
      name: newFolderData.name.trim(),
      description: newFolderData.description.trim(),
      color: newFolderData.color,
      icon: newFolderData.icon,
      postCount: 0,
      createdAt: new Date().toISOString()
    };

    setFolders(prev => [...prev, newFolder]);
    onFolderCreate?.(newFolder);
    
    setNewFolderData({ name: '', description: '', color: defaultColors[0], icon: defaultIcons[0] });
    setShowCreateDialog(false);
    
    toast({
      title: "Folder created",
      description: `"${newFolder.name}" folder has been created.`,
    });
  };

  const handleUpdateFolder = () => {
    if (!editingFolder || !newFolderData.name.trim()) return;

    const updates = {
      name: newFolderData.name.trim(),
      description: newFolderData.description.trim(),
      color: newFolderData.color,
      icon: newFolderData.icon
    };

    setFolders(prev => prev.map(folder => 
      folder.id === editingFolder.id ? { ...folder, ...updates } : folder
    ));
    
    onFolderUpdate?.(editingFolder.id, updates);
    setEditingFolder(null);
    
    toast({
      title: "Folder updated",
      description: `"${updates.name}" has been updated.`,
    });
  };

  const handleDeleteFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder || folder.isDefault) return;

    // Move all bookmarks from this folder to default
    setBookmarks(prev => prev.map(bookmark => 
      bookmark.folderId === folderId 
        ? { ...bookmark, folderId: 'default' }
        : bookmark
    ));

    setFolders(prev => prev.filter(f => f.id !== folderId));
    onFolderDelete?.(folderId);
    
    if (selectedFolder === folderId) {
      setSelectedFolder('default');
    }

    toast({
      title: "Folder deleted",
      description: `"${folder.name}" has been deleted. Bookmarks moved to "All Bookmarks".`,
    });
  };

  const handleMovePost = (postId: string, toFolderId: string) => {
    const fromFolderId = bookmarks.find(b => b.id === postId)?.folderId;
    if (!fromFolderId || fromFolderId === toFolderId) return;

    setBookmarks(prev => prev.map(bookmark => 
      bookmark.id === postId ? { ...bookmark, folderId: toFolderId } : bookmark
    ));

    onPostMove?.(postId, fromFolderId, toFolderId);
    updateFolderPostCounts();
  };

  const getFilteredBookmarks = () => {
    if (selectedFolder === 'default') return bookmarks;
    return bookmarks.filter(bookmark => bookmark.folderId === selectedFolder);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  useEffect(() => {
    updateFolderPostCounts();
  }, [bookmarks]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Folder Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {folders.map(folder => (
          <Button
            key={folder.id}
            variant={selectedFolder === folder.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFolder(folder.id)}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <span className="text-lg">{folder.icon}</span>
            <span>{folder.name}</span>
            <Badge variant="secondary" className="text-xs">
              {folder.postCount}
            </Badge>
          </Button>
        ))}
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus size={16} className="mr-1" />
              New Folder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Folder name"
                value={newFolderData.name}
                onChange={(e) => setNewFolderData(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="Description (optional)"
                value={newFolderData.description}
                onChange={(e) => setNewFolderData(prev => ({ ...prev, description: e.target.value }))}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Icon</label>
                  <div className="grid grid-cols-4 gap-2">
                    {defaultIcons.map(icon => (
                      <Button
                        key={icon}
                        variant={newFolderData.icon === icon ? "default" : "outline"}
                        size="sm"
                        onClick={() => setNewFolderData(prev => ({ ...prev, icon }))}
                        className="text-lg"
                      >
                        {icon}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Color</label>
                  <div className="grid grid-cols-4 gap-2">
                    {defaultColors.map(color => (
                      <Button
                        key={color}
                        variant="outline"
                        size="sm"
                        onClick={() => setNewFolderData(prev => ({ ...prev, color }))}
                        className={cn("w-full h-8", color, newFolderData.color === color && "ring-2 ring-offset-2")}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder}>
                  Create Folder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Folder Management */}
      {selectedFolder !== 'default' && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{folders.find(f => f.id === selectedFolder)?.icon}</span>
                <div>
                  <h3 className="font-medium">{folders.find(f => f.id === selectedFolder)?.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {folders.find(f => f.id === selectedFolder)?.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const folder = folders.find(f => f.id === selectedFolder);
                    if (folder) {
                      setEditingFolder(folder);
                      setNewFolderData({
                        name: folder.name,
                        description: folder.description || '',
                        color: folder.color,
                        icon: folder.icon || defaultIcons[0]
                      });
                    }
                  }}
                >
                  <Edit size={14} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteFolder(selectedFolder)}
                  className="text-destructive"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookmarked Posts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {getFilteredBookmarks().map(bookmark => (
          <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              {bookmark.imageUrl && (
                <img 
                  src={bookmark.imageUrl} 
                  alt=""
                  className="w-full h-32 object-cover rounded mb-3"
                />
              )}
              
              <h4 className="font-medium mb-2 line-clamp-2">{bookmark.title}</h4>
              <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                {bookmark.content}
              </p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>by {bookmark.author}</span>
                <span>{formatDate(bookmark.bookmarkedAt)}</span>
              </div>
              
              {bookmark.tags && bookmark.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {bookmark.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                  {bookmark.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{bookmark.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <Select
                  value={bookmark.folderId}
                  onValueChange={(value) => handleMovePost(bookmark.id, value)}
                >
                  <SelectTrigger className="w-32 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>
                        <div className="flex items-center gap-2">
                          <span>{folder.icon}</span>
                          <span>{folder.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Bookmark size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {getFilteredBookmarks().length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <FolderOpen size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No bookmarks in this folder</h3>
            <p className="text-sm text-muted-foreground">
              Start saving posts to organize them in folders
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Folder Dialog */}
      <Dialog open={editingFolder !== null} onOpenChange={(open) => !open && setEditingFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Folder name"
              value={newFolderData.name}
              onChange={(e) => setNewFolderData(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="Description (optional)"
              value={newFolderData.description}
              onChange={(e) => setNewFolderData(prev => ({ ...prev, description: e.target.value }))}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Icon</label>
                <div className="grid grid-cols-4 gap-2">
                  {defaultIcons.map(icon => (
                    <Button
                      key={icon}
                      variant={newFolderData.icon === icon ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewFolderData(prev => ({ ...prev, icon }))}
                      className="text-lg"
                    >
                      {icon}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {defaultColors.map(color => (
                    <Button
                      key={color}
                      variant="outline"
                      size="sm"
                      onClick={() => setNewFolderData(prev => ({ ...prev, color }))}
                      className={cn("w-full h-8", color, newFolderData.color === color && "ring-2 ring-offset-2")}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingFolder(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateFolder}>
                Update Folder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookmarkFolders;