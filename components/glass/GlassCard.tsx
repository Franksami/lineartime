'use client';

import { forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';

export interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  variant?: 'default' | 'heavy' | 'light' | 'frosted';
  hover?: boolean;
  liquid?: boolean;
  aurora?: boolean;
  blur?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  opacity?: number;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ 
    className, 
    children, 
    variant = 'default',
    hover = true,
    liquid = false,
    aurora = false,
    blur = 'md',
    opacity,
    ...props 
  }, ref) => {
    const blurMap = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
      xl: 'backdrop-blur-xl',
      '2xl': 'backdrop-blur-2xl',
      '3xl': 'backdrop-blur-3xl',
      '4xl': 'backdrop-blur-4xl',
    };

    const variantClasses = {
      default: 'glass',
      heavy: 'glass-heavy',
      light: 'glass-light',
      frosted: 'glass-frosted',
    };

    const combinedClassName = cn(
      'rounded-glass shadow-glass glass-performance',
      variantClasses[variant],
      blurMap[blur],
      hover && 'glass-interactive hover:shadow-glass-hover',
      liquid && 'liquid-glass',
      aurora && 'aurora-glass',
      className
    );

    const style = {
      ...(opacity !== undefined && {
        backgroundColor: `oklch(95% 0.01 200 / ${opacity})`,
      }),
      ...props.style,
    };

    return (
      <motion.div
        ref={ref}
        className={combinedClassName}
        style={style}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';