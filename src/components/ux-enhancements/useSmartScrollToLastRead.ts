import { useEffect, useRef, useCallback } from 'react';

interface ScrollPosition {
  elementId: string;
  scrollTop: number;
  timestamp: number;
  route: string;
}

interface UseSmartScrollToLastReadOptions {
  storageKey?: string;
  debounceMs?: number;
  maxPositions?: number;
  autoRestore?: boolean;
}

export const useSmartScrollToLastRead = (
  containerId: string,
  route: string,
  options: UseSmartScrollToLastReadOptions = {}
) => {
  const {
    storageKey = 'smartScrollPositions',
    debounceMs = 1000,
    maxPositions = 10,
    autoRestore = true
  } = options;

  const containerRef = useRef<HTMLElement | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const hasRestoredRef = useRef<boolean>(false);

  // Save scroll position to localStorage
  const saveScrollPosition = useCallback((scrollTop: number) => {
    try {
      const existingPositions: ScrollPosition[] = JSON.parse(
        localStorage.getItem(storageKey) || '[]'
      );

      const positionIndex = existingPositions.findIndex(
        pos => pos.elementId === containerId && pos.route === route
      );

      const newPosition: ScrollPosition = {
        elementId: containerId,
        scrollTop,
        timestamp: Date.now(),
        route
      };

      if (positionIndex >= 0) {
        existingPositions[positionIndex] = newPosition;
      } else {
        existingPositions.push(newPosition);
      }

      // Keep only the most recent positions
      const sortedPositions = existingPositions
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, maxPositions);

      localStorage.setItem(storageKey, JSON.stringify(sortedPositions));
    } catch (error) {
      console.warn('Failed to save scroll position:', error);
    }
  }, [containerId, route, storageKey, maxPositions]);

  // Get saved scroll position from localStorage
  const getSavedScrollPosition = useCallback((): number | null => {
    try {
      const existingPositions: ScrollPosition[] = JSON.parse(
        localStorage.getItem(storageKey) || '[]'
      );

      const position = existingPositions.find(
        pos => pos.elementId === containerId && pos.route === route
      );

      return position?.scrollTop || null;
    } catch (error) {
      console.warn('Failed to get scroll position:', error);
      return null;
    }
  }, [containerId, route, storageKey]);

  // Restore scroll position
  const restoreScrollPosition = useCallback(() => {
    if (!containerRef.current || hasRestoredRef.current) return;

    const savedPosition = getSavedScrollPosition();
    if (savedPosition !== null && savedPosition > 0) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = savedPosition;
          lastScrollTopRef.current = savedPosition;
          hasRestoredRef.current = true;
        }
      });
    }
  }, [getSavedScrollPosition]);

  // Handle scroll with debouncing
  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;
    
    lastScrollTopRef.current = scrollTop;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save operation
    saveTimeoutRef.current = setTimeout(() => {
      saveScrollPosition(scrollTop);
    }, debounceMs);
  }, [saveScrollPosition, debounceMs]);

  // Initialize and setup scroll listener
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    containerRef.current = container;

    // Restore position on mount if enabled
    if (autoRestore) {
      // Wait a bit for content to load
      const restoreTimer = setTimeout(restoreScrollPosition, 100);
      
      // Also try after a longer delay in case content is still loading
      const fallbackTimer = setTimeout(restoreScrollPosition, 1000);
      
      return () => {
        clearTimeout(restoreTimer);
        clearTimeout(fallbackTimer);
      };
    }
  }, [containerId, autoRestore, restoreScrollPosition]);

  // Setup scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  // Save position before unmount
  useEffect(() => {
    return () => {
      if (lastScrollTopRef.current > 0) {
        saveScrollPosition(lastScrollTopRef.current);
      }
    };
  }, [saveScrollPosition]);

  return {
    restoreScrollPosition,
    saveScrollPosition: (position?: number) => {
      const scrollTop = position ?? lastScrollTopRef.current;
      saveScrollPosition(scrollTop);
    },
    getSavedScrollPosition,
    clearScrollPosition: () => {
      try {
        const existingPositions: ScrollPosition[] = JSON.parse(
          localStorage.getItem(storageKey) || '[]'
        );
        
        const filteredPositions = existingPositions.filter(
          pos => !(pos.elementId === containerId && pos.route === route)
        );
        
        localStorage.setItem(storageKey, JSON.stringify(filteredPositions));
      } catch (error) {
        console.warn('Failed to clear scroll position:', error);
      }
    }
  };
};

// Hook for managing multiple scroll containers
export const useMultipleScrollPositions = () => {
  const saveAllPositions = useCallback(() => {
    const scrollableElements = document.querySelectorAll('[data-scroll-save]');
    
    scrollableElements.forEach(element => {
      const containerId = element.getAttribute('data-scroll-save');
      const route = window.location.pathname;
      
      if (containerId) {
        try {
          const storageKey = 'smartScrollPositions';
          const existingPositions: ScrollPosition[] = JSON.parse(
            localStorage.getItem(storageKey) || '[]'
          );

          const positionIndex = existingPositions.findIndex(
            pos => pos.elementId === containerId && pos.route === route
          );

          const newPosition: ScrollPosition = {
            elementId: containerId,
            scrollTop: element.scrollTop,
            timestamp: Date.now(),
            route
          };

          if (positionIndex >= 0) {
            existingPositions[positionIndex] = newPosition;
          } else {
            existingPositions.push(newPosition);
          }

          localStorage.setItem(storageKey, JSON.stringify(existingPositions));
        } catch (error) {
          console.warn('Failed to save scroll position for', containerId, error);
        }
      }
    });
  }, []);

  const restoreAllPositions = useCallback(() => {
    const scrollableElements = document.querySelectorAll('[data-scroll-save]');
    
    scrollableElements.forEach(element => {
      const containerId = element.getAttribute('data-scroll-save');
      const route = window.location.pathname;
      
      if (containerId) {
        try {
          const storageKey = 'smartScrollPositions';
          const existingPositions: ScrollPosition[] = JSON.parse(
            localStorage.getItem(storageKey) || '[]'
          );

          const position = existingPositions.find(
            pos => pos.elementId === containerId && pos.route === route
          );

          if (position && position.scrollTop > 0) {
            requestAnimationFrame(() => {
              element.scrollTop = position.scrollTop;
            });
          }
        } catch (error) {
          console.warn('Failed to restore scroll position for', containerId, error);
        }
      }
    });
  }, []);

  return {
    saveAllPositions,
    restoreAllPositions
  };
};

export default useSmartScrollToLastRead;