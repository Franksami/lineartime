/**
 * Sound Effects Hook (Extended)
 *
 * Extended version of the sound effects system with additional features
 * for enhanced user feedback in CheatCal platform.
 *
 * @version 2.0.0 (CheatCal Enhanced Audio)
 */

'use client';

import { useSoundEffects as useBaseSoundEffects } from '@/lib/sound-service';
import { useCallback } from 'react';

interface EnhancedSoundEffects {
  playSound: (
    type: 'success' | 'error' | 'notification' | 'click' | 'hover' | 'achievement'
  ) => Promise<void>;
  playSequence: (sounds: string[], interval?: number) => Promise<void>;
  setVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
  isEnabled: boolean;
}

export function useSoundEffects(): EnhancedSoundEffects {
  const baseSoundEffects = useBaseSoundEffects();

  const playSound = useCallback(
    async (type: string) => {
      // Map extended types to base types
      const typeMap: Record<string, string> = {
        click: 'notification',
        hover: 'notification',
        achievement: 'success',
      };

      const soundType = typeMap[type] || type;
      return baseSoundEffects?.playSound?.(soundType as any) || Promise.resolve();
    },
    [baseSoundEffects]
  );

  const playSequence = useCallback(
    async (sounds: string[], interval = 200) => {
      for (const sound of sounds) {
        await playSound(sound);
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    },
    [playSound]
  );

  return {
    playSound: playSound as any,
    playSequence,
    setVolume: () => {}, // Implement if needed
    mute: () => {}, // Implement if needed
    unmute: () => {}, // Implement if needed
    isEnabled: true,
  };
}
