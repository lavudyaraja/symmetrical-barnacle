import React from 'react';
import { cn } from '@/lib/utils';

interface MicroAnimationsProps {
  children: React.ReactNode;
  trigger?: 'hover' | 'click' | 'focus' | 'auto';
  animation?: 'pulse' | 'bounce' | 'shake' | 'glow' | 'scale' | 'slide' | 'fade' | 'spin';
  duration?: 'fast' | 'normal' | 'slow';
  delay?: number;
  disabled?: boolean;
  className?: string;
}

const animationClasses = {
  pulse: {
    fast: 'animate-pulse duration-500',
    normal: 'animate-pulse duration-1000',
    slow: 'animate-pulse duration-2000'
  },
  bounce: {
    fast: 'animate-bounce duration-300',
    normal: 'animate-bounce duration-500',
    slow: 'animate-bounce duration-1000'
  },
  shake: {
    fast: 'animate-[shake_0.3s_ease-in-out]',
    normal: 'animate-[shake_0.5s_ease-in-out]',
    slow: 'animate-[shake_0.8s_ease-in-out]'
  },
  glow: {
    fast: 'animate-[glow_0.5s_ease-in-out_infinite_alternate]',
    normal: 'animate-[glow_1s_ease-in-out_infinite_alternate]',
    slow: 'animate-[glow_2s_ease-in-out_infinite_alternate]'
  },
  scale: {
    fast: 'hover:scale-105 transition-transform duration-150',
    normal: 'hover:scale-105 transition-transform duration-300',
    slow: 'hover:scale-105 transition-transform duration-500'
  },
  slide: {
    fast: 'hover:translate-x-1 transition-transform duration-150',
    normal: 'hover:translate-x-1 transition-transform duration-300',
    slow: 'hover:translate-x-1 transition-transform duration-500'
  },
  fade: {
    fast: 'hover:opacity-80 transition-opacity duration-150',
    normal: 'hover:opacity-80 transition-opacity duration-300',
    slow: 'hover:opacity-80 transition-opacity duration-500'
  },
  spin: {
    fast: 'animate-spin duration-500',
    normal: 'animate-spin duration-1000',
    slow: 'animate-spin duration-2000'
  }
};

const MicroAnimations: React.FC<MicroAnimationsProps> = ({
  children,
  trigger = 'hover',
  animation = 'scale',
  duration = 'normal',
  delay = 0,
  disabled = false,
  className = ''
}) => {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [shouldAnimate, setShouldAnimate] = React.useState(trigger === 'auto');

  const animationClass = animationClasses[animation]?.[duration] || '';

  const handleTrigger = () => {
    if (disabled) return;
    
    setIsAnimating(true);
    setShouldAnimate(true);
    
    // Reset animation after duration
    const resetTimeout = setTimeout(() => {
      setIsAnimating(false);
      if (trigger !== 'auto') {
        setShouldAnimate(false);
      }
    }, duration === 'fast' ? 300 : duration === 'slow' ? 1000 : 500);

    return () => clearTimeout(resetTimeout);
  };

  React.useEffect(() => {
    if (trigger === 'auto' && delay > 0) {
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [trigger, delay]);

  const triggerProps = React.useMemo(() => {
    if (disabled) return {};
    
    switch (trigger) {
      case 'click':
        return { onClick: handleTrigger };
      case 'focus':
        return { onFocus: handleTrigger };
      case 'hover':
      default:
        return {};
    }
  }, [trigger, disabled]);

  return (
    <div
      className={cn(
        shouldAnimate && animationClass,
        trigger === 'hover' && !disabled && animationClass,
        className
      )}
      style={delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
      {...triggerProps}
    >
      {children}
    </div>
  );
};

// Specialized animation components
export const PulseOnLike: React.FC<{ liked: boolean; children: React.ReactNode }> = ({ liked, children }) => (
  <MicroAnimations animation="pulse" trigger={liked ? "auto" : undefined} duration="fast">
    {children}
  </MicroAnimations>
);

export const BounceOnHover: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MicroAnimations animation="bounce" trigger="hover" duration="fast">
    {children}
  </MicroAnimations>
);

export const ScaleOnHover: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <MicroAnimations animation="scale" trigger="hover" duration="normal" className={className}>
    {children}
  </MicroAnimations>
);

export const ShakeOnError: React.FC<{ error: boolean; children: React.ReactNode }> = ({ error, children }) => (
  <MicroAnimations animation="shake" trigger={error ? "auto" : undefined} duration="fast">
    {children}
  </MicroAnimations>
);

export const GlowOnFocus: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MicroAnimations animation="glow" trigger="focus" duration="normal">
    {children}
  </MicroAnimations>
);

export default MicroAnimations;