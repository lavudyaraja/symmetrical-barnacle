import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Maximize2, Eye, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HoverPreviewsProps {
  src: string;
  type: 'image' | 'video';
  alt?: string;
  className?: string;
  previewDelay?: number;
  children?: React.ReactNode;
  enableFullScreen?: boolean;
  showControls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  onDownload?: () => void;
  onClick?: () => void;
}

const HoverPreviews: React.FC<HoverPreviewsProps> = ({
  src,
  type,
  alt = '',
  className = '',
  previewDelay = 500,
  children,
  enableFullScreen = true,
  showControls = true,
  autoPlay = true,
  muted = true,
  onDownload,
  onClick
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    setIsHovering(true);
    setMousePosition({ x: e.clientX, y: e.clientY });
    
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      if (isHovering) {
        setShowPreview(true);
        if (type === 'video' && videoRef.current && autoPlay) {
          videoRef.current.play().catch(() => {
            // Silently handle play promise rejection
          });
          setIsPlaying(true);
        }
      }
    }, previewDelay);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Delay hiding to allow moving to preview
    setTimeout(() => {
      if (!isHovering) {
        setShowPreview(false);
        if (type === 'video' && videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
          setIsPlaying(false);
          setCurrentTime(0);
        }
      }
    }, 100);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handlePreviewMouseEnter = () => {
    setIsHovering(true);
  };

  const handlePreviewMouseLeave = () => {
    setIsHovering(false);
    handleMouseLeave();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {
          // Handle play promise rejection
        });
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const openFullScreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'video' && videoRef.current && videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    } else if (type === 'image') {
      window.open(src, '_blank');
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload();
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getPreviewPosition = () => {
    if (!containerRef.current) return {};
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const previewWidth = 400;
    const previewHeight = type === 'video' ? 320 : 400;
    
    let left = mousePosition.x + 20;
    let top = mousePosition.y - previewHeight / 2;
    
    // Ensure preview stays within viewport bounds
    if (left + previewWidth > viewportWidth - 20) {
      left = mousePosition.x - previewWidth - 20;
    }
    
    if (top < 20) {
      top = 20;
    } else if (top + previewHeight > viewportHeight - 20) {
      top = viewportHeight - previewHeight - 20;
    }
    
    return {
      position: 'fixed' as const,
      left: `${Math.max(10, left)}px`,
      top: `${Math.max(10, top)}px`,
      zIndex: 9999,
    };
  };

  useEffect(() => {
    const handleVideoLoad = () => {
      if (videoRef.current) {
        setDuration(videoRef.current.duration || 0);
        setPreviewLoaded(true);
      }
    };

    const handleTimeUpdate = () => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime || 0);
      }
    };

    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadedmetadata', handleVideoLoad);
      video.addEventListener('timeupdate', handleTimeUpdate);
      
      return () => {
        video.removeEventListener('loadedmetadata', handleVideoLoad);
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className={cn("relative cursor-pointer group", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      >
        {children}
        
        {/* Preview indicator */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-80 transition-opacity duration-200 pointer-events-none">
          <Badge variant="secondary" className="text-xs bg-black/60 text-white border-none">
            <Eye size={10} className="mr-1" />
            Preview
          </Badge>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <Card 
          style={getPreviewPosition()} 
          className="shadow-2xl border-2 border-primary/20 bg-background/95 backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-200"
          onMouseEnter={handlePreviewMouseEnter}
          onMouseLeave={handlePreviewMouseLeave}
        >
          <CardContent className="p-0">
            {type === 'image' ? (
              <div className="relative">
                <img
                  src={src}
                  alt={alt}
                  className="w-96 h-auto max-h-80 object-cover rounded-t-lg"
                  onLoad={() => setPreviewLoaded(true)}
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  {onDownload && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleDownload}
                      className="h-7 w-7 p-0 bg-black/60 hover:bg-black/80 text-white border-none"
                    >
                      <Download size={12} />
                    </Button>
                  )}
                  {enableFullScreen && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={openFullScreen}
                      className="h-7 w-7 p-0 bg-black/60 hover:bg-black/80 text-white border-none"
                    >
                      <Maximize2 size={12} />
                    </Button>
                  )}
                </div>
                <div className="p-3 bg-background rounded-b-lg">
                  <p className="text-xs text-muted-foreground text-center">
                    Click to view full size
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <video
                  ref={videoRef}
                  src={src}
                  className="w-96 h-64 object-cover rounded-t-lg"
                  muted={isMuted}
                  loop
                  playsInline
                />
                
                {showControls && (
                  <div className="absolute bottom-12 left-0 right-0 p-3">
                    <div className="flex items-center gap-2 bg-black/80 rounded-lg px-3 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={togglePlayPause}
                        className="h-6 w-6 p-0 text-white hover:bg-white/20"
                      >
                        {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleMute}
                        className="h-6 w-6 p-0 text-white hover:bg-white/20"
                      >
                        {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                      </Button>
                      
                      {onDownload && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleDownload}
                          className="h-6 w-6 p-0 text-white hover:bg-white/20"
                        >
                          <Download size={12} />
                        </Button>
                      )}
                      
                      {enableFullScreen && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={openFullScreen}
                          className="h-6 w-6 p-0 text-white hover:bg-white/20"
                        >
                          <Maximize2 size={12} />
                        </Button>
                      )}
                      
                      <div className="flex-1 text-xs text-white font-medium min-w-0">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="p-3 bg-background rounded-b-lg">
                  <p className="text-xs text-muted-foreground text-center">
                    {isPlaying ? 'Playing preview' : 'Hover to play'} • Click for full video
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default HoverPreviews;