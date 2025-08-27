/**
 * Motion System Hook
 *
 * Custom 5KB motion system (vs 32KB Framer Motion) with audio-visual sync
 * and enterprise-grade performance optimization for CheatCal platform.
 *
 * Features:
 * - Physics-based animations with 112+ FPS targets
 * - Audio-visual synchronization
 * - Reduced motion accessibility compliance
 * - Performance monitoring and optimization
 *
 * @version 2.0.0 (CheatCal Motion System)
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

interface MotionSystem {
  // Animation utilities
  animate: (
    element: HTMLElement,
    keyframes: Keyframe[],
    options?: KeyframeAnimationOptions
  ) => Animation;
  spring: (element: HTMLElement, config: SpringConfig) => Animation;

  // Performance monitoring
  performance: {
    fps: number;
    frameTime: number;
    isOptimized: boolean;
  };

  // Audio-visual sync
  syncWithAudio: (animation: Animation, audioElement: HTMLAudioElement) => void;

  // Accessibility
  respectsReducedMotion: boolean;

  // Presets
  presets: {
    fadeIn: Keyframe[];
    slideUp: Keyframe[];
    scaleIn: Keyframe[];
    bounceIn: Keyframe[];
  };
}

interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
  velocity?: number;
}

export function useMotionSystem(): MotionSystem {
  const reducedMotion = useReducedMotion();
  const [performance, setPerformance] = useState({
    fps: 0,
    frameTime: 0,
    isOptimized: true,
  });

  const frameTimeRef = useRef<number[]>([]);

  // Monitor performance
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lastTime = performance.now();
    let frameCount = 0;

    const measurePerformance = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;

      frameTimeRef.current.push(deltaTime);
      if (frameTimeRef.current.length > 60) {
        frameTimeRef.current.shift();
      }

      frameCount++;

      if (frameCount % 60 === 0) {
        const avgFrameTime =
          frameTimeRef.current.reduce((a, b) => a + b, 0) / frameTimeRef.current.length;
        const fps = 1000 / avgFrameTime;

        setPerformance({
          fps: Math.round(fps),
          frameTime: Math.round(avgFrameTime * 100) / 100,
          isOptimized: fps >= 112,
        });
      }

      lastTime = currentTime;
      requestAnimationFrame(measurePerformance);
    };

    requestAnimationFrame(measurePerformance);
  }, []);

  // Core animation function
  const animate = useCallback(
    (
      element: HTMLElement,
      keyframes: Keyframe[],
      options: KeyframeAnimationOptions = {}
    ): Animation => {
      if (reducedMotion) {
        // For reduced motion, apply final state immediately
        const finalKeyframe = keyframes[keyframes.length - 1];
        Object.entries(finalKeyframe).forEach(([prop, value]) => {
          element.style.setProperty(prop, value as string);
        });

        // Return a mock animation
        return {
          finished: Promise.resolve(),
          cancel: () => {},
          pause: () => {},
          play: () => {},
        } as Animation;
      }

      const defaultOptions: KeyframeAnimationOptions = {
        duration: 200,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards',
        ...options,
      };

      return element.animate(keyframes, defaultOptions);
    },
    [reducedMotion]
  );

  // Spring animation with physics
  const spring = useCallback(
    (element: HTMLElement, config: SpringConfig = {}): Animation => {
      const { stiffness = 300, damping = 30, mass = 1, velocity = 0 } = config;

      // Calculate spring timing
      const omega = Math.sqrt(stiffness / mass);
      const zeta = damping / (2 * Math.sqrt(stiffness * mass));

      let duration: number;
      let easing: string;

      if (zeta < 1) {
        // Underdamped spring
        duration = (Math.PI / (omega * Math.sqrt(1 - zeta * zeta))) * 1000;
        easing = `cubic-bezier(0.175, 0.885, 0.32, ${1.275 - zeta * 0.275})`;
      } else {
        // Critically damped or overdamped
        duration = (4 / omega) * 1000;
        easing = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      }

      const keyframes: Keyframe[] = [
        { transform: 'scale(0.9)', opacity: '0' },
        { transform: 'scale(1)', opacity: '1' },
      ];

      return animate(element, keyframes, {
        duration: Math.min(duration, 800), // Cap at 800ms
        easing,
      });
    },
    [animate]
  );

  // Audio-visual synchronization
  const syncWithAudio = useCallback(
    (animation: Animation, audioElement: HTMLAudioElement) => {
      if (reducedMotion) return;

      const syncAnimation = () => {
        if (!audioElement.paused) {
          animation.play();
        } else {
          animation.pause();
        }
      };

      audioElement.addEventListener('play', syncAnimation);
      audioElement.addEventListener('pause', syncAnimation);
      audioElement.addEventListener('ended', () => animation.finish());

      // Cleanup
      return () => {
        audioElement.removeEventListener('play', syncAnimation);
        audioElement.removeEventListener('pause', syncAnimation);
      };
    },
    [reducedMotion]
  );

  // Animation presets
  const presets = {
    fadeIn: [{ opacity: '0' }, { opacity: '1' }] as Keyframe[],

    slideUp: [
      { transform: 'translateY(20px)', opacity: '0' },
      { transform: 'translateY(0)', opacity: '1' },
    ] as Keyframe[],

    scaleIn: [
      { transform: 'scale(0.9)', opacity: '0' },
      { transform: 'scale(1)', opacity: '1' },
    ] as Keyframe[],

    bounceIn: [
      { transform: 'scale(0)', opacity: '0' },
      { transform: 'scale(1.1)', opacity: '0.8', offset: 0.6 },
      { transform: 'scale(1)', opacity: '1' },
    ] as Keyframe[],
  };

  return {
    animate,
    spring,
    performance,
    syncWithAudio,
    respectsReducedMotion: reducedMotion,
    presets,
  };
}
