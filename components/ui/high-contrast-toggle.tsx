'use client';

import { Button } from '@/components/ui/button';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { announceToScreenReader } from '@/lib/accessibility';
import { cn } from '@/lib/utils';
import { Contrast } from 'lucide-react';
import * as React from 'react';

export function HighContrastToggle() {
  const { settings, toggleSetting } = useSettingsContext();
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isHighContrast = mounted ? settings.appearance.highContrast : false;

  const handleToggle = () => {
    if (!mounted) return;
    toggleSetting('appearance', 'highContrast');
    announceToScreenReader(
      isHighContrast ? 'High contrast mode disabled' : 'High contrast mode enabled'
    );
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label={`${isHighContrast ? 'Disable' : 'Enable'} high contrast mode`}
      aria-pressed={isHighContrast}
      className={cn('transition-all', isHighContrast && 'bg-primary text-primary-foreground')}
    >
      <Contrast className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}
