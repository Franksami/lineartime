'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMotionValue, useTransform, useSpring } from 'framer-motion';

interface GlassMorphismOptions {
  blur?: number;
  opacity?: number;
  saturate?: number;
  interactive?: boolean;
  liquid?: boolean;
}

export function useGlassMorphism(options: GlassMorphismOptions = {}) {
  const {
    blur = 20,
    opacity = 0.2,
    saturate = 1.8,
    interactive = true,
    liquid = false,
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Motion values for interactive effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring animations for smooth transitions
  const springConfig = { damping: 25, stiffness: 300 };
  const blurValue = useSpring(blur, springConfig);
  const opacityValue = useSpring(opacity, springConfig);

  // Transform mouse position to gradient position
  const gradientX = useTransform(mouseX, (value) => `${value}%`);
  const gradientY = useTransform(mouseY, (value) => `${value}%`);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!elementRef.current || !interactive) return;

    const rect = elementRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    mouseX.set(x);
    mouseY.set(y);
  }, [interactive, mouseX, mouseY]);

  const handleMouseEnter = useCallback(() => {
    if (!interactive) return;
    setIsHovered(true);
    blurValue.set(blur * 1.2);
    opacityValue.set(opacity * 1.1);
  }, [interactive, blur, opacity, blurValue, opacityValue]);

  const handleMouseLeave = useCallback(() => {
    if (!interactive) return;
    setIsHovered(false);
    setIsPressed(false);
    blurValue.set(blur);
    opacityValue.set(opacity);
    mouseX.set(50);
    mouseY.set(50);
  }, [interactive, blur, opacity, blurValue, opacityValue, mouseX, mouseY]);

  const handleMouseDown = useCallback(() => {
    if (!interactive) return;
    setIsPressed(true);
    blurValue.set(blur * 0.9);
  }, [interactive, blur, blurValue]);

  const handleMouseUp = useCallback(() => {
    if (!interactive) return;
    setIsPressed(false);
    blurValue.set(isHovered ? blur * 1.2 : blur);
  }, [interactive, blur, isHovered, blurValue]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseup', handleMouseUp);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseEnter, handleMouseLeave, handleMouseDown, handleMouseUp]);

  const glassStyle = {
    backdropFilter: `blur(${blur}px) saturate(${saturate * 100}%)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(${saturate * 100}%)`,
    backgroundColor: `oklch(95% 0.01 200 / ${opacity})`,
  };

  const liquidStyle = liquid
    ? {
        background: `radial-gradient(circle at ${gradientX.get()} ${gradientY.get()}, oklch(90% 0.15 320 / 0.2) 0%, transparent 70%)`,
      }
    : {};

  return {
    ref: elementRef,
    style: { ...glassStyle, ...liquidStyle },
    isHovered,
    isPressed,
    mouseX,
    mouseY,
    gradientX,
    gradientY,
    blurValue,
    opacityValue,
  };
}

// Hook for parallax glass layers
export function useParallaxGlass(layers: number = 3) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getLayers = useCallback(() => {
    return Array.from({ length: layers }, (_, i) => {
      const depth = (i + 1) / layers;
      const movement = scrollY * depth * 0.5;
      const blur = 10 + (i * 5);
      const opacity = 0.1 + (i * 0.05);

      return {
        transform: `translateY(${movement}px)`,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        backgroundColor: `oklch(95% 0.01 200 / ${opacity})`,
        zIndex: layers - i,
      };
    });
  }, [layers, scrollY]);

  return getLayers();
}