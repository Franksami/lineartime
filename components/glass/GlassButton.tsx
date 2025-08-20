'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export interface GlassButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  liquid?: boolean;
  ripple?: boolean;
  children?: React.ReactNode;
}

const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      className,
      children,
      variant = 'default',
      size = 'md',
      loading = false,
      liquid = false,
      ripple = true,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: 'glass hover:glass-heavy',
      primary: 'bg-glass-accent/20 hover:bg-glass-accent/30 border-glass-accent/30',
      secondary: 'glass-light hover:glass',
      ghost: 'bg-transparent hover:glass-light border-transparent',
      danger: 'bg-red-500/20 hover:bg-red-500/30 border-red-500/30',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
      icon: 'p-2',
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !disabled && !loading) {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const rippleElement = document.createElement('span');
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        rippleElement.style.width = rippleElement.style.height = `${size}px`;
        rippleElement.style.left = `${x}px`;
        rippleElement.style.top = `${y}px`;
        rippleElement.className = 'absolute rounded-full bg-white/30 animate-glass-ripple pointer-events-none';

        button.appendChild(rippleElement);
        setTimeout(() => rippleElement.remove(), 600);
      }

      onClick?.(e);
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-glass font-medium',
          'transition-all duration-300 ease-out',
          'backdrop-blur-xl backdrop-saturate-150',
          'border shadow-glass',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus:outline-none focus:ring-2 focus:ring-glass-accent/50',
          variants[variant],
          sizes[size],
          liquid && 'liquid-glass',
          className
        )}
        disabled={disabled || loading}
        onClick={handleClick}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
        )}
        {children}
      </motion.button>
    );
  }
);

GlassButton.displayName = 'GlassButton';

export { GlassButton };