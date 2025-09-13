import { useEffect, useRef, useCallback } from "react";

interface InfiniteScrollProps {
  children: React.ReactNode;
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  className?: string;
}

export function InfiniteScroll({
  children,
  hasMore,
  loading,
  onLoadMore,
  className = ""
}: InfiniteScrollProps) {
  const observerRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    const element = observerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: "100px"
    });

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleObserver]);

  return (
    <div className={className}>
      {children}
      
      {hasMore && (
        <div
          ref={observerRef}
          className="flex items-center justify-center py-8"
        >
          {loading ? (
            <div className="animate-pulse space-y-4 w-full">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="backdrop-blur-sm bg-card/80 border-0 shadow-xl rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-muted rounded"></div>
                      <div className="w-20 h-3 bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="w-full h-4 bg-muted rounded"></div>
                    <div className="w-3/4 h-4 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">Loading more posts...</div>
          )}
        </div>
      )}
    </div>
  );
}