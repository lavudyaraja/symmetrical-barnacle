import { ZoomIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { PostProps, PostHandlers, PostState } from "./types";
import { extractHashtags, separateContentAndHashtags } from "./utils";
import HoverPreviews from "@/components/ux-enhancements/HoverPreviews";

interface PostContentProps {
  post: PostProps;
  state: PostState;
  handlers: PostHandlers;
}

export function PostContent({ post, state, handlers }: PostContentProps) {
  const { content, image, media_type } = post;
  const { imageLoading, imageError } = state;
  const navigate = useNavigate();

  // Separate content and hashtags for better display
  const { cleanContent, hashtags } = separateContentAndHashtags(content);
  
  // Determine if the media is a video based on media_type field (preferred) or file extension (fallback)
  const isVideo = media_type === 'video' || (
    !media_type && image && 
    ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v']
      .some(ext => image.toLowerCase().includes(ext))
  );
  
  // Navigate to search page for hashtag
  const handleHashtagClick = (hashtag: string) => {
    navigate(`/search?q=${encodeURIComponent(`#${hashtag}`)}`);
  };
  
  // Parse content to highlight any remaining hashtags
  const parseContent = (text: string) => {
    const hashtagRegex = /(#[\w]+)/g;
    const parts = text.split(hashtagRegex);
    
    return parts.map((part, index) => {
      if (part.match(hashtagRegex)) {
        const hashtag = part.substring(1);
        return (
          <span 
            key={index} 
            className="text-primary font-medium hover:underline cursor-pointer"
            onClick={() => handleHashtagClick(hashtag)}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Content */}
      <div className="mb-4">
        <p className="text-foreground leading-relaxed">
          {parseContent(content)}
        </p>
      </div>

      {/* Image/Video */}
      {image && (
        <div className="mb-4 flex justify-center">
          <HoverPreviews
            src={image}
            type={isVideo ? 'video' : 'image'}
            alt={`${content.substring(0, 50)}... post media`}
            className="group"
            previewDelay={300}
            enableFullScreen={true}
            showControls={true}
            autoPlay={true}
            muted={true}
          >
            <div className="rounded-xl overflow-hidden cursor-pointer group relative w-full max-w-2xl h-auto shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-200/50" onClick={handlers.handleImageClick}>
            {/* Loading skeleton */}
            {imageLoading && (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse flex items-center justify-center">
                <div className="text-gray-400 text-xs sm:text-sm font-medium">Loading {isVideo ? 'video' : 'image'}...</div>
              </div>
            )}
            
            {/* Error state */}
            {imageError && (
              <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl mb-2 opacity-50">{isVideo ? '🎥' : '📷'}</div>
                  <div className="text-xs sm:text-sm font-medium">Failed to load {isVideo ? 'video' : 'image'}</div>
                </div>
              </div>
            )}
            
            {/* Actual media */}
            {!imageError && (
              <>
                {isVideo ? (
                  <div className="relative w-full h-auto group/video">
                    <video 
                      src={image} 
                      className={`w-full h-auto max-h-[70vh] object-contain transition-all duration-300 group-hover:scale-105 ${
                        imageLoading ? 'opacity-0' : 'opacity-100'
                      }`}
                      onLoadedData={handlers.handleImageLoad}
                      onError={handlers.handleImageError}
                      controls
                      muted
                      playsInline
                      preload="metadata"
                    />
                    {/* Video indicator - always visible */}
                    <div className="absolute top-2 left-2 bg-black/70 rounded px-2 py-1 text-white text-xs font-medium flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      VIDEO
                    </div>
                    {/* Play button overlay - shows when paused */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover/video:opacity-100 transition-opacity duration-300">
                      <div className="bg-black/60 rounded-full p-4">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={image} 
                    alt="Post image" 
                    className={`w-full h-auto max-h-[70vh] object-contain transition-all duration-300 group-hover:scale-105 ${
                      imageLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                    onLoad={handlers.handleImageLoad}
                    onError={handlers.handleImageError}
                    loading="lazy"
                  />
                )}
                
                {/* Overlay with zoom icon - only show when media is loaded */}
                {!imageLoading && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/95 backdrop-blur-sm rounded-full p-2 sm:p-3 shadow-lg transform scale-75 group-hover:scale-100">
                      <ZoomIn className="h-4 w-4 sm:h-6 sm:w-6 text-gray-700" />
                    </div>
                  </div>
                )}              
              </>
            )}
          </div>
          </HoverPreviews>
        </div>
      )}
    </>
  );
}