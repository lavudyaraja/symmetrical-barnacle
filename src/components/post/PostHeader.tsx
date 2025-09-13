import { MoreHorizontal, Copy, ExternalLink, Share, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { PostProps, PostHandlers } from "./types";
import { formatTimeAgo } from "./utils";

interface PostHeaderProps {
  post: PostProps;
  handlers: PostHandlers;
  isOwner: boolean;
}

export function PostHeader({ post, handlers, isOwner }: PostHeaderProps) {
  const { username, avatar, timeAgo } = post;

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <Link to={`/profile/${username}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatar} alt={username} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div>
          <Link to={`/profile/${username}`} className="hover:underline">
            <p className="font-semibold text-foreground">{username}</p>
          </Link>
          <p className="text-sm text-muted-foreground">{formatTimeAgo(timeAgo)}</p>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handlers.handleCopyContent}>
            <Copy className="mr-2 h-4 w-4" />
            Copy content
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlers.handleCopyLink}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Copy link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlers.handleShare}>
            <Share className="mr-2 h-4 w-4" />
            Share post
          </DropdownMenuItem>
          {isOwner && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handlers.handleEdit}>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit (copy)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handlers.setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete post
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}