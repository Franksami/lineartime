'use client';

import { useSound } from 'use-sound';
import type { NotificationSettings } from './settings/types';

// Sound file URLs - lightweight notification sounds
const SOUND_URLS = {
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
  notification: '/sounds/notification.mp3',
} as const;

export type SoundType = keyof typeof SOUND_URLS;

// Hook for playing sounds with settings integration
export function useSoundEffects(settings?: NotificationSettings) {
  const soundEnabled = settings?.sound ?? false;
  const soundVolume = settings?.soundVolume ?? 0.3;
  const soundTypes = settings?.soundTypes ?? {
    success: true,
    error: true,
    notification: true,
  };

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  // Load sound files
  const [playSuccess] = useSound(SOUND_URLS.success, {
    volume: soundVolume,
    soundEnabled: soundEnabled && soundTypes.success && !prefersReducedMotion,
  });

  const [playError] = useSound(SOUND_URLS.error, {
    volume: soundVolume,
    soundEnabled: soundEnabled && soundTypes.error && !prefersReducedMotion,
  });

  const [playNotification] = useSound(SOUND_URLS.notification, {
    volume: soundVolume,
    soundEnabled: soundEnabled && soundTypes.notification && !prefersReducedMotion,
  });

  // Play sound function with type safety
  const playSound = (type: SoundType) => {
    if (!soundEnabled || prefersReducedMotion) return;

    try {
      switch (type) {
        case 'success':
          if (soundTypes.success) playSuccess();
          break;
        case 'error':
          if (soundTypes.error) playError();
          break;
        case 'notification':
          if (soundTypes.notification) playNotification();
          break;
        default:
          console.warn(`Unknown sound type: ${type}`);
      }
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  };

  return { playSound };
}

// Standalone sound service for non-React contexts
export class SoundService {
  private settings: NotificationSettings | null = null;
  private audioContext: AudioContext | null = null;

  constructor(settings?: NotificationSettings) {
    this.settings = settings ?? null;
  }

  updateSettings(settings: NotificationSettings) {
    this.settings = settings;
  }

  async playSound(type: SoundType) {
    if (!this.settings?.sound || this.prefersReducedMotion()) {
      return;
    }

    if (!this.settings.soundTypes[type]) {
      return;
    }

    try {
      // Simple audio play without use-sound for non-React contexts
      const audio = new Audio(SOUND_URLS[type]);
      audio.volume = this.settings.soundVolume;
      await audio.play();
    } catch (error) {
      console.warn(`Failed to play ${type} sound:`, error);
    }
  }

  private prefersReducedMotion(): boolean {
    return typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
  }
}

// Global sound service instance
let globalSoundService: SoundService | null = null;

export function initializeSoundService(settings: NotificationSettings) {
  if (!globalSoundService) {
    globalSoundService = new SoundService(settings);
  } else {
    globalSoundService.updateSettings(settings);
  }
  return globalSoundService;
}

export function getSoundService(): SoundService | null {
  return globalSoundService;
}
