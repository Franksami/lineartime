/**
 * Motion Hooks
 * React hooks for seamless Motion library integration
 * Provides declarative animation APIs with token integration
 */

'use client';

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useSoundEffects } from '../sound-service';
import {
  type AudioVisualConfig,
  type EnhancedAnimationOptions,
  type MotionCategory,
  animate,
  animateButtonPress,
  animateCalendarEvent,
  animateLoading,
  animateModal,
  animateOnScroll,
  animatePageTransition,
  animateSpring,
  getMotionTokens,
  motionPresets,
} from './motion-system';

// Animation state management
interface AnimationState {
  isAnimating: boolean;
  progress: number;
  error?: string;
}

/**
 * Core motion hook with ref management
 */
export function useMotion<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);
  const animationRef = useRef<any>(null);
  const [state, setState] = React.useState<AnimationState>({
    isAnimating: false,
    progress: 0,
  });

  const animate = useCallback((keyframes: any, options: EnhancedAnimationOptions = {}) => {
    if (!ref.current) return null;

    setState({ isAnimating: true, progress: 0 });

    try {
      animationRef.current = animate(ref.current, keyframes, {
        ...options,
        onComplete: () => {
          setState({ isAnimating: false, progress: 1 });
          options.onComplete?.();
        },
        onUpdate: (progress) => {
          setState((prev) => ({ ...prev, progress }));
          options.onUpdate?.(progress);
        },
      });

      return animationRef.current;
    } catch (error) {
      setState({ isAnimating: false, progress: 0, error: String(error) });
      return null;
    }
  }, []);

  const stop = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop?.();
      setState({ isAnimating: false, progress: 0 });
    }
  }, []);

  return {
    ref,
    animate,
    stop,
    state,
  };
}

/**
 * Button animation hook with press feedback
 */
export function useButtonAnimation<T extends HTMLElement = HTMLButtonElement>() {
  const { ref, state } = useMotion<T>();
  const isPressed = useRef(false);
  const tokens = getMotionTokens();

  const handlePress = useCallback(
    (options: EnhancedAnimationOptions = {}) => {
      if (!ref.current || isPressed.current) return;

      isPressed.current = true;
      animateButtonPress(ref.current, {
        audio: { sound: 'success', syncTiming: true, volume: 0.1 },
        ...options,
      });

      setTimeout(() => {
        isPressed.current = false;
      }, tokens.durations.fast);
    },
    [tokens.durations.fast]
  );

  const handleHover = useCallback(
    (isHovering: boolean, options: EnhancedAnimationOptions = {}) => {
      if (!ref.current) return;

      animate(ref.current, isHovering ? motionPresets.buttonHover : { scale: 1 }, {
        duration: tokens.durations.fast / 1000,
        category: 'feedback' as MotionCategory,
        ...options,
      });
    },
    [tokens.durations.fast]
  );

  return {
    ref,
    handlePress,
    handleHover,
    isAnimating: state.isAnimating,
    progress: state.progress,
  };
}

/**
 * Modal animation hook
 */
export function useModalAnimation() {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const animationRef = useRef<any>(null);

  const open = useCallback((options: EnhancedAnimationOptions = {}) => {
    if (!modalRef.current || !backdropRef.current) return;

    setIsOpen(true);
    animationRef.current = animateModal(modalRef.current, backdropRef.current, true, {
      audio: { sound: 'notification', playOnComplete: true },
      ...options,
    });
  }, []);

  const close = useCallback((options: EnhancedAnimationOptions = {}) => {
    if (!modalRef.current || !backdropRef.current) return;

    animationRef.current = animateModal(modalRef.current, backdropRef.current, false, {
      onComplete: () => {
        setIsOpen(false);
        options.onComplete?.();
      },
      ...options,
    });
  }, []);

  return {
    modalRef,
    backdropRef,
    isOpen,
    open,
    close,
  };
}

/**
 * Scroll animation hook with Intersection Observer
 */
export function useScrollAnimation<T extends HTMLElement = HTMLElement>(
  keyframes: any,
  options: EnhancedAnimationOptions = {}
) {
  const ref = useRef<T>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  useEffect(() => {
    if (!ref.current) return;

    observerRef.current = animateOnScroll(ref.current, keyframes, {
      ...options,
      onComplete: () => {
        setIsVisible(true);
        options.onComplete?.();
      },
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [keyframes, options]);

  return {
    ref,
    isVisible,
  };
}

/**
 * Calendar event animation hook
 */
export function useCalendarEventAnimation<T extends HTMLElement = HTMLElement>() {
  const { ref, state } = useMotion<T>();

  const animateCreate = useCallback((options: EnhancedAnimationOptions = {}) => {
    if (!ref.current) return;
    return animateCalendarEvent(ref.current, 'create', options);
  }, []);

  const animateUpdate = useCallback((options: EnhancedAnimationOptions = {}) => {
    if (!ref.current) return;
    return animateCalendarEvent(ref.current, 'update', options);
  }, []);

  const animateDelete = useCallback((options: EnhancedAnimationOptions = {}) => {
    if (!ref.current) return;
    return animateCalendarEvent(ref.current, 'delete', options);
  }, []);

  return {
    ref,
    animateCreate,
    animateUpdate,
    animateDelete,
    isAnimating: state.isAnimating,
  };
}

/**
 * Page transition hook for route changes
 */
export function usePageTransition() {
  const enteringRef = useRef<HTMLDivElement>(null);
  const exitingRef = useRef<HTMLDivElement>(null);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  const transition = useCallback(
    (
      direction: 'left' | 'right' | 'up' | 'down' = 'right',
      options: EnhancedAnimationOptions = {}
    ) => {
      if (!enteringRef.current) return;

      setIsTransitioning(true);

      animatePageTransition(enteringRef.current, exitingRef.current || undefined, direction, {
        onComplete: () => {
          setIsTransitioning(false);
          options.onComplete?.();
        },
        ...options,
      });
    },
    []
  );

  return {
    enteringRef,
    exitingRef,
    transition,
    isTransitioning,
  };
}

/**
 * Loading animation hook
 */
export function useLoadingAnimation<T extends HTMLElement = HTMLElement>(
  type: 'spinner' | 'pulse' | 'skeleton' = 'pulse'
) {
  const { ref, state } = useMotion<T>();
  const animationRef = useRef<any>(null);

  const start = useCallback(
    (options: EnhancedAnimationOptions = {}) => {
      if (!ref.current || state.isAnimating) return;

      animationRef.current = animateLoading(ref.current, type, options);
    },
    [type, state.isAnimating]
  );

  const stop = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop?.();
    }
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    ref,
    start,
    stop,
    isLoading: state.isAnimating,
  };
}

/**
 * Spring animation hook for physics-based animations
 */
export function useSpringAnimation<T extends HTMLElement = HTMLElement>(
  springType: 'gentle' | 'normal' | 'bouncy' | 'stiff' = 'normal'
) {
  const { ref, state } = useMotion<T>();

  const animateSpring = useCallback(
    (keyframes: any, options: EnhancedAnimationOptions = {}) => {
      if (!ref.current) return null;
      return animateSpring(ref.current, keyframes, springType, options);
    },
    [springType]
  );

  return {
    ref,
    animateSpring,
    isAnimating: state.isAnimating,
    progress: state.progress,
  };
}

/**
 * Audio-visual sync hook
 */
export function useAudioVisualSync() {
  const { playSound } = useSoundEffects();

  const syncAnimation = useCallback(
    (
      target: HTMLElement,
      keyframes: any,
      audioConfig: AudioVisualConfig,
      options: EnhancedAnimationOptions = {}
    ) => {
      return animate(target, keyframes, {
        ...options,
        audio: audioConfig,
      });
    },
    []
  );

  return {
    syncAnimation,
    playSound,
  };
}

/**
 * Gesture-based animation hook
 */
export function useGestureAnimation<T extends HTMLElement = HTMLElement>() {
  const { ref, state } = useMotion<T>();
  const gestureState = useRef({
    isDragging: false,
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
  });

  const handleDragStart = useCallback((e: React.PointerEvent) => {
    if (!ref.current) return;

    gestureState.current.isDragging = true;
    gestureState.current.startPos = { x: e.clientX, y: e.clientY };

    // Add drag feedback
    animate(
      ref.current,
      { scale: 1.05, opacity: 0.9 },
      {
        duration: 0.1,
        category: 'feedback' as MotionCategory,
      }
    );
  }, []);

  const handleDrag = useCallback((e: React.PointerEvent) => {
    if (!gestureState.current.isDragging || !ref.current) return;

    const deltaX = e.clientX - gestureState.current.startPos.x;
    const deltaY = e.clientY - gestureState.current.startPos.y;

    animate(
      ref.current,
      { x: deltaX, y: deltaY },
      {
        duration: 0,
        category: 'feedback' as MotionCategory,
      }
    );
  }, []);

  const handleDragEnd = useCallback((options: { onRelease?: () => void } = {}) => {
    if (!gestureState.current.isDragging || !ref.current) return;

    gestureState.current.isDragging = false;

    // Snap back or complete gesture
    animateSpring(ref.current, { x: 0, y: 0, scale: 1, opacity: 1 }, 'normal', {
      category: 'interface' as MotionCategory,
      onComplete: options.onRelease,
    });
  }, []);

  return {
    ref,
    handleDragStart,
    handleDrag,
    handleDragEnd,
    isDragging: gestureState.current.isDragging,
    isAnimating: state.isAnimating,
  };
}

/**
 * Declarative animation component
 */
interface AnimatedProps {
  children: React.ReactNode;
  initial?: any;
  animate?: any;
  exit?: any;
  category?: MotionCategory;
  audio?: AudioVisualConfig;
  className?: string;
  style?: React.CSSProperties;
  onAnimationComplete?: () => void;
}

export function Animated({
  children,
  initial,
  animate: animateProps,
  exit,
  category = 'interface',
  audio,
  className,
  style,
  onAnimationComplete,
}: AnimatedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!ref.current || hasAnimated.current) return;

    if (animateProps) {
      hasAnimated.current = true;
      animate(ref.current, animateProps, {
        category,
        audio,
        onComplete: onAnimationComplete,
      });
    }
  }, [animateProps, category, audio, onAnimationComplete]);

  // Set initial state
  useEffect(() => {
    if (ref.current && initial) {
      Object.assign(ref.current.style, initial);
    }
  }, [initial]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

/**
 * Motion tokens provider hook
 */
export function useMotionTokens() {
  return useMemo(() => getMotionTokens(), []);
}

export default {
  useMotion,
  useButtonAnimation,
  useModalAnimation,
  useScrollAnimation,
  useCalendarEventAnimation,
  usePageTransition,
  useLoadingAnimation,
  useSpringAnimation,
  useAudioVisualSync,
  useGestureAnimation,
  useMotionTokens,
  Animated,
};
